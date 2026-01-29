# Supabase Setup Guide for Lalelilo

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create account
3. Click "New Project"
4. Fill in:
   - **Name:** Lalelilo
   - **Database Password:** (save this securely!)
   - **Region:** South America (São Paulo) - closest to Brazil
   - **Pricing Plan:** Free (sufficient for MVP)
5. Click "Create new project"
6. Wait ~2 minutes for project to be ready

---

### Step 2: Get API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Step 3: Update Environment Variables

1. In the `lalelilo/` directory, create `.env.local`:

```bash
# Copy from .env.template
cp .env.template .env.local
```

2. Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Step 4: Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL editor
5. Click "Run" (bottom right)
6. Wait for success message

**Expected result:**
- ✅ 8 tables created
- ✅ Indexes created
- ✅ RLS enabled
- ✅ Triggers created
- ✅ Lalelilo client inserted

---

### Step 5: Set up Storage (for images)

1. In Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Create these buckets:
   - **Name:** `products`
     - Public: ✅ Yes
     - File size limit: 5MB
   - **Name:** `logos`
     - Public: ✅ Yes
     - File size limit: 2MB
   - **Name:** `shops`
     - Public: ✅ Yes
     - File size limit: 5MB

---

### Step 6: Configure Authentication (Optional for MVP)

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Disable email confirmation for now (we'll use manual user creation)

---

### Step 7: Verify Setup

Run this test query in SQL Editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if Lalelilo client was created
SELECT * FROM clients WHERE slug = 'lalelilo';
```

**Expected output:**
- 8 tables listed
- 1 client row (Lalelilo)

---

## 🔧 Troubleshooting

### Issue: Migration fails
**Solution:** Run the schema.sql in smaller chunks:
1. First: CREATE EXTENSION and all CREATE TABLE statements
2. Second: All CREATE INDEX statements
3. Third: ALTER TABLE and RLS policies
4. Fourth: Functions and triggers
5. Fifth: INSERT seed data

### Issue: Can't connect from Next.js
**Solution:** 
1. Check `.env.local` has correct values
2. Restart dev server: `npm run dev`
3. Check Supabase project is not paused (free tier pauses after 1 week inactivity)

### Issue: RLS blocking queries
**Solution:** For development, you can temporarily disable RLS:
```sql
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
-- (repeat for other tables)
```

---

## 📊 Database Schema Overview

```
clients (1)
  └── shops (30)
       ├── inventory (products × shops)
       └── orders
  └── categories
       └── products
            └── inventory
  └── users
  └── analytics_daily
```

---

## 🔐 Security Notes

1. **Never commit `.env.local`** - it's in `.gitignore`
2. **Service role key** - only use server-side, never expose to client
3. **Anon key** - safe to use client-side, has RLS restrictions
4. **Database password** - save securely, needed for direct connections

---

## 📝 Next Steps After Setup

1. ✅ Supabase project created
2. ✅ API keys configured
3. ✅ Database migrated
4. ✅ Storage buckets created
5. → Start building API routes
6. → Test database connections
7. → Add shop data

---

## 🆘 Need Help?

- **Supabase Docs:** https://supabase.com/docs
- **SQL Editor:** Use for testing queries
- **Table Editor:** Visual interface for data
- **API Docs:** Auto-generated API documentation

---

**Setup Time:** ~5-10 minutes
**Status:** Ready for development! 🚀
