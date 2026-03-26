# TCXR Cares - Complete Database Setup Guide

## Overview
This guide will help you set up a professional MySQL database with phpMyAdmin access, both locally and on Railway deployment.

---

## PART 1: LOCAL SETUP WITH DOCKER & phpMyAdmin

### Prerequisites
- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop))
- Docker running on your machine

### Step 1: Start MySQL & phpMyAdmin

```bash
cd path/to/ReactProject
docker-compose -f docker-compose-dev.yml up -d
```

This will start:
- **MySQL Server** on `localhost:3306`
- **phpMyAdmin** on `http://localhost:8080`

### Step 2: Access phpMyAdmin

1. Open browser: `http://localhost:8080`
2. Login with:
   - Username: `root`
   - Password: `root_password_123`

### Step 3: Import Database Schema

1. Click on **"Import"** tab
2. Click **"Choose File"** and select `backend/DATABASE_SCHEMA.sql`
3. Click **"Go"** to execute
4. ✅ All tables created with sample data!

### Step 4: Verify Database

In phpMyAdmin, you'll see:
- ✅ `users` table - with admin, teacher, principal users
- ✅ `institutions` table - with 3 sample schools
- ✅ `students` table - with 5 sample students
- ✅ `grades` table - ready for grade data
- ✅ `attendance` table - for attendance tracking
- ✅ `user_roles` table - for role management
- ✅ `attendance_status_mapping` table - with P, A, L, E, H, S statuses

---

## PART 2: RAILWAY DEPLOYMENT SETUP

### Step 1: Add phpMyAdmin to Railway

1. Go to **[Railway Dashboard](https://railway.app)**
2. Open your project
3. Click **"+ New Service"** → **"Database"** → **MySQL**
4. (If you already have MySQL, skip this)

### Step 2: Connect phpMyAdmin to Railway

1. Click **"+ New Service"** → select **"Template"**
2. Search for **"phpMyAdmin"**
3. Click **"Deploy"**
4. Configure environment variables:
   ```
   PMA_HOST = mysql.railway.internal
   PMA_USER = root
   PMA_PASSWORD = [your Railway MySQL password]
   PMA_DATABASE = railway
   ```
5. Deploy
6. Open phpMyAdmin URL

### Step 3: Import Schema into Railway Database

1. Open phpMyAdmin (Railway URL)
2. Click **"Import"** tab
3. Paste the entire `DATABASE_SCHEMA.sql` content
4. Click **"Go"**
5. ✅ Database initialized on Railway!

### Step 4: Update Backend Connection

Your backend connection is already configured in `server.py`:

```python
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "mysql.railway.internal"),  # Railway MySQL
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "..."),
    "database": os.getenv("DB_NAME", "railway"),
}
```

---

## PART 3: BACKEND API UPDATES

Your backend has been updated to support the new schema:

### Updated Login Endpoint
```
POST /api/auth/login
Body: { "username": "admin", "password": "admin123" }
Response: { "token": "...", "role": "admin", "username": "admin" }
```

### Updated Signup Endpoint
```
POST /api/auth/signup
Body: { "username": "newuser", "password": "pass123", "role": "teacher" }
Response: { "token": "...", "role": "teacher", "username": "newuser" }
```

### API Endpoints Using New Schema

**Get All Students:**
```
GET /api/students
Headers: { "Authorization": "Bearer {token}" }
```

**Get Student Grades:**
```
GET /api/grades/student/{student_id}
Headers: { "Authorization": "Bearer {token}" }
```

**Record Attendance:**
```
POST /api/attendance/record
Body: {
  "student_id": 1,
  "institution_id": 1,
  "attendance_date": "2024-03-26",
  "status": "P"
}
```

**Submit Grades:**
```
POST /api/grades/record
Body: {
  "student_id": 1,
  "school_year": 2024,
  "quarter": 1,
  "fine_motor": "A",
  "gross_motor": "B",
  "social_emotional": "A"
}
```

---

## PART 4: DEFAULT LOGIN CREDENTIALS

### Local Testing
```
Username: admin       Password: admin123    Role: admin
Username: teacher     Password: teacher123  Role: teacher
Username: principal   Password: principal123 Role: principal
```

All passwords are hashed with PBKDF2-HMAC-SHA256

---

## PART 5: DATABASE CREDENTIALS

### Local (Docker)
```
Host: localhost
Port: 3306
Username: root
Password: root_password_123
Database: tcxr_cares
```

### Railway (Production)
```
Host: mysql.railway.internal (internal)
Host: mysql-production-xxxx.up.railway.app (external)
Port: 3306
Username: root
Password: [Your Railway MySQL password]
Database: railway
```

---

## PART 6: TROUBLESHOOTING

### Docker Issues
```bash
# Stop all containers
docker-compose -f docker-compose-dev.yml down

# Start fresh
docker-compose -f docker-compose-dev.yml up -d

# View logs
docker-compose -f docker-compose-dev.yml logs -f
```

### Can't connect to Railway MySQL?
- Verify environment variables in Railway backend service
- Check that MySQL is running: Railway dashboard → MySQL service
- Rebuild backend: deployments → redeploy

---

## PART 7: NEXT STEPS

1. ✅ Set up local MySQL with Docker
2. ✅ Access phpMyAdmin
3. ✅ Import DATABASE_SCHEMA.sql
4. ✅ Test login with admin/admin123
5. ✅ Deploy to Railway and repeat for production

Your complete authentication and data management system is ready! 🎉
