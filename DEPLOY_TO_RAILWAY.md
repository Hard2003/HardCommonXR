# 🚀 Railway Deployment Guide - TCXR Cares Application

This guide explains how to deploy the TCXR Cares application to Railway with separate frontend and backend services.

## Quick Summary

- **Frontend**: React app → deployed to Railway Node.js service
- **Backend**: Python FastHTTP server → deployed to Railway Python service
- **Database**: MySQL already on Railway (crossover.proxy.rlwy.net)
- **Teacher Login**: username=`teacher`, password=`teacher123`

---

## Step 1: Deploy Backend Service

### On Railway Dashboard:

1. **Create New Service**
   - Click `+ New Service` in your Railway project
   - Select `GitHub Repo`
   - Select the `HardCommonXR` repository
   - Railway will auto-detect Python and create a Python service

2. **Configure Backend Service**
   - Give it a name like: `backend` or `api-service`
   - In the service settings, go to **Variables**
   - Add these environment variables:

   ```
   DB_HOST=mysql.railway.internal
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=ZpoYKIqgmCSAXVHuyuEDNshvrVlagCAV
   DB_NAME=railway
   SERVER_HOST=0.0.0.0
   SERVER_PORT=3080
   PORT=3080
   JWT_SECRET=your_secure_secret_key_here_change_in_production
   ```

3. **Configure Build & Start**
   - Build Command: Leave empty (default)
   - Start Command: `cd backend && python server.py`
   - Port: `3080`

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build & startup
   - ✅ Once deployed, copy the Railway URL (e.g., `https://backend-prod-xxxx.railway.app`)

5. **Test Backend API**
   - Open in browser or curl:
   ```bash
   curl https://your-backend-railway-url.railway.app/api/auth/login \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"username":"teacher","password":"teacher123"}'
   ```
   - You should get a JSON response with a token

---

## Step 2: Deploy Frontend Service

### On Railway Dashboard:

1. **Create New Service**
   - Click `+ New Service`
   - Select `GitHub Repo`
   - Select the `HardCommonXR` repository
   - Railway will auto-detect Node.js and create a Node.js service

2. **Configure Frontend Service**
   - Give it a name like: `frontend` or `web-app`
   - Go to the root directory configuration (not backend/)
   - In **Variables**, add:

   ```
   REACT_APP_API_URL=https://your-backend-railway-url.railway.app
   NODE_ENV=production
   ```
   
   Replace `your-backend-railway-url` with the actual URL from Step 1

3. **Configure Build & Start**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Port: `3000`

4. **Deploy**
   - Click "Deploy"
   - Wait 3-5 minutes for npm install, build, and startup
   - ✅ Once deployed, Railway assigns a URL (e.g., `https://frontend-prod-xxxx.railway.app`)

5. **Test Frontend**
   - Open browser to: `https://your-frontend-railway-url.railway.app`
   - Login with:
     - Username: `teacher`
     - Password: `teacher123`
   - ✅ You should see the dashboard with institution and student data

---

## Troubleshooting Railway Deployment

### Frontend says "Failed to load dashboard"

**Cause**: `REACT_APP_API_URL` not set or pointing to wrong backend URL

**Fix**:
1. Go to Frontend service → Variables
2. Verify `REACT_APP_API_URL=https://your-actual-backend-url.railway.app`
3. Redeploy frontend service

### Backend returns 404 or no response

**Cause**: Backend service not running or wrong environment variables

**Fix**:
1. Check Backend service → Deployments → Logs
2. Look for errors in the logs
3. Verify all DB_* environment variables are correct
4. Ensure `DB_HOST=mysql.railway.internal` (not proxy.rlwy.net)

### Still can't login

**Cause**: Database or teacher credentials issue

**Fix**:
1. Verify database is running: Go to MySQL service in Railway
2. Update teacher password locally first, then push to Git
3. See "Reset Teacher Password" section below

---

## Reset Teacher Password (if needed)

If teacher account is broken, update it locally:

```python
# Run this locally:
cd path/to/ReactProject
python
>>> import sys; sys.path.insert(0, 'backend')
>>> from password_utils import hash_password
>>> import mysql.connector
>>> pwd = hash_password('teacher123')
>>> conn = mysql.connector.connect(host='crossover.proxy.rlwy.net', port=45313, user='root', password='ZpoYKIqgmCSAXVHuyuEDNshvrVlagCAV', database='railway')
>>> cur = conn.cursor()
>>> cur.execute('UPDATE users SET password = %s WHERE username = %s', (pwd, 'teacher'))
>>> conn.commit()
>>> conn.close()
>>> print("Teacher password updated!")
```

Then push changes to GitHub and redeploy.

---

## Important Notes

- **Security**: Change `JWT_SECRET` to a strong random string in production!
- **Database**: All data is on Railway MySQL, survives across deploys
- **Auto-deploy**: Once GitHub repo is connected, pushes to `main` branch auto-deploy
- **CORS**: Backend has `Access-Control-Allow-Origin: *` for development (consider restricting in production)

---

## Quick Deploy Checklist

- [ ] Backend service deployed and accessible
- [ ] Frontend `REACT_APP_API_URL` points to backend Railway URL
- [ ] Frontend service deployed
- [ ] Can login with teacher/teacher123
- [ ] Dashboard loads with data
- [ ] All menu options (Students, Institutions, Attendance) work

---

## Database Connection Details

For reference, if you need to access the database directly:

- **Internal** (from Railway services):
  - Host: `mysql.railway.internal`
  - Port: `3306`
  
- **External** (from local machine):
  - Host: `crossover.proxy.rlwy.net`
  - Port: `45313`
  - User: `root`
  - Password: `ZpoYKIqgmCSAXVHuyuEDNshvrVlagCAV`
  - Database: `railway`

---

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Connecting Services in Railway](https://docs.railway.app/develop/services)
- [Environment Variables in Railway](https://docs.railway.app/develop/variables)
