# Railway Setup Guide - Complete phpMyAdmin + MySQL + Backend Deployment

## Step 1: Create Railway Project
1. Go to **https://railway.app**
2. Sign up or log in
3. Click **Create Project**
4. Select **Provision MySQL** (not create from template)
5. Wait for deployment (2-3 minutes)
6. Once deployed, click on MySQL service
7. Click **Connect** tab and copy credentials:
   - `RAILWAY_MYSQL_HOST` (will look like: mysql.railway.internal)
   - `RAILWAY_MYSQL_PORT` (usually 3306)
   - `RAILWAY_MYSQL_USER` (usually root)
   - `RAILWAY_MYSQL_PASSWORD` (long random string)
   - `RAILWAY_MYSQL_DB_NAME` (the database name)

---

## Step 2: Import Your Database to Railway

### Option A: Import via Railway's SQL Editor (Easiest)
1. Go to your Railway MySQL service
2. Click **Data** tab
3. Click **New File** → Name it `import.sql`
4. Open `tcxr_cares_backup.sql` from your local machine
5. Copy ALL content and paste into Railway's SQL editor
6. Click **Execute** button
7. Wait for import to complete ✅

### Option B: Use Railway CLI (Advanced)
```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway login

# Connect to your project
railway link

# Import backup file
mysql -h RAILWAY_HOST -u RAILWAY_USER -p RAILWAY_PASSWORD RAILWAY_DB < tcxr_cares_backup.sql
```

---

## Step 3: Verify Database on Railway
1. In Railway MySQL **Connect** tab → Copy **Database URL**
2. Format: `mysql://user:password@host:port/database`
3. To verify data is there, use any MySQL client or continue to step 4

---

## Step 4 (OPTIONAL): Deploy phpMyAdmin to Railway

If you want phpMyAdmin accessible at a public URL:

1. In your Railway project, click **+ New Service**
2. Select **GitHub Repo** or scroll to **phpmyadmin** in templates
3. If using template, select phpmyadmin
4. Set environment variables:
   - `PMA_HOST` = (from MySQL service Connect tab: `Host`)
   - `PMA_USER` = (from MySQL credentials: `User`)
   - `PMA_PASSWORD` = (from MySQL credentials: `Password`)
5. Click **Deploy**
6. Once deployed, click **View** → Opens phpMyAdmin at public Railway URL
7. phpMyAdmin will auto-connect to your Railway MySQL

---

## Step 5: Update Backend to Connect to Railway

### In `backend/server.py` - Update DB_CONFIG:

```python
import os

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'admin'),
    'password': os.getenv('DB_PASSWORD', 'admin123'),
    'database': os.getenv('DB_NAME', 'tcxr_cares'),
    'port': int(os.getenv('DB_PORT', 3306))
}
```

This code already exists in `server.py` - just verify it's there.

---

## Step 6: Deploy Backend to Railway

### Deploy Python Backend to Railway:

1. Push your code to GitHub (ensure `backend/server.py` is committed)
2. In Railway project, click **+ New Service**
3. Select **GitHub Repo**
4. Choose your React project repository
5. Railway auto-detects Python → selects `server.py`
6. Set environment variables in Railway:
   - `DB_HOST` = (from MySQL **Connect** tab)
   - `DB_PORT` = 3306
   - `DB_USER` = root
   - `DB_PASSWORD` = (from MySQL credentials)
   - `DB_NAME` = tcxr_cares (or whatever your database name is)
   - `FLASK_ENV` = production

7. Click **Deploy**
8. Once deployed, Railway assigns a public URL like: `backend-prod-xxxx.railway.app`

---

## Step 7: Update Frontend to Connect to Railway Backend

### In `ReactProject/src/apiCalls.js`:

Change:
```javascript
const API_URL = 'http://localhost:3080';
```

To:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://backend-prod-xxxx.railway.app';
```

Or hardcode the Railway backend URL:
```javascript
const API_URL = 'https://backend-prod-xxxx.railway.app';  // Replace with your Railway URL
```

---

## Step 8: Deploy React Frontend to Railway

1. In Railway project, click **+ New Service**
2. Select **GitHub Repo**
3. Choose your React project repository
4. Railway detects `package.json` → selects Node.js
5. Set start command in Railway settings:
   - Build: `npm install && npm run build`
   - Start: `npm start` or `serve -s build`
6. Set environment variables:
   - `REACT_APP_API_URL` = (your Railway backend URL from Step 6)

7. Click **Deploy**
8. Once live, Railway gives you a public URL like: `frontend-prod-xxxx.railway.app`

---

## Quick Summary - What Gets Created on Railway:

| Service | Type | URL | Connects To |
|---------|------|-----|-------------|
| MySQL | Database | (internal) | - |
| phpMyAdmin | UI (optional) | `phpmyadmin.railway.app` | MySQL |
| Backend API | Python/Flask | `backend.railway.app` | MySQL |
| Frontend | React | `frontend.railway.app` | Backend API |

---

## Testing Your Railway Setup

### Test Backend API:
```bash
curl https://backend-prod-xxx.railway.app/api/institutions
curl -X POST https://backend-prod-xxx.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Test Frontend:
Open browser: `https://frontend-prod-xxx.railway.app`
- Click Login
- Enter: `admin` / `admin123`
- Should see dashboard with all your company data

---

## Troubleshooting

**Backend can't connect to MySQL:**
- Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` environment variables are set correctly in Railway
- Check Railway Logs tab for connection errors
- Ensure MySQL service is running (check Railway Dashboard)

**phpMyAdmin can't connect:**
- Verify `PMA_HOST`, `PMA_USER`, `PMA_PASSWORD` are correct
- Use internal host name from MySQL service (not localhost)

**Frontend can't reach backend:**
- Verify `REACT_APP_API_URL` environment variable is set
- Check browser console for CORS errors
- Ensure backend is deployed and running

**Build failures:**
- Check Railway Logs
- Verify `package.json` has all dependencies
- Check Node.js version compatibility
