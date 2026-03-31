# Debug Guide - Subscription Save Failure

Your website is still failing to save subscriptions. Let's find out WHY.

## Step 1: Replace with Debugging Version

Replace the PayPal buttons on boomnut.co.za/pricing with the code from:
**PAYPAL_BUTTONS_WITH_DEBUGGING.html**

This version logs EVERY step of the process to the browser console.

---

## Step 2: Test and Check Console

1. **Go to** https://www.boomnut.co.za/pricing
2. **Open browser console**: Press `F12` → click "Console" tab
3. **Sign in** with test account
4. **Try the $0.10 test plan**
5. **Complete PayPal payment**
6. **Look at the console output**

---

## Step 3: Identify the Failure Point

The console will show which step failed. Look for:

### ✅ If You See This:
```
[1] ✅ PayPal approved. Subscription ID: I-XXXXXXXXXXXX
[2] Checking localStorage...
    userId: ✓ Found
    userEmail: ✓ Found
[3] Calling /api/subscription/create with: {...}
[4] API Response Status: 200 OK
[5] ✅ API Success Response: {success: true...}
[6] ✅ Subscription saved to database successfully!
```
**PROBLEM**: Not at this step. Subscription IS being saved. Check Firebase to verify it's in the database.

---

### ❌ If You See This:

**FAILURE AT [2]: "userId: ❌ NOT FOUND"**
- **Problem**: User not signed in properly
- **Fix**: 
  - Make sure your authentication page/component sets localStorage:
    ```javascript
    localStorage.setItem('userId', user.uid);
    localStorage.setItem('userEmail', user.email);
    ```

---

**FAILURE AT [4]: "API Response Status: 404"**
- **Problem**: Backend endpoint `/api/subscription/create` doesn't exist
- **Fix**:
  - Check: Does your project have `/app/api/subscription/create/route.ts`?
  - If not, the endpoint is missing
  - You need to deploy this endpoint from your local code

---

**FAILURE AT [4]: "API Response Status: 500"**
- **Problem**: Backend error
- **Check the error message** in [4]:
```
❌ API Error Response: {
  error: "Firebase Realtime Database not configured",
  details: "RTDB is null - check .env.local for NEXT_PUBLIC_FIREBASE_DATABASE_URL"
}
```

Common causes:
1. `NEXT_PUBLIC_FIREBASE_DATABASE_URL` not set on production server
2. Firebase credentials are wrong
3. Backend code has a bug

**Fix**: 
- Set `NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://tutapp-88bf0-default-rtdb.firebaseio.com` in production env variables
- Or check your backend logs for the actual error

---

**FAILURE AT [4]: "API Response Status: 401/403"**
- **Problem**: Firebase rules are blocking the write
- **Check**: Your rules require `auth != null` and the required fields
- **But**: The backend should have admin privileges, not user auth
- **Issue**: Your backend might not be using Firebase Admin SDK

---

## Step 4: Copy Exact Error Message

When you see the error, **copy the exact error message** from the console, for example:

```
[ERROR] Firebase Realtime Database not configured
[STACK] Error: Firebase Realtime Database not configured
    at POST /api/subscription/create (...)
```

---

## Most Likely Problem

Based on your setup, the issue is probably:

**The backend `/api/subscription/create` endpoint is NOT decorated properly for Firebase RTDB** 

Check your endpoint code at `/app/api/subscription/create/route.ts`:

### THE ISSUE:
If it uses user context auth like:
```typescript
// ❌ WRONG - Uses user auth, gets blocked by rules
const { getAuth } = require('firebase/auth');
const auth = getAuth();
const user = auth.currentUser;
```

### THE FIX:
It should use Admin SDK in backend:
```typescript
// ✅ RIGHT - Uses admin credentials, bypasses rules
import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const db = getDatabase();
await db.ref(`subscriptions/${subId}`).set(subscriptionData);
```

---

## Quick Checklist

- [ ] Replaced PayPal buttons with debugging version
- [ ] Cleared browser cache (Ctrl+Shift+Delete)
- [ ] Tested $0.10 plan and checked console
- [ ] All steps [1-6] show ✅
- [ ] No error messages in console
- [ ] Firebase RTDB now shows new subscription record

If NOT all checked, go back and follow the steps based on where it fails.

---

## If Multiple Requests Are Shown

In Network tab (F12 → Network), you might see:
- `/api/subscription/create` → Status 200, 404, 500, etc.

Check the status code and response body.

---

## Tell Me:
1. What step number does it fail at?
2. What's the exact error message?
3. What's the HTTP status code from the API?

Once you provide these, I can give you the exact fix.
