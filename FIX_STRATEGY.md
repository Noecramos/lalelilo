# Lalelilo - Bug Fixes & Improvements Strategy

## 🎯 **Issues Identified**

### 1. **Users Page** (`/super-admin/users`)
**Problems:**
- ❌ "Ver Perfil" button not working
- ❌ "Selecione a loja" dropdown not working

**Root Cause:** Buttons/dropdowns not connected to handlers

**Fix Strategy:**
- Add `onClick` handler to "Ver Perfil" button → Navigate to `/super-admin/users/[id]`
- Add `onChange` handler to shop dropdown → Update user's assigned shop via API
- Connect to `/api/users` endpoint
- Test locally before pushing

---

### 2. **Checklists Page** (`/super-admin/checklists`)
**Problems:**
- ❌ Most buttons not working

**Root Cause:** UI built but not connected to API

**Fix Strategy:**
- Identify all buttons/actions on the page
- Add handlers for:
  - Create new checklist
  - Edit checklist
  - Delete checklist
  - Assign to shop
  - Mark items complete
- Connect to `/api/checklists` endpoint
- Test each action locally

---

### 3. **Tickets Page** (`/super-admin/tickets`)
**Problems:**
- ❌ "+ Novo Ticket" missing file upload
- ❌ No camera activation option

**Root Cause:** Basic form without file handling

**Fix Strategy:**
- Add file upload input (accept images/documents)
- Add camera capture button for mobile devices
- Use HTML5 `<input type="file" accept="image/*" capture="camera">` for camera
- Store files in Supabase Storage
- Save file URLs in ticket record
- Preview uploaded images before submit
- Test on mobile device

---

### 4. **Team Page** (`/super-admin/team`)
**Problem:**
- ❓ Purpose unclear

**Current Understanding:**
- Should manage internal team members (employees)
- Different from "Users" (which might be shop owners/managers)

**Proposed Functionality:**
1. **List all team members** (employees across all shops)
2. **Add new team member** (name, role, shop assignment)
3. **Edit team member** (change role, reassign shop)
4. **View performance** (sales, customer satisfaction)
5. **Manage permissions** (what they can access)

**Questions for You:**
- What should this page do?
- Is it for:
  - Shop employees (vendedores)?
  - Admin users?
  - Both?
- What actions do you need?

---

## 📋 **Implementation Plan**

### **Phase 1: Assessment** (15 minutes)
1. Review each page's current code
2. List all missing handlers
3. Check API endpoints exist
4. Document required changes

### **Phase 2: Users Page** (30 minutes)
1. Add "Ver Perfil" navigation
2. Add shop dropdown handler
3. Create user detail page if missing
4. Test locally:
   - Click "Ver Perfil" → Should navigate
   - Select shop → Should update and save
   - Verify data persists

### **Phase 3: Checklists Page** (45 minutes)
1. Add create checklist modal
2. Add edit functionality
3. Add delete with confirmation
4. Add assign to shop
5. Add mark complete toggle
6. Test locally:
   - Create new checklist
   - Edit existing
   - Delete
   - Assign to shop
   - Mark items complete

### **Phase 4: Tickets Page** (45 minutes)
1. Add file upload field to form
2. Add camera capture button
3. Implement file preview
4. Set up Supabase Storage bucket
5. Upload files and save URLs
6. Test locally:
   - Upload image from device
   - Capture photo with camera
   - Preview before submit
   - Verify file saved

### **Phase 5: Team Page** (30 minutes - AFTER your clarification)
1. Define exact purpose with you
2. Build required functionality
3. Test locally

---

## ✅ **Testing Checklist** (Before Each Commit)

For each page, I will:

1. **Test locally** at http://localhost:3000
2. **Verify all buttons work**
3. **Check data saves to database**
4. **Test error handling**
5. **Verify mobile responsiveness**
6. **Show you screenshots/video**
7. **Get your approval**
8. **Then commit and push**

---

## 🚀 **Workflow**

```
For each page:
1. Fix code locally
2. Test thoroughly
3. Show you the results
4. Wait for your approval
5. Commit to git
6. Push to Vercel
7. Test on production
8. Move to next page
```

---

## ❓ **Questions Before I Start**

### **Team Page:**
1. What is the purpose of this page?
2. Who are "team members"? (employees, admins, both?)
3. What actions do you need? (add, edit, delete, assign?)
4. What information should be tracked? (name, role, shop, performance?)

### **File Upload:**
1. Max file size for tickets? (5MB, 10MB?)
2. Allowed file types? (images only, or also PDFs/docs?)
3. Where to store? (Supabase Storage - I'll set this up)

### **Priority:**
Which page should I fix first?
1. Users
2. Checklists  
3. Tickets
4. Team

---

## 📊 **Estimated Time**

- Users Page: ~30 min
- Checklists Page: ~45 min
- Tickets Page: ~45 min
- Team Page: ~30 min (after clarification)

**Total: ~2.5 hours** (with testing)

---

## ✋ **IMPORTANT**

**I will NOT commit anything until:**
1. ✅ I test it locally
2. ✅ I show you the results
3. ✅ You approve it
4. ✅ You say "push it"

**Sound good?** 

Let me know:
1. Your answers to the questions above
2. Which page to start with
3. Any other requirements

Then I'll begin! 🚀
