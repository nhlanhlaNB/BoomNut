# Complete Troubleshooting Guide - Subscription Database Save Failure

## The Problem
Subscriptions are being created in PayPal but NOT being saved to Firebase Realtime Database, resulting in the error:
```
❌ Subscription created but failed to save to database. Please try refreshing the page or contact support.
```

---

## Root Causes & Fixes

### **CAUSE #1: Backend Endpoint Not Deployed** ⚠️ MOST LIKELY
Your local code has `/api/subscription/create`, but it's not on your production server (boomnut.co.za).

**How to Check:**
- Open browser DevTools (F12) → Network tab
- Try subscription payment
- Look for request to `/api/subscription/create`
- If Status = **404** → Endpoint doesn't exist on production

**How to Fix:**
1. Deploy your Next.js code to production:
   ```bash
   git add .
   git commit -m "Deploy: subscription API endpoint"
   git push origin main
   ```
2. Your hosting (Vercel/etc) will auto-deploy
3. Wait 2-3 minutes for deployment to complete
4. Test again on production

---

### **CAUSE #2: Missing Environment Variable on Production** ⚠️ VERY LIKELY
The `NEXT_PUBLIC_FIREBASE_DATABASE_URL` is set in your local `.env.local` but NOT on the production server.

**How to Check:**
- Browser console (F12) shows error: 
  ```
  Firebase Realtime Database not configured
  RTDB is null - check .env.local for NEXT_PUBLIC_FIREBASE_DATABASE_URL
  ```

**How to Fix:**

If using **Vercel**:
1. Go to https://vercel.com → Your Project → Settings → Environment Variables
2. Add these variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyBZoJnibrBnG7-OCzBv65Y8e1t8hAbFee8
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = tutapp-88bf0.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID = tutapp-88bf0
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = tutapp-88bf0.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 999034904150
   NEXT_PUBLIC_FIREBASE_APP_ID = 1:999034904150:web:7499ef525b430d7fd6e5f7
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = G-DEYC1VDELW
   NEXT_PUBLIC_FIREBASE_DATABASE_URL = https://tutapp-88bf0-default-rtdb.firebaseio.com
   ```
3. Click "Save"
4. Your project will auto-redeploy
5. Test again on production

If using **Other Hosting** (cPanel, custom server, etc):
- Contact your hosting provider for how to set environment variables
- Or look for `.env.production` or similar file in your hosting control panel

---

### **CAUSE #3: User Not Signed In**
localStorage doesn't have `userId` or `userEmail`.

**How to Check:**
- Browser console (F12) shows:
  ```
  [2] Checking localStorage...
      userId: ❌ NOT FOUND
      userEmail: ❌ NOT FOUND
  ```

**How to Fix:**
- Make sure your authentication system stores user info in localStorage after login
- In your signin/auth code, add:
  ```javascript
  localStorage.setItem('userId', user.uid);
  localStorage.setItem('userEmail', user.email);
  ```

---

### **CAUSE #4: Firebase Rules Blocking Write**
Rules are rejecting the data write.

**How to Check:**
- Browser console shows:
  ```
  [4] API Response Status: 403 Forbidden
  [4] ❌ API Error Response: {error: "Permission denied"}
  ```

**Your Rules Allow:**
```json
"subscriptions": {
  "$subId": {
    ".write": "auth != null && newData.hasChildren(['userId', 'status', 'email', 'plan'])"
  }
}
```

**But Backend Uses Admin SDK** (should bypass rules)

**How to Fix:**
- Your `/api/subscription/create` endpoint should use Admin SDK, not client SDK
- Check if it imports from `firebase-admin` or regular `firebase`
- Should be: `import { rtdb } from '@/lib/firebase'` (client SDK, but from backend)
- Actually needs: Firebase Admin SDK with service account

---

### **CAUSE #5: Wrong Data Format**
API is sending data that doesn't match rules validation.

**Rules Require:**
```json
{
  "userId": "string",
  "status": "string", 
  "email": "string",
  "plan": "string"
}
```

**If Sending Different Fields:**
- `senderId` instead of `userId`
- `state` instead of `status`
- Missing required fields

**How to Fix:**
Check browser console [3]:
```
[3] Calling /api/subscription/create with: {
  userId: "...",
  email: "...",
  plan: "...",
  subscriptionId: "..."
}
```

Make sure it has EXACTLY these fields (case-sensitive):
- ✅ `userId`
- ✅ `email`
- ✅ `plan`
- ✅ `subscriptionId` (optional, but good to have)

---

## Diagnostic Steps

### Step 1: Deploy Debugging Version
Replace PayPal buttons on boomnut.co.za with code from:
**PAYPAL_BUTTONS_WITH_DEBUGGING.html**

### Step 2: Test & Collect Data
1. Visit https://www.boomnut.co.za/pricing
2. Open browser Console: `F12` → Console tab
3. Open Network tab: `F12` → Network tab
4. Sign in
5. Try $0.10 test plan
6. Complete PayPal payment
7. Screenshot/copy the console output

### Step 3: Check Each Step
Look for lines starting with `[1]`, `[2]`, `[3]`, etc.

**Expected Success:**
```
[1] ✅ PayPal approved. Subscription ID: I-XXXXXXXXXX
[2] Checking localStorage...
    userId: ✓ Found
    userEmail: ✓ Found
