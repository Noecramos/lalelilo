# 🧪 Omnichannel Communication Center - Testing Guide

**Created:** 2026-02-11 14:22 BRT  
**Purpose:** Test centralized WhatsApp, Instagram, and Facebook messaging

---

## 📋 What We're Testing

The **Omnichannel Communication Center** (`/super-admin/omnichannel`) is a centralized dashboard that displays all customer conversations from:
- ✅ WhatsApp (via WAHA)
- ✅ Instagram Direct Messages (via Meta Graph API)
- ✅ Facebook Messenger (via Meta Graph API)

---

## 🎯 Test Objectives

1. **Verify message syncing** - Ensure messages from all channels appear in the dashboard
2. **Test real-time updates** - New messages should appear automatically
3. **Validate conversation grouping** - Messages grouped by contact/channel
4. **Check message sending** - Ability to reply from the dashboard
5. **Confirm data accuracy** - All message data displays correctly

---

## 📊 Current Database Status

Based on our data check, you already have:
- ✅ **34 CRM Contacts** (from WhatsApp and other sources)
- ✅ **21 Conversations** (active message threads)
- ✅ **39 Messages** (synced from WAHA/Meta)

This means the system is **already receiving messages**! 🎉

---

## 🧪 Testing Steps

### **Step 1: Access the Omnichannel Dashboard**

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to:
   ```
   http://localhost:3000/super-admin/omnichannel
   ```

3. **Expected Result:**
   - Dashboard loads successfully
   - Shows 4 stat cards (Total, WhatsApp, Instagram, Facebook)
   - Displays conversation list on the left
   - Shows message area on the right

---

### **Step 2: Verify Existing Conversations**

**What to check:**
- [ ] Total conversations count matches database (21 conversations)
- [ ] WhatsApp conversations are displayed with green icon
- [ ] Instagram conversations show pink icon
- [ ] Facebook conversations show blue icon
- [ ] Each conversation shows:
  - Contact name or phone number
  - Last message timestamp
  - Unread count (if any)
  - Assigned shop (if applicable)

**Screenshot locations:**
- Conversation list
- Channel icons and colors
- Unread badges

---

### **Step 3: View Message History**

1. Click on a conversation from the list
2. **Expected Result:**
   - Messages load in chronological order
   - Contact messages appear on the left (white background)
   - Agent messages appear on the right (purple background)
   - Timestamps show correctly
   - Media attachments display (if any)
   - Read receipts show for sent messages

**What to verify:**
- [ ] All 39 messages are accessible
- [ ] Message content displays correctly
- [ ] Timestamps are accurate
- [ ] Sender type is correct (contact vs agent)

---

### **Step 4: Test Real-Time Updates**

**Option A: Send a WhatsApp Message**
1. Send a message to your WAHA number from your phone
2. **Expected Result:**
   - New message appears in the dashboard within seconds
   - Conversation moves to top of list
   - Unread count increases
   - Message content displays correctly

**Option B: Send via Facebook/Instagram**
1. Send a message to your Facebook Page or Instagram account
2. Wait for n8n sync (runs every 5 minutes)
3. **Expected Result:**
   - Message syncs to database
   - Appears in omnichannel dashboard
   - Contact is created/updated

---

### **Step 5: Test Message Sending**

1. Select a conversation
2. Type a message in the input field
3. Click Send or press Enter
4. **Expected Result:**
   - Message appears immediately in the chat
   - Message is saved to database
   - Timestamp shows current time
   - Status shows as "sent"

**Note:** Actual delivery to WhatsApp/Instagram/Facebook requires webhook integration

---

### **Step 6: Test Filtering**

1. Click on each channel stat card (WhatsApp, Instagram, Facebook)
2. **Expected Result:**
   - Conversation list filters to show only that channel
   - Count matches the stat card number
   - "Limpar filtro" button appears

3. Use the search box
4. **Expected Result:**
   - Filters by contact name or phone
   - Results update in real-time

---

### **Step 7: Test Conversation Assignment**

1. Check if conversations show assigned shop
2. **Expected Result:**
   - Shop name appears below contact name
   - Building icon shows next to shop name

---

## 📈 Success Criteria

### ✅ **PASS Criteria:**
- All existing conversations load (21 total)
- Messages display correctly (39 messages)
- Real-time updates work (new messages appear)
- Channel icons and colors are correct
- Filtering works properly
- Message sending saves to database

### ❌ **FAIL Criteria:**
- Conversations don't load
- Messages are missing or incorrect
- Real-time updates don't work
- Errors in console
- Can't send messages

---

## 🐛 Common Issues & Solutions

### **Issue 1: No conversations showing**
**Solution:**
- Check database connection
- Verify `CLIENT_ID` matches your data
- Check browser console for errors
- Run: `node scripts/check-existing-data.js`

### **Issue 2: Messages not loading**
**Solution:**
- Check `conversation_id` foreign keys
- Verify Supabase RLS policies
- Check network tab for API errors

### **Issue 3: Real-time not working**
**Solution:**
- Verify Supabase realtime is enabled
- Check subscription in browser console
- Refresh the page

### **Issue 4: Can't send messages**
**Solution:**
- Check Supabase service role key
- Verify `messages` table permissions
- Check browser console for errors

---

## 📊 Test Results Template

```
Date: _______________
Tester: _______________

✅ Dashboard loads successfully
✅ Conversations display: ___ / 21
✅ Messages display: ___ / 39
✅ WhatsApp conversations: ___
✅ Instagram conversations: ___
✅ Facebook conversations: ___
✅ Real-time updates work: YES / NO
✅ Message sending works: YES / NO
✅ Filtering works: YES / NO
✅ Search works: YES / NO

Issues found:
1. _______________
2. _______________

Overall Status: PASS / FAIL
```

---

## 🔄 Next Steps After Testing

### **If PASS:**
1. Deploy to production
2. Configure WAHA webhooks for instant delivery
3. Set up n8n for Facebook/Instagram auto-sync
4. Train team on using the dashboard

### **If FAIL:**
1. Document all issues
2. Check error logs
3. Verify database schema
4. Test individual components
5. Re-run after fixes

---

## 🚀 Integration Checklist

After testing the dashboard, verify these integrations:

### **WAHA (WhatsApp):**
- [ ] WAHA deployed on Railway
- [ ] Webhook configured to sync messages
- [ ] Messages appear in real-time
- [ ] Can send messages back

### **Meta Graph API (Instagram/Facebook):**
- [ ] n8n workflow deployed
- [ ] Runs every 5 minutes
- [ ] Syncs new messages
- [ ] Creates contacts automatically

### **Supabase:**
- [ ] All tables exist
- [ ] RLS policies configured
- [ ] Realtime enabled
- [ ] Service role key working

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Review Supabase logs
3. Test database queries manually
4. Contact: support@noviapp.com.br

---

**Last Updated:** 2026-02-11 14:22 BRT  
**Status:** Ready for Testing 🧪
