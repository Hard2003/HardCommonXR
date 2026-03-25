# 🚀 Deploy to Railway - Step by Step

## **Prerequisites (You should have these)**

✅ GitHub account with your ReactProject pushed
✅ Railway account (free)
✅ Your doctor-compose.yml file in the repository

---

## **Step 1: Go to Railway Website**

1. **Open https://railway.app**
2. **Click "Login"** (top right)
3. **Click "Login with GitHub"**
4. **Allow Railway to access your GitHub repos**

---

## **Step 2: Create New Project**

After login, you'll see the dashboard:

1. **Click "New Project"** (big button)
2. **Click "Deploy from GitHub repo"**

---

## **Step 3: Select Your Repository**

A popup shows your GitHub repos:

1. **Find "ReactProject"** (or whatever you named it)
2. **Click the repo**
3. **Confirm authorization** (if asked)

---

## **Step 4: Railway Detects Your Setup**

Railway will automatically detect:
- ✅ `docker-compose.yml` 
- ✅ MySQL service
- ✅ Backend service
- ✅ Frontend service

**Just wait 2-3 seconds...**

You'll see three services showing up:
```
✓ mysql
✓ backend  
✓ frontend (doesn't exist? That's okay, Railway will create it)
```

---

## **Step 5: Click Deploy**

Once services are detected:

1. **Click "Deploy"** button (bottom right)
2. **Railway starts building** (takes 2-3 minutes)

You'll see:
```
Building... [████████░] 60%
Building... [██████████] 100%
Deployment Successful! ✓
```

---

## **Step 6: Environment Variables (IMPORTANT!)**

Railway needs to know your database settings.

**In Railway Dashboard:**

1. **Click the "backend" service**
2. **Click "Variables" tab**
3. **Add these variables:**

```
DB_HOST=mysql
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=tcxr_cares
SERVER_HOST=0.0.0.0
SERVER_PORT=3080
```

4. **Click "Save"**
5. **Railway redeploys automatically**

---

## **Step 7: Get Your Live URL**

After deployment finishes:

1. **Click the "backend" service**
2. **Look for "Domains"** section
3. **You'll see:** `https://tcxr-backend-xxxxx.railway.app`

**That's your API URL!** 🎉

For frontend, look for similar domain.

---

## **Step 8: Access Your App**

**Open in browser:**
```
https://tcxr-frontend-xxxxx.railway.app
```

**OR if everything is in one service:**
```
https://tcxr-app-xxxxx.railway.app
```

---

## **What You Should See**

✅ Login page or Dashboard loads
✅ Can view Students list
✅ Can view Institutions
✅ Can access Grades
✅ Can record Attendance
✅ Database connected (see MySQL container running)

---

## **Verify It's Working**

### **Test Frontend:**
1. Open the Railway URL in browser
2. Navigate through pages
3. Check if data loads

### **Test Backend API:**
1. Open `https://your-railway-url/api/students`
2. Should return JSON data

### **Test Database:**
1. Open `https://your-railway-url:8080` (phpMyAdmin)
2. Login: admin / admin123
3. Should see your database

---

## **After Deployment - Auto Updates**

**This is the BEST part about Railway:**

Every time you push to GitHub:
```bash
git push origin main
```

Railway **automatically redeploys** within 2 minutes! ✨

No manual rebuild needed.

---

## **View Logs (If Something Goes Wrong)**

1. **Click service in Railway dashboard**
2. **Click "Logs" tab**
3. **See what's happening in real-time**

Example logs:
```
[backend] Starting Flask server...
[backend] Connected to MySQL successfully
[mysql] Database initialized
[backend] Server running on 0.0.0.0:3080
```

---

## **Common Issues & Fixes**

### **Issue: "502 Bad Gateway"**
**Cause:** Backend not connected to database  
**Fix:** Check environment variables (Step 6)
```
DB_HOST=mysql (NOT localhost!)
DB_PORT=3306
```

### **Issue: "Connection refused"**
**Cause:** Services still starting  
**Fix:** Wait 2-3 minutes and refresh browser

### **Issue: "Database connection failed"**
**Cause:** Wrong credentials in variables  
**Fix:** Check MySQL credentials match
```
DB_USER=admin
DB_PASSWORD=admin123
DB_NAME=tcxr_cares
```

### **Issue: React app shows blank page**
**Cause:** Frontend can't connect to backend  
**Fix:** Update `apiCalls.js`:
```javascript
// Change this:
const API_URL = 'http://localhost:3080';

// To this:
const API_URL = 'https://tcxr-backend-xxxxx.railway.app';
```

Then push:
```bash
git add src/apiCalls.js
git commit -m "Update API URL for production"
git push
```

Railway auto-redeploys! ✅

---

## **Railway Dashboard Overview**

After deployment, the dashboard shows:

```
Your Project
├── mysql (Database)
│   └── Running ✓
├── backend (Python API)
│   └── Running ✓
│   └── Domains: https://backend-xxx.railway.app
└── frontend (React)
    └── Running ✓
    └── Domains: https://frontend-xxx.railway.app
```

Click each service to:
- ✅ View logs
- ✅ Change variables
- ✅ View metrics
- ✅ Monitor performance

---

## **Useful Railroad Links**

**Your Project:** https://railway.app/dashboard

**Check deployment:** https://railway.app/project/YOUR_PROJECT_ID

**View billing:** https://railway.app/account/billing

---

## **After First Deployment**

### **Every time you update code:**

1. **Make changes locally**
2. **Test locally** (optional but recommended)
3. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add new feature"
   git push
   ```
4. **Railway auto-deploys** (2-3 minutes)
5. **Check your app** - no manual steps needed!

### **That's it. Seriously.**

No terminals, no SSH, no manual deployment. Just push to GitHub and Railway handles everything. 🚀

---

## **Advanced: Custom Domain (Optional)**

If you want `myapp.com` instead of `railway.app`:

1. **Click service in Railway**
2. **Click "Domains"**
3. **Add custom domain**
4. **Follow DNS setup instructions**

For now, the free `*.railway.app` domain works fine.

---

## **Cost Check**

After deployment, check your usage:

1. **Click account icon** (top right)
2. **Click "Billing"**
3. **See monthly cost** (usually $0 for small projects)

---

## **SUMMARY: Deploy in 5 Steps**

1. ✅ Go to railway.app
2. ✅ Login with GitHub
3. ✅ Select your ReactProject repo
4. ✅ Add environment variables
5. ✅ Click Deploy

**Your app is live in 2-3 minutes!**

---

## **Need Help?**

### **Check logs:**
```
Railway Dashboard → Service → Logs → See errors
```

### **Common fixes:**
- Variables: DB_HOST=mysql (not localhost)
- API URL: Change to production URL in apiCalls.js
- Wait time: Sometimes takes 3-5 minutes first time

### **Make an update:**
```bash
git push origin main
# Wait 2-3 minutes
# Refresh browser - changes live!
```

---

**You're ready to deploy!** 🎉

Go to https://railway.app and follow the steps above. Your TCXR Cares app will be live within minutes!

