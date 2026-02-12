# NOVIX ONLINE - Setup Guide

## 🎯 Overview

**Novix Online** is your SaaS platform manager dashboard, completely separate from the client-facing Lalelilo app.

**Access:** `novix.noviapp.com.br`

---

## 📋 Setup Steps

### **Step 1: Run Database Migration**

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/lecgrltttoomuodptfol/sql/new

2. Copy and paste the contents of: `supabase/migrations/novix_authentication.sql`

3. Click "Run" to create the `novix_managers` table

---

### **Step 2: Generate Password**

1. Run the password generation script:
```bash
node scripts/generate-novix-password.mjs
```

2. Copy the SQL command from the output

3. Run it in Supabase SQL Editor to set your password

---

### **Step 3: Configure DNS**

1. Go to your domain registrar (where noviapp.com.br is registered)

2. Add a CNAME record:
   - **Type:** CNAME
   - **Name:** novix
   - **Value:** cname.vercel-dns.com
   - **TTL:** 3600 (or default)

3. Save the DNS record

---

### **Step 4: Configure Vercel**

1. Go to Vercel project settings: https://vercel.com/dashboard

2. Navigate to: **Settings** → **Domains**

3. Click "Add Domain"

4. Enter: `novix.noviapp.com.br`

5. Vercel will verify DNS and configure automatically

---

### **Step 5: Test Access**

1. Wait 5-10 minutes for DNS propagation

2. Visit: `https://novix.noviapp.com.br/login`

3. Login with:
   - **Username:** `novix-admin`
   - **Password:** (the password you set in Step 2)

4. You should see the Novix dashboard!

---

## 🔐 Default Credentials

**Username:** `novix-admin`  
**Password:** Set in Step 2 (default in script: `Novix@2026!Secure`)

**⚠️ IMPORTANT:** Change the password in `scripts/generate-novix-password.mjs` before running!

---

## 📊 Dashboard Features

### **Metrics Displayed:**

1. **Total Shops** - All registered shops
2. **Active Shops** - Currently active shops  
3. **Total Users** - Users across all shops

### **Additional Stats:**

- Suspended shops count
- Active rate percentage
- Average users per shop

---

## 🛡️ Security Features

### **Complete Separation:**

✅ **Different Domain:** `novix.noviapp.com.br` vs `lalelilo.vercel.app`  
✅ **Different Authentication:** Separate cookies and sessions  
✅ **Different Layout:** Novix branding vs Lalelilo branding  
✅ **Middleware Protection:** Domain-based routing prevents cross-access  

### **How It Works:**

```typescript
// Middleware checks hostname
if (hostname.includes('novix.noviapp.com.br')) {
    // ONLY Novix routes accessible
    // Lalelilo routes blocked
}

if (hostname.includes('lalelilo.vercel.app')) {
    // ONLY Lalelilo routes accessible
    // Novix routes blocked
}
```

**Result:** Impossible for clients to access Novix, even if they try!

---

## 🧪 Testing Locally

### **Option 1: Use localhost with /novix prefix**

While developing, access Novix at:
```
http://localhost:3000/novix/login
```

The middleware detects `/novix` prefix on localhost and routes to Novix.

### **Option 2: Edit hosts file**

Add to your hosts file (`C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1 novix.noviapp.com.br
```

Then access:
```
http://novix.noviapp.com.br:3000/login
```

---

## 📁 File Structure

```
app/
├── (novix)/                    # Novix Online (novix.noviapp.com.br)
│   ├── layout.tsx              # Novix layout with branding
│   ├── page.tsx                # Dashboard with metrics
│   └── login/
│       └── page.tsx            # Novix login
│
├── (client)/                   # Lalelilo client app
├── shop-admin/                 # Shop admin dashboards
└── login/                      # Shop login

app/api/
├── novix/                      # Novix API routes
│   ├── metrics/route.ts        # Get platform metrics
│   └── auth/
│       ├── login/route.ts      # Novix login
│       └── logout/route.ts     # Novix logout
│
└── auth/                       # Shop auth routes

middleware.ts                   # Domain-based routing
```

---

## 🚀 Deployment Checklist

- [ ] Run database migration in Supabase
- [ ] Generate and set Novix manager password
- [ ] Configure DNS CNAME record
- [ ] Add domain in Vercel
- [ ] Wait for DNS propagation
- [ ] Test login at novix.noviapp.com.br
- [ ] Verify metrics are displaying correctly

---

## 🔧 Troubleshooting

### **Can't access novix.noviapp.com.br**
- Check DNS propagation: https://dnschecker.org
- Verify CNAME record is correct
- Wait 10-15 minutes for DNS to propagate

### **Login fails**
- Verify password was set in database
- Check Supabase connection
- Check browser console for errors

### **Metrics not showing**
- Verify Supabase connection
- Check that shops table exists
- Check browser console for API errors

---

## 📞 Support

For issues, check:
1. Browser console for errors
2. Vercel deployment logs
3. Supabase logs

---

**✅ Setup Complete!**

You now have a completely separate, invisible SaaS manager dashboard at `novix.noviapp.com.br`!
