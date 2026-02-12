# 🧪 Payment Integration Test Guide

## ✅ Test Order Created!

**Order ID:** `04601a34-d69d-4815-9c7c-355cb6109bce`  
**Order Number:** `TEST-1770924209299`  
**Customer:** João Silva Teste  
**Email:** joao.teste@example.com  
**Total:** R$ 50.00

---

## 🚀 How to Test

### **Step 1: Open Payment Page**

Copy and paste this URL in your browser:

```
http://localhost:3000/checkout/payment?orderId=04601a34-d69d-4815-9c7c-355cb6109bce
```

---

### **Step 2: Fill Payment Form**

#### **Test Card (APPROVED):**
- **Card Number:** `4012 0010 3714 1112`
- **Cardholder Name:** `TESTE APROVADO`
- **Expiration:** `12/28`
- **CVV:** `123`
- **Installments:** `1x` (or choose up to 10x)

#### **Expected Result:**
1. ✅ Form validates inputs
2. ✅ "Pagar R$ 50.00" button becomes active
3. ✅ Click the button
4. ✅ Loading spinner appears
5. ✅ Success message shows
6. ✅ Redirects to success page
7. ✅ Confetti animation plays 🎉
8. ✅ Order details displayed

---

### **Step 3: Test Declined Payment (Optional)**

Go back and create another test order, then use:

#### **Test Card (DECLINED):**
- **Card Number:** `4012 0010 3844 3335`
- **Cardholder Name:** `TESTE RECUSADO`
- **Expiration:** `12/28`
- **CVV:** `123`

#### **Expected Result:**
1. ✅ Form validates
2. ✅ Click "Pagar"
3. ✅ Loading spinner
4. ❌ Error message appears
5. ✅ Form remains active
6. ✅ Can retry with different card

---

## 📋 What to Check

### **On Payment Page:**
- [ ] Order summary shows on the right
- [ ] Total is R$ 50.00
- [ ] Payment form has all fields
- [ ] Card number auto-formats with spaces
- [ ] Expiration formats as MM/YY
- [ ] CVV is masked
- [ ] Installments selector shows (if total > R$ 30)
- [ ] Security badge is visible
- [ ] Test cards info shows (dev mode)

### **During Payment:**
- [ ] Loading indicator appears
- [ ] Button is disabled during processing
- [ ] No errors in browser console

### **On Success:**
- [ ] Confetti animation plays
- [ ] Success icon (green checkmark)
- [ ] Order number displayed
- [ ] Total amount shown
- [ ] Shop name displayed
- [ ] "Next Steps" guide visible
- [ ] Action buttons work

---

## 🔍 Troubleshooting

### **If page doesn't load:**
1. Check dev server is running: `npm run dev`
2. Check URL is correct
3. Check order ID exists in database

### **If payment fails:**
1. Check browser console for errors
2. Check Network tab for API calls
3. Verify Getnet credentials in `.env.local`
4. Check terminal for backend errors

### **If success page doesn't show:**
1. Check browser console
2. Verify redirect URL
3. Check order status in database

---

## 📊 Database Verification

After successful payment, check the database:

### **Check Orders Table:**
```sql
SELECT 
  id,
  order_number,
  customer_name,
  total_amount,
  status,
  payment_status,
  payment_method,
  payment_id
FROM orders
WHERE id = '04601a34-d69d-4815-9c7c-355cb6109bce';
```

**Expected:**
- `status`: `confirmed`
- `payment_status`: `approved` (or `paid`)
- `payment_method`: `credit_card`
- `payment_id`: Getnet payment ID

### **Check Payments Table:**
```sql
SELECT *
FROM payments
WHERE order_id = '04601a34-d69d-4815-9c7c-355cb6109bce';
```

**Expected:**
- Record exists
- `status`: `approved`
- `getnet_payment_id`: Present
- `getnet_authorization_code`: Present
- `approved_at`: Timestamp

---

## 🎯 Success Criteria

✅ **Payment Integration is Working if:**

1. Payment form loads correctly
2. Card validation works
3. Payment processes without errors
4. Getnet API returns success
5. Database updates correctly
6. Success page displays
7. Confetti plays 🎉

---

## 📸 Screenshots to Take

1. **Payment Page** - Full form with order summary
2. **Filled Form** - With test card data
3. **Loading State** - During processing
4. **Success Page** - With confetti
5. **Database** - Updated order record

---

## 🚀 Next Steps After Testing

If everything works:

1. ✅ **Commit changes** to Git
2. ✅ **Push to GitHub**
3. ✅ **Deploy to Vercel**
4. ✅ **Add webhook URL** to Getnet dashboard
5. ✅ **Test in production** (with real small amounts)
6. ✅ **Get production credentials**
7. ✅ **Go live!** 🎉

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console (F12)
2. Check terminal logs
3. Check Network tab in DevTools
4. Verify environment variables
5. Check Getnet API status

---

**Ready to test? Open the URL above and let's see the magic! ✨**
