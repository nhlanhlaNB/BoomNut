# Fix Daily Usage Counter Not Incrementing - April 12, 2026

## The Problem
You sent 2 messages but counter shows: `Free Plan: 1/2 messages used today`

**Root Cause:** Your Firebase Realtime Database rules don't include the `dailyUsage` path, so writes are being rejected by Firebase.

## The Solution

### Step 1: Update Firebase Realtime Database Rules ✅

1. Go to **Firebase Console** → **Realtime Database** → **Rules**
2. Replace ALL existing rules with the content from: `FIREBASE_RTDB_RULES_WITH_DAILY_USAGE.json`
3. Click **"Publish"**

**What Changed:**
```json
"dailyUsage": {
  ".read": "auth != null && $uid === auth.uid",
  ".write": "auth != null && $uid === auth.uid",
  ".indexOn": ["date"],
  "$date": {
    ".read": "auth != null && $uid === auth.uid",
    ".write": "auth != null && $uid === auth.uid",
    ".validate": "newData.isNumber() && newData.val() >= 0"
  }
}
```

This allows users to read/write to their own daily usage tracking (stored at `/users/{userId}/dailyUsage/{YYYY-MM-DD}/{appName}`).

### Step 2: Test the Fix

1. **Open Developer Console** (F12 → Console)
2. **Clear your browser cache** (Ctrl+Shift+Delete)
3. **Send 3 messages** in the Tutor
4. **Watch the console** for log messages like:
   - `[USAGE POST] ✓ Updated - User: abc123xyz, App: tutor, New Usage: 1`
   - `[USAGE POST] ✓ Updated - User: abc123xyz, App: tutor, New Usage: 2`
   - `[USAGE POST] ✓ Updated - User: abc123xyz, App: tutor, New Usage: 3`

5. **Verify the counter updates**:
   - After 1st message: `Free Plan: 1/2`
   - After 2nd message: `Free Plan: 2/2`
   - After 3rd message: Counter shows limit reached ⚠️

### Step 3: Debug If Still Not Working

Open browser console and check for these in order:

**Issue 1: API Returns 404**
```
[USAGE GET] No data yet for {userId}/tutor/2026-04-12 (404)
```
✅ This is NORMAL - just means first use of the day

**Issue 2: PUT Failed**
```
[USAGE POST] ✗ Failed to update: 403 Forbidden
```
❌ This means Firebase rules need updating (go back to Step 1)

**Issue 3: Network Error**
```
[USAGE POST] ✗ Error tracking usage for tutor: 
TypeError: Failed to fetch
```
❌ Check that `NEXT_PUBLIC_FIREBASE_DATABASE_URL` env var is correct

### Step 4: Verify in Firebase Console

After sending a message:
1. Go to Firebase Console → **Realtime Database**
2. Navigate to: `/users/{your-uid}/dailyUsage/2026-04-12/tutor`
3. Should show a number (e.g., `2`)

## How Counter Increments Work

```
Message 1 Sent (Time: 4:58:07 PM)
  ↓
trackUsage() called
  ↓
GET /users/abc123/dailyUsage/2026-04-12/tutor → returns null (first use)
  ↓
Increment: null → 0 → 1
  ↓
PUT 1 to Firebase
  ↓
Counter updates: 1/2 ✅

Message 2 Sent (Time: 4:58:15 PM)
  ↓
trackUsage() called
  ↓
GET /users/abc123/dailyUsage/2026-04-12/tutor → returns 1
  ↓
Increment: 1 → 2
  ↓
PUT 2 to Firebase
  ↓
Counter updates: 2/2 ✅
```

## Quick Checklist

- [ ] Updated Firebase Realtime Database rules with `dailyUsage` section
- [ ] Published the rules
- [ ] Cleared browser cache (Ctrl+Shift+Delete)
- [ ] Sent a test message
- [ ] Checked browser console for `[USAGE]` logs
- [ ] Counter incremented correctly

## Technical Details

### Database Path Structure
```
/users/{userId}
  /dailyUsage
    /2026-04-12
      /tutor: 2
      /arcade: 1
      /essay-grading: 0
    /2026-04-11
      /tutor: 2
```

### API Flow
- **GET** `/api/usage/track?userId={uid}&appName=tutor`
  - Returns current count for today
  - Returns 404 if no data (normal)

- **POST** `/api/usage/track` with `{ userId, appName }`
  - Increments count by 1
  - Returns new count

### Reset Behavior
- Counter automatically resets at midnight **UTC**
- Each app (tutor, arcade, essay-grading) has separate counter
- Counters persist across page refreshes
- Subscription users bypass counter entirely

## If Still Having Issues

1. **Check Firebase Database URL:**
   ```bash
   echo $NEXT_PUBLIC_FIREBASE_DATABASE_URL
   ```
   Should output: `https://tutapp-88bf0-default-rtdb.firebaseio.com`

2. **Check Auth Status:**
   - Open DevTools → Network tab
   - Send a message
   - Look for `/api/usage/track` request
   - Check response in `Preview` tab

3. **Check Firebase Rules:**
   - Go to Firebase Console
   - Click **Rules** in Realtime Database  
   - Verify `"dailyUsage"` section exists

## What to Share With Support

If it still doesn't work, share:
1. Screenshot from browser console showing`[USAGE]` logs
2. Screenshot from Firebase Console showing the database structure under `/users/{your-uid}/`
3. The response from the `/api/usage/track` API call (use Network tab)

---

**Last Updated:** April 12, 2026  
**Status:** Ready for testing
