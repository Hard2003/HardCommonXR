# TCXR Cares - Deployment Strategy Guide

## Overview
This document outlines strategies for deploying the TCXR Cares Educational Management System to production environments.

## Current Architecture
- **Frontend**: React 18 SPA (Single Page Application)
- **Backend**: Python HTTP Server with MySQL connector
- **Database**: MySQL 8.0
- **Containerization**: Docker & Docker Compose

## Deployment Options

### Option 1: Cloud-Native Deployment (AWS ECS) - RECOMMENDED
**Best for**: Scalability, managed infrastructure, enterprise use

#### Infrastructure Components
1. **AWS RDS** (MySQL Database)
   - Managed MySQL 8.0 instance
   - Automatic backups and replication
   - Enhanced security with VPC
   - Multi-AZ for high availability

2. **AWS ECR** (Elastic Container Registry)
   - Private container registry
   - Host backend and frontend images

3. **AWS ECS** (Elastic Container Service)
   - Orchestrate Docker containers
   - Auto-scaling capabilities
   - Load balancer integration

4. **AWS S3 + CloudFront**
   - Host React frontend as static files
   - CDN for fast content delivery globally

5. **AWS RDS Secrets Manager**
   - Secure credential storage
   - Automatic rotation

#### Deployment Steps
```bash
# 1. Build and push Docker images to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com

docker build -t tcxr-backend ./backend
docker tag tcxr-backend:latest <AWS_ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/tcxr-backend:latest
docker push <AWS_ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/tcxr-backend:latest

# 2. Build React production bundle
cd src
npm run build

# 3. Upload to S3 and invalidate CloudFront
aws s3 sync build/ s3://tcxr-frontend-bucket/
aws cloudfront create-invalidation --distribution-id <DISTRIBUTION_ID> --paths "/*"

# 4. Deploy via ECS (use CloudFormation or Terraform)
```

#### Cost Estimate (Monthly)
- RDS MySQL: $50-150
- ECS Fargate: $30-100
- CloudFront: $0.085/GB (variable)
- **Total: ~$100-300/month**

---

### Option 2: Heroku Deployment
**Best for**: Quick deployment, small teams, low traffic

#### Advantages
- Zero infrastructure management
- Git-based deployment (auto-deploy on push)
- Integrated CI/CD
- Free tier available (limited)

#### Deployment Steps
```bash
# 1. Create Heroku account and install CLI
# 2. Create app for backend
heroku create tcxr-backend

# 3. Add-ons: Heroku Postgres (or MySQL via ClearDB)
heroku addons:create cleardb:ignite

# 4. Set environment variables
heroku config:set DB_HOST=<mysql_host> DB_USER=<user> DB_PASSWORD=<pass>

# 5. Deploy backend
git push heroku main

# 6. Deploy frontend (separate Heroku app or Netlify)
#    Option A: Heroku
heroku create tcxr-frontend
npm run build
# Configure static site serving
git push heroku main

#    Option B: Netlify (recommended for React)
npm install -g netlify-cli
netlify deploy
```

#### Cost Estimate (Monthly)
- Free: $0 (limited)
- Standard: $50-200
- **Total: $50-200/month**

---

### Option 3: DigitalOcean App Platform
**Best for**: Balance of simplicity and control

#### Setup
```bash
# 1. Create DigitalOcean account
# 2. Create App from GitHub repository
# 3. Configure services:
#    - Web Service (backend)
#    - Static Site (frontend)
#    - Managed Database (MySQL)

# 4. Environment variables in DO control panel
DB_HOST=<db-cluster-endpoint>
DB_USER=admin
DB_PASSWORD=<secure_password>
JWT_SECRET=<random_secret>
SERVER_HOST=0.0.0.0
```

#### Cost Estimate (Monthly)
- App Platform: $12-20
- Managed MySQL: $25-50
- **Total: $35-70/month**

---

### Option 4: Self-Hosted VPS (DigitalOcean, Linode, AWS EC2)
**Best for**: Full control, custom requirements, cost-conscious

#### Setup on Ubuntu 20.04 VPS
```bash
# 1. Install Docker
curl -sSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Clone repository
git clone <your-repo> /app/tcxr
cd /app/tcxr

# 4. Create .env file (production)
cat > .env << EOF
DB_HOST=mysql
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=$(openssl rand -base64 32)
DB_NAME=tcxr_cares
JWT_SECRET=$(openssl rand -base64 32)
SERVER_HOST=0.0.0.0
EOF

# 5. Update docker-compose for production
#    - Remove local volume, use named volumes
#    - Add restart policies
#    - Add health checks
#    - Use environment files

# 6. Start services
docker-compose up -d

# 7. Setup Nginx reverse proxy
sudo apt install nginx
# Configure ngx_http_proxy_module to forward to backend:3080
# Configure static site serving for React build files

# 8. Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com

# 9. Enable UFW firewall
sudo ufw enable
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
```

