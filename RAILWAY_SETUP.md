# 🚀 Railway MySQL + phpMyAdmin Setup Guide

## Step 1: Create MySQL Database on Railway

1. Go to [railway.app](https://railway.app)
2. Click **New Project**
3. Click **Add Service** → Search **MySQL**
4. Click **MySQL** to add it
5. Railway will create a MySQL instance

## Step 2: Get Database Credentials

1. Click on the MySQL service
2. Go to **Variables** tab
3. Copy these values:
   - `MYSQL_HOST` = `containers.railway.app`
   - `MYSQL_PORT` = `7171` (or your assigned port)
   - `MYSQL_USER` = `root`
   - `MYSQL_PASSWORD` = (copy the password shown)
   - `MYSQL_DATABASE` = `railway`

## Step 3: Add phpMyAdmin to Access Database

In the same Railway project:

1. Click **Add Service** → **Git Repository**
2. Fork this: `https://github.com/phpmyadmin/docker-compose.git`
3. Or use Docker: Click **Add Service** → **Docker**
   - Image: `phpmyadmin:latest`
   - Environment Variables:
     ```
     PMA_HOST=containers.railway.app
     PMA_PORT=7171
     PMA_USER=root
     PMA_PASSWORD=[your mysql password]
     ```

## Step 4: Import Database Schema

1. Open phpMyAdmin (Railway will give you a URL like `phpmyadmin-xxxxx.railway.app`)
2. Login with `root` / `[your password]`
3. Click **Import** tab
4. Upload file: `ReactProject/backend/DATABASE_SCHEMA.sql`
5. Click **Go** to import all tables

## Step 5: Update Backend Connection

Update `backend/server.py` DB_CONFIG:

```python
DB_CONFIG = {
    "host": "containers.railway.app",
    "port": 7171,  # Your Railway MySQL port
    "user": "root",
    "password": "YOUR_RAILWAY_PASSWORD",
    "database": "railway",
}
```

Or use **environment variables** in Railway:

```
DB_HOST=containers.railway.app
DB_PORT=7171
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=railway
```

## Step 6: Deploy backend

Push the updated `server.py` to trigger redeploy on Railway

## Step 7: Test Login

Try login with:
- **Username**: `admin`
- **Password**: `admin123`

Or:
- **Username**: `teacher`
- **Password**: `teacher123`

---

## ✅ What's Included

Your database will have:
- ✅ **users** table - admin/teacher accounts (passwords hashed)
- ✅ **institutions** table - 3 sample schools
- ✅ **students** table - 5 sample students
- ✅ **grades** table - for tracking student performance
- ✅ **attendance** table - for tracking attendance
- ✅ **attendance_mapping** table - status codes (Present, Absent, Late, etc)

---

## 🔗 Quick Reference

| Component | URL |
|-----------|-----|
| phpMyAdmin | `phpmyadmin-xxxxx.railway.app` |
| Backend API | Your Railway backend URL |
| Frontend | Your deployed frontend URL |
