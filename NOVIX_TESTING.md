# 🧪 NOVIX ONLINE - LOCAL TESTING GUIDE

## Quick Start (3 Steps)

### **Step 1: Run Database Setup**

1. Open Supabase SQL Editor:
   https://supabase.com/dashboard/project/lecgrltttoomuodptfol/sql/new

2. Copy and paste the entire contents of:
   `supabase/novix_complete_setup.sql`

3. Click **"Run"**

4. You should see: ✅ NOVIX ONLINE SETUP COMPLETE!

---

### **Step 2: Start Dev Server**

```bash
npm run dev
```

---

### **Step 3: Access Novix**

**For localhost testing, the middleware detects the `/novix` prefix:**

1. Open browser and go to:
   ```
   http://localhost:3000/login
   ```

2. Login with:
   - **Username:** `novix-admin`
   - **Password:** `Novix@2026!Secure`

3. You should see the Novix dashboard! 🎉

---

## 📊 What You'll See

**Dashboard with 3 metric cards:**
- Total Shops
- Active Shops  
- Total Users

**Platform Status section:**
- Suspended shops count
- Active rate percentage
- Average users per shop

---

## 🔧 Troubleshooting

### **Login page not loading**
- Make sure dev server is running (`npm run dev`)
- Check that you're accessing `http://localhost:3000/login`

### **Login fails with "Invalid credentials"**
- Verify you ran the SQL script in Supabase
- Check username: `novix-admin` (no spaces)
- Check password: `Novix@2026!Secure` (case-sensitive)

### **Dashboard shows 0 for all metrics**
- This is normal if you have no shops in the database yet
- The dashboard pulls real data from Supabase

### **"Failed to fetch metrics" error**
- Check browser console for errors
- Verify Supabase connection in `.env.local`
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set

---

## 🌐 Domain Routing (How it works)

**Middleware logic:**
```typescript
// On localhost, middleware checks pathname
if (pathname.startsWith('/novix')) {
    // Route to Novix Online
}

// On production, middleware checks hostname
if (hostname.includes('novix.noviapp.com.br')) {
    // Route to Novix Online
}
```

**This means:**
- Localhost: Access at `/login` (will route to Novix)
- Production: Access at `novix.noviapp.com.br/login`

---

## ✅ Testing Checklist

- [ ] Database setup complete (ran SQL script)
- [ ] Dev server running
- [ ] Can access login page
- [ ] Can login successfully
- [ ] Dashboard loads
- [ ] Metrics display (even if 0)
- [ ] Logout button works
- [ ] Can login again after logout

---

## 🔐 Default Credentials

**Username:** `novix-admin`  
**Password:** `Novix@2026!Secure`

⚠️ **Change this password in production!**

---

## 📝 Notes

- The dashboard shows **real data** from your Supabase database
- If you have shops in the database, you'll see the actual counts
- The metrics update in real-time when you refresh the page

---

**Ready to test? Follow the 3 steps above!** 🚀