#### Cost Estimate (Monthly)
- VPS (2CPU, 4GB RAM): $12-20/month
- **Total: $12-20/month**

---

## Environment Variables Configuration

### Production `.env` Example
```env
# Database
DB_HOST=prod-mysql.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=<GENERATE_SECURE_PASSWORD>
DB_NAME=tcxr_cares

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=3080

# Security
JWT_SECRET=<GENERATE_RANDOM_TOKEN>

# Frontend API
REACT_APP_API_BASE=https://api.yourdomain.com
```

### Generating Secure Secrets
```bash
# Generate secure passwords/secrets
openssl rand -base64 32
```

---

## Database Backup & Disaster Recovery

### Automate MySQL Backups
```bash
#!/bin/bash
# backup.sh - Run daily via cron
BACKUP_DIR="/backups/mysql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

docker exec tcxr_mysql mysqldump -u admin -padmin123 tcxr_cares > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

### Cron Job
```bash
0 2 * * * /path/to/backup.sh
```

---

## Monitoring & Logging

### Production Monitoring Checklist
1. **Application Performance Monitoring (APM)**
   - NewRelic, Datadog, or CloudWatch
   - Track API response times, error rates
   - Monitor resource usage

2. **Database Monitoring**
   - Query performance
   - Connection pool status
   - Backup success verification

3. **Log Aggregation**
   - ELK Stack (Elasticsearch, Logstash, Kibana) or
   - CloudWatch Logs or
   - Splunk

4. **Alerts**
   - CPU usage > 80%
   - Memory usage > 85%
   - Database connection pool exhausted
   - Failed API requests > 5% of traffic

### Example: CloudWatch Alarms
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name tcxr-high-cpu \
  --alarm-actions arn:aws:sns:us-east-1:123456789:alerts \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80.0 \
  --comparison-operator GreaterThanThreshold
```

---

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Build backend image
        run: docker build -t tcxr-backend:${{ github.sha }} ./backend
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker tag tcxr-backend:${{ github.sha }} $ECR_REGISTRY/tcxr-backend:latest
          docker push $ECR_REGISTRY/tcxr-backend:latest
      
      - name: Build React
        run: |
          cd src
          npm install
          npm run build
      
      - name: Deploy to S3
        run: |
          aws s3 sync src/build s3://tcxr-frontend-bucket/
          aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*"
    
    env:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      ECR_REGISTRY: ${{ secrets.ECR_REGISTRY }}
```

---

## Security Checklist

- [ ] JWT secrets rotated regularly
- [ ] Database credentials in secrets manager (not hardcoded)
- [ ] HTTPS/TLS enforced
- [ ] CORS properly configured (not `*`)
- [ ] SQL injection protection (parameterized queries ✓)
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all endpoints
- [ ] Firewall whitelist configured
- [ ] Regular security audits scheduled
- [ ] Automated dependency updates enabled
- [ ] Container image scanning enabled
- [ ] Database encryption at rest enabled

---

## Scaling Strategies

### Vertical Scaling
- Increase CPU/RAM on single instance
- Simple but has limits

### Horizontal Scaling
1. **Load Balancing**
   - AWS ELB, NGINX
   - Distribute traffic across multiple instances

2. **Database Replication**
   - Read replicas for scaling reads
   - Master-slave setup

3. **Caching Layer**
   - Redis for session/API response caching
   - Reduces database load

4. **CDN**
   - CloudFront, Cloudflare
   - Cache static assets globally

---

## Recommended Deployment Path

1. **Development**: Local Docker Compose (current setup)
2. **Staging**: DigitalOcean App Platform ($35-70/mo)
3. **Production**: AWS ECS + RDS ($100-300/mo)

---

## Support & Troubleshooting

### Common Issues

**Backend not accessible**
```bash
# Check if container is running
docker ps

# Check logs
docker logs tcxr_backend

# Verify port binding
netstat -tlnp | grep 3080
```

**Database connection errors**
```bash
# Test connection
docker exec tcxr_mysql mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1"
```

**React build fails**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Version History
- **v1.0** (March 24, 2026) - Initial deployment guide
