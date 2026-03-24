# Firebase Realtime Database Setup Guide

## ⚠️ Required Steps to Fix Subscriptions

Your Firebase is configured but **Realtime Database is NOT enabled**. Follow these steps:

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com/
2. Select your project: **tutapp-88bf0**
3. Click **Realtime Database** in the left menu

### Step 2: Create Realtime Database
1. Click **Create Database**
2. Choose **location: us-central1** (or closest to you)
3. Select **Start in test mode** (for now)
4. Click **Enable**

### Step 3: Copy Your Database URL
1. After creation, you'll see something like:
   ```
   https://tutapp-88bf0-default-rtdb.firebaseio.com
   ```
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://tutapp-88bf0-default-rtdb.firebaseio.com
   ```

### Step 4: Publish Security Rules
1. Go to **Realtime Database → Rules** tab
2. Copy and paste these rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        "subscription": {
          ".read": "$uid === auth.uid",
          ".write": "$uid === auth.uid || auth == null",
          ".validate": "newData.hasChildren(['plan', 'status', 'email'])"
        }
      }
    }
  }
}
```

3. Click **Publish** (confirm the warning)

### Step 5: Update Firebase Config
In `lib/firebase.ts`, add the database URL:

```typescript
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};
```

### Step 6: Verify in Console
1. Go to **Realtime Database** → **Data** tab
2. You should see an empty tree: `tutapp-88bf0` root node
3. When you test, data will appear here:
   ```
   tutapp-88bf0/
   └─ users/
      └─ FVzb9tGqRP.../
         └─ subscription/
            ├─ plan: "basic"
            ├─ status: "active"
            ├─ email: "instruct2@example.com"
            └─ endDate: "2026-04-23..."
   ```

### Step 7: Test Again
1. Hard refresh: **Ctrl+Shift+R**
2. Go to: http://localhost:3000/test-subscription
3. Click **🧪 Create Test Subscription**
4. Check:
   - ✅ Subscription status updates to ACTIVE
   - ✅ Email appears in database
   - ✅ Go to dashboard - apps unlock
   - ✅ Refresh - subscription persists

## 🔗 Quick Links
- Firebase Console: https://console.firebase.google.com/project/tutapp-88bf0
- Realtime Database: https://console.firebase.google.com/project/tutapp-88bf0/database
- Test Page: http://localhost:3000/test-subscription

## ❌ If Still Not Working

Check your browser console (F12) and share the error. Look for:
- `[SUBSCRIPTION CREATE]` messages
- `Database not configured` error
- `rtdb value: null/undefined`

## ✅ Success Signs
- Console shows: `[SUBSCRIPTION CREATE] ✅ Subscription created successfully`
- Database shows new user data
- Dashboard apps unlock immediately
- Status changes real-time