[3] Calling /api/subscription/create with: {...}
[4] API Response Status: 200 OK
[5] ✅ API Success Response: {success: true...}
[6] ✅ Subscription saved to database successfully!
```

**If you see something else**, go to the corresponding cause above.

### Step 4: Check Network Tab
- Look for request to `/api/subscription/create`
- Check Status code (200 = good, 404 = missing endpoint, 500 = server error)
- Click on it and look at Response tab for error message

### Step 5: Check Firebase
1. Go to Firebase Console → Realtime Database
2. Look at Data tab
3. Check if `/subscriptions/` has any new entries after payment
4. If YES → Data IS being saved (might be a UI issue)
5. If NO → Data is NOT being saved (database connection issue)

---

## Quick Reference: Status Codes

| Code | Meaning | Next Step |
|------|---------|-----------|
| **200** | ✅ Success | Check Firebase RTDB for new subscription |
| **400** | ❌ Bad Request | Missing required fields |
| **404** | ❌ Endpoint Missing | Deploy backend code to production |
| **500** | ❌ Server Error | Check backend logs, likely missing env var |
| **403** | ❌ Forbidden | Firebase rules issue or auth problem |

---

## Production Checklist

Before claiming it's "fixed", verify:

- [ ] PayPal buttons are updated with API integration (not just alert)
- [ ] Debugging version deployed so you can see console logs
- [ ] All environment variables set on production server
- [ ] Backend `/api/subscription/create` endpoint exists on production
- [ ] User is signed in before attempting subscription
- [ ] localStorage has `userId` and `userEmail`
- [ ] Test $0.10 plan completes payment
- [ ] Browser console shows `[6] ✅ Subscription saved to database successfully!`
- [ ] Firebase RTDB shows new subscription in `/subscriptions/` path
- [ ] Next visit to pricing page shows "✓ Active - 30 days left"

---

## Still Having Issues?

Provide:
1. **Browser console output** (screenshot or copy-paste [1] through [6])
2. **Network response** (screenshot of `/api/subscription/create` response)
3. **Firebase RTDB content** (is `/subscriptions/` path empty or populated?)
4. **Production URL** you're testing (boomnut.co.za/pricing)
5. **Hosting platform** (Vercel, cPanel, custom server, etc)

---

## Files Reference

- `PAYPAL_BUTTONS_WITH_DEBUGGING.html` - Version with console logging
- `PAYPAL_BUTTONS_FIXED.html` - Clean version without debug logs (for after fix)
- This file - Troubleshooting guide
