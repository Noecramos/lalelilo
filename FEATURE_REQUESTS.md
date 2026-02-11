# Feature Requests - Lalelilo Admin

## 1. Shop Registration - Additional Fields

**Location:** `/super-admin/shops` - Create/Edit Shop Modal

**Current Fields:**
- Name
- Slug (URL)
- City
- State
- Phone
- Active status

**New Fields Needed:**
- ✅ WhatsApp (phone number)
- ✅ Email
- ✅ Address (full address)
- ✅ CNPJ (Brazilian business ID)

**Database Changes Required:**
- Add columns to `shops` table:
  - `whatsapp` (text)
  - `email` (text)
  - `address` (text)
  - `cnpj` (text)

---

## 2. Tickets System - Enhancements

**Location:** `/super-admin/tickets` - Create Ticket Modal

**Current Fields:**
- Title
- Description
- Priority
- Status

**New Fields Needed:**
- ✅ Job Position / Role (of person creating ticket)
- ✅ Additional Details field
- ✅ Sequential Ticket Number (auto-generated)

**Database Changes Required:**
- Add columns to `tickets` table:
  - `job_position` (text) - Role/position of ticket creator
  - `ticket_number` (integer) - Sequential number, auto-increment
  - Add index on `ticket_number` for fast lookups

**Display Format:**
- Ticket #0001, #0002, etc.
- Show ticket number prominently in list and detail views

---

## 3. Messages Page - React Key Warning

**Location:** `/super-admin/messages/page.tsx:334`

**Issue:** Missing `key` prop on list items

**Fix:** Add unique `key` prop to mapped elements

---

## Status

- [x] Mobile responsiveness fixes - **DEPLOYED**
- [x] Chat modal conversion - **DEPLOYED**
- [ ] Shop registration fields
- [ ] Tickets enhancements
- [ ] Messages page key warning fix
