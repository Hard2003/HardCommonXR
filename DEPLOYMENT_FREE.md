# 🚀 COMPLETELY FREE DEPLOYMENT GUIDE

## **Best Free Option: Oracle Cloud Always-Free VM**

Oracle Cloud offers **permanent free tier** with:
- 2x Compute instances (1 vCPU, 1GB RAM each)
- 20GB block storage
- MySQL database (NOT free, but you can use VM)
- **100% Free** - No credit card charges ever (even after expiration)

---

## **Step-by-Step: Deploy to Oracle Cloud Free Tier**

### **1. Create Oracle Cloud Account (5 minutes)**

1. Go to https://www.oracle.com/cloud/free/
2. Click "Start free trial"
3. Sign up with email and create account
4. **Important:** Use free tier ($0/month)
5. Verify email and set up payment method (won't charge)

---

### **2. Create Compute Instance (10 minutes)**

1. Login to Oracle Cloud Console
2. Click **Compute** → **Instances** → **Create Instance**

**Configuration:**
```
Name: tcxr-app
Image: Ubuntu 22.04 (Always Free eligible)
Shape: Ampere (ARM-based, free tier)
   - vCPU: 2
   - Memory: 12GB (free tier allows)
OCPU Count: 2
Storage: 40GB (free)
```

**Network:**
- Subnet: Create new or use default
- Assign public IP: ✅ **CHECK THIS**

3. Click **Create**
4. **SAVE THE SSH KEY** (auto-generated, download it)

---

### **3. Access Your Server (via SSH)**

**On Windows (PowerShell):**

```powershell
# Navigate to key folder
cd Desktop

# Fix key permissions
icacls "oracle-key.key" /grant:r "%username%:(F)"
icacls "oracle-key.key" /inheritance:r

# Connect to server
ssh -i oracle-key.key ubuntu@YOUR_PUBLIC_IP

# Example:
# ssh -i oracle-key.key ubuntu@141.147.123.45
```

**On Mac/Linux:**
```bash
chmod 600 oracle-key.key
ssh -i oracle-key.key ubuntu@YOUR_PUBLIC_IP
```

**Find Your IP:**
- Oracle Console → Instances → Click your instance → Copy "Public IP Address"

---

### **4. Install Docker & Docker Compose**

Once connected to server:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (no sudo needed)
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install -y docker-compose

# Verify installation
docker --version
docker-compose --version

# Exit and reconnect to apply group changes
exit
ssh -i oracle-key.key ubuntu@YOUR_PUBLIC_IP
```

---

### **5. Clone Your Repository**

```bash
# Generate GitHub SSH key (or use HTTPS)
# Option A - HTTPS (simpler for public repos)
cd ~
git clone https://github.com/Hard2003/ReactProject.git
cd ReactProject

# Option B - SSH (if private repo)
# Generate key: ssh-keygen -t ed25519
# Add public key to GitHub Settings → SSH Keys
```

---

### **6. Configure Environment Variables**

```bash
cd ~/ReactProject

# Create .env file for backend
cat > .env << EOF
DB_HOST=mysql
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=tcxr_cares
SERVER_HOST=0.0.0.0
SERVER_PORT=3080
EOF
```

---

### **7. Enable Firewall Rules (Critical!)**

Oracle Cloud has strict firewall. You must open ports:

**In Oracle Console:**
1. Compute → Instances → Click your instance
2. Scroll down → **Attached VNICs** → Click VNC link
3. **Subnet Details** → **Security Lists**
4. Click **Default Security List**
5. **Add Ingress Rules:**

```
Rule 1:
  Stateless: ☑ checked
  Source Type: CIDR
  Source CIDR: 0.0.0.0/0
  IP Protocol: TCP
  Source Port Range: ALL
  Destination Port Range: 80,443,3000,3080,8080,3307

Rule 2:
  Stateless: ☑ checked
  Source Type: CIDR
  Source CIDR: 0.0.0.0/0
  IP Protocol: TCP
  All Ports: ☑ All
```

---

### **8. Start Docker Compose**

```bash
# From ~/ReactProject directory
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Expected output:
# CONTAINER ID   IMAGE              STATUS
# xxx            mysql:8.0          Up 2 minutes
# xxx            backend:latest     Up 1 minute
```

---

### **9. Access Your Application**

**Open browser:**
```
http://YOUR_PUBLIC_IP:3000
```

**Example:** `http://141.147.123.45:3000`

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | http://IP:3000 | React Dashboard |
| **Backend API** | http://IP:3080 | REST endpoints |
| **phpMyAdmin** | http://IP:8080 | Database admin |

---

### **10. Keep Server Running (Persistent)**

Docker containers auto-restart, but for extra safety:

```bash
# Create systemd service
sudo tee /etc/systemd/system/tcxr-docker.service > /dev/null << EOF
[Unit]
Description=TCXR Docker Compose Service
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/ReactProject
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF

# Enable service
sudo systemctl enable tcxr-docker.service
sudo systemctl start tcxr-docker.service

# Check status
sudo systemctl status tcxr-docker.service
```

---

## **Alternative FREE Options (Comparison)**

### **Option 1: Railways.app ($5 custom domain or free subdomain)**
✅ Pros: Very easy, auto-deploys from GitHub  
❌ Cons: $5/month after free credits, limited resources  
⏱️ Setup: 10 minutes

### **Option 2: Replit Free Tier**
✅ Pros: Browser-based IDE included, super simple  
❌ Cons: Slow, limited storage  
⏱️ Setup: 5 minutes

### **Option 3: Split Deployment - FREE**
```
Frontend (Vercel/Netlify): FREE
  https://your-app.vercel.app

Backend (Render/Railway): $7/month
  https://api.your-app.onrender.com

Database (PlanetScale): FREE tier
  MySQL compatible
```

### **Option 4: AWS Free Tier - 12 MONTHS**
✅ Pros: More powerful than Oracle  
❌ Cons: Free for 12 months only, then charged  
⏱️ Setup: 20 minutes

---

## **Oracle Cloud Free Tier - Cost Breakdown**

| Component | Cost |
|-----------|------|
| Compute (2x) | FREE ∞ |
| Storage (40GB) | FREE ∞ |
| Bandwidth (10TB/month out) | FREE ∞ |
| MySQLDatabase | ❌ Use DB on VM instead |
| **Total** | **$0/month** |

**Forever free - not a trial!**

---

## **Database Backup Strategy (FREE)**

```bash
# Backup MySQL to file
docker-compose exec mysql mysqldump -u admin -padmin123 tcxr_cares > backup.sql

# Store in GitHub (private repo)
git add backup.sql
git commit -m "DB Backup"
git push

# Restore if needed
docker-compose exec -T mysql mysql -u admin -padmin123 tcxr_cares < backup.sql
```

---

## **Troubleshooting**

### **Can't access http://IP:3000**
```bash
# Check if containers are running
docker-compose ps

# Check firewall rule - did you add port 3000?
# Restart docker
docker-compose restart
```

### **Backend not connecting to DB**
```bash
# Check logs
docker-compose logs mysql
docker-compose logs backend

# Verify environment variables
docker-compose exec backend env | grep DB
```

### **Out of storage**
```bash
# Check disk usage
df -h

# Clean up old images
docker system prune -a
```

---

## **Monitoring Server**

```bash
# SSH into server
ssh -i oracle-key.key ubuntu@YOUR_IP

# Check disk space
df -h

# Check memory
free -h

# Check CPU
top

# View container logs
docker-compose logs --tail 50

# Update containers
docker-compose pull
docker-compose up -d
```

---

## **Custom Domain (FREE)**

Want your own domain? Use free options:

1. **Freenom** - Free .tk/.ml/.ga domains (low quality)
2. **No-IP** - Dynamic DNS free service
3. **Duck DNS** - Free subdomain + free HTTPS

Point to your Oracle IP:
```
A Record → YOUR_PUBLIC_IP
```

---

## **SUMMARY: Your Free Stack**

```
┌─────────────────────────────────────────────┐
│  Oracle Cloud Always-Free VM ($0)           │
│  Ubuntu 22.04 (2 vCPU, 12GB RAM)            │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│  Docker Compose (Running)                    │
│  ├── React Frontend :3000 ($0)              │
│  ├── Python Backend :3080 ($0)              │
│  ├── MySQL Database :3307 ($0)              │
│  └── phpMyAdmin :8080 ($0)                  │
└─────────────────────────────────────────────┘

TOTAL COST: $0/month FOREVER ✅
```

---

## **Next Steps**

1. ✅ Create Oracle Cloud account
2. ✅ Launch free VM (2 vCPU, 12GB RAM)
3. ✅ Clone your GitHub repo
4. ✅ Run `docker-compose up -d`
5. ✅ Open browser → Your public IP:3000
6. ✅ Done! Production app live for FREE

---

**Need help?** Stop by SSH and check:
```bash
ssh -i key.key ubuntu@IP
docker-compose logs -f
```

Good luck! 🎉
