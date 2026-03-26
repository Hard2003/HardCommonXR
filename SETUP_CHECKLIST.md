## ✅ Next Steps - Railway MySQL Setup

### **STEP 1: Create MySQL on Railway** (5 min)
- [ ] Go to https://railway.app
- [ ] Click "New Project" 
- [ ] Add Service → MySQL
- [ ] Wait for it to deploy
- [ ] Copy credentials from Variables tab:
  - HOST: ?
  - PORT: ?
  - USER: root
  - PASSWORD: ?
  - DATABASE: railway

### **STEP 2: Add phpMyAdmin** (5 min)
- [ ] In same Railway project, Add Service → Docker
- [ ] Image: `phpmyadmin:latest`
- [ ] Add these environment variables:
  ```
  PMA_HOST=containers.railway.app
  PMA_PORT=[YOUR_MYSQL_PORT]
  PMA_USER=root
  PMA_PASSWORD=[YOUR_MYSQL_PASSWORD]
  ```
- [ ] Deploy and get the URL (phpmyadmin-xxxxx.railway.app)

### **STEP 3: Import Database Schema**
- [ ] Open phpMyAdmin
- [ ] Login: root / [password]
- [ ] Click "Import" tab
- [ ] Select file: `ReactProject/backend/DATABASE_SCHEMA.sql`
- [ ] Click "Go" → Wait for success ✓

### **STEP 4: Verify Data Imported**
In phpMyAdmin, verify tables exist:
- [ ] users (admin/teacher accounts)
- [ ] institutions (3 schools)
- [ ] students (5 students)
- [ ] grades
- [ ] attendance
- [ ] attendance_mapping

### **STEP 5: Update Backend Connection**
Update your Railway backend environment variables:
```
DB_HOST=containers.railway.app
DB_PORT=[YOUR_PORT]
DB_USER=root
DB_PASSWORD=[YOUR_PASSWORD]
DB_NAME=railway
JWT_SECRET=your_secret_key_change_in_production
```

### **STEP 6: Redeploy Backend**
- [ ] Push any changes: `git push origin main`
- [ ] Railway auto-redeploys backend
- [ ] Wait ~2 min for deployment

### **STEP 7: Test Login**
Go to your frontend, click Login and try:
- **Username**: `admin`
- **Password**: `admin123`

Should see: ✅ JWT token + redirect to dashboard

---

## 🔗 Access Your System

| Service | Status | URL |
|---------|--------|-----|
| Frontend | ? | `your-frontend-url` |
| Backend API | ? | `your-backend-url` |
| phpMyAdmin | ✅ | Given after setup |
| MySQL Database | ✅ | Hidden, accessed via phpMyAdmin |

---

## 📊 Database Info

**Tables Created:**
- users (2 default accounts hashed)
- institutions (3 schools)
- students (5 sample students)
- grades (empty, ready for data)
- attendance (empty, ready for data)
- attendance_mapping (status codes)

**Sample Login Credentials:**
```
admin / admin123
teacher / teacher123
```

**All passwords are HASHED with PBKDF2-SHA256** ✅ Secure

---

## ❓ Common Issues

**Q: "Can't connect to MySQL"**
- A: Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in environment variables

**Q: "phpMyAdmin shows blank"**
- A: Wait 2 min for deployment, check PMA_HOST and PMA_PORT are correct

**Q: "Login fails but no error"**
- A: Check browser console (F12) for error message

**Q: "Tables don't exist"**
- A: Verify you uploaded DATABASE_SCHEMA.sql to phpMyAdmin Import tab

---

Once everything is set up, your system is **production-ready** and fully working! 🚀
