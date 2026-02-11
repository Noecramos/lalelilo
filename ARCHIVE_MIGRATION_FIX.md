# 🔧 Fix for Archive Feature - Database Migration Required

**Date:** 2026-02-11 15:05 BRT  
**Issue:** Archive feature needs `archived` column in messages table

---

## 🐛 The Problem

The archive feature was added but the database doesn't have the `archived` column yet. This causes:
- ❌ Error fetching messages
- ❌ WebSocket connection issues (unrelated, but showing in console)
- ❌ Archive button won't work properly

---

## ✅ The Solution

You need to add the `archived` column to your `messages` table in Supabase.

---

## 🚀 Option 1: Run Migration Script (Recommended)

```bash
node scripts/add-archived-column.js
```

This will:
1. Read the migration SQL
2. Attempt to execute it via Supabase
3. Verify the column was added
4. Show success or fallback instructions

---

## 🚀 Option 2: Manual Migration (If script fails)

### **Step 1: Go to Supabase Dashboard**
1. Open https://supabase.com/dashboard
2. Select your project: `lecgrltttoomuodptfol`
3. Go to **SQL Editor**

### **Step 2: Copy and Run This SQL**

```sql
-- Add archived column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_archived 
ON messages(conversation_id, archived);
```

### **Step 3: Click "Run"**

You should see:
```
Success. No rows returned
```

---

## 🔍 Verify Migration

### **Check in Supabase:**
1. Go to **Table Editor**
2. Select `messages` table
3. Look for `archived` column (should be there)

### **Check in App:**
1. Refresh http://localhost:3000/super-admin/omnichannel
2. Open a conversation
3. Hover over a message
4. Click the yellow archive button
5. Message should move to "Histórico de Msgs"

---

## 📊 Migration Details

**What it does:**
- Adds `archived` column (BOOLEAN, default FALSE)
- Creates index on `(conversation_id, archived)` for fast queries
- Doesn't affect existing data (all messages default to not archived)

**Safe to run:**
- ✅ Uses `IF NOT EXISTS` - won't fail if column exists
- ✅ Default value - existing messages won't break
- ✅ Non-destructive - no data loss

---

## 🐛 About the WebSocket Error

The WebSocket error you're seeing:
```
WebSocket connection to 'wss://lecgrltttoomuodptfol.supabase.co/...' failed
```

This is caused by a line break in the API key. This is a known issue with how the environment variable is being read.

**To fix:**
1. Check your `.env.local` file
2. Make sure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is on ONE line
3. No line breaks or extra spaces
4. Restart the dev server

**Example (correct):**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlY2dybHR0dG9vbXVvZHB0Zm9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDA0NDIsImV4cCI6MjA4NTM3NjQ0Mn0.-JoY1PgFPdrZP8c92VC_IY85P5w1mty6qWwyWGH-NDo
```

---

## ✅ After Migration

Once the migration is complete:

**Archive will work:**
- ✅ Click yellow archive button on any message
- ✅ Message moves to "Histórico de Msgs"
- ✅ Stored in database with `archived = true`
- ✅ Can view anytime by expanding history section

**Edit will work:**
- ✅ Click blue edit button on any message
- ✅ Modify content inline
- ✅ Save to database

**Delete will work:**
- ✅ Click red delete button
- ✅ Confirm deletion
- ✅ Permanently removed

---

## 🧪 Test After Migration

1. **Refresh the page**
2. **Open any conversation**
3. **Test archive:**
   - Hover over a message
   - Click yellow archive button
   - Should move to "Histórico de Msgs" at bottom
4. **Test edit:**
   - Hover over a message
   - Click blue edit button
   - Modify and save
5. **Test delete:**
   - Hover over a message
   - Click red delete button
   - Confirm and verify removal

---

## 📝 Summary

**Quick Fix:**
```bash
# Option 1: Run script
node scripts/add-archived-column.js

# Option 2: Manual SQL in Supabase Dashboard
ALTER TABLE messages ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_archived ON messages(conversation_id, archived);
```

**Then:**
1. Refresh browser
2. Test archive feature
3. Enjoy complete message management!

---

**Status:** Migration ready to run  
**Impact:** Enables archive feature  
**Risk:** None (safe migration)  
**Downtime:** None
