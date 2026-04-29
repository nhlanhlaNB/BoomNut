# Debug: Daily Usage Counter Not Incrementing

## Quick Diagnosis

### ✅ If You See This in Console:
```
[USAGE POST] ✓ Verified write succeeded: 2
[useAppUsage] ✓ Tracked tutor usage → 2/2
```
✅ **FIXED!** Counter is working correctly.

### ❌ If You See This in Console:
```
[USAGE POST] ✗ Firebase rejected write (403): Permission Denied
[USAGE POST] ⚠️ RULES CHECK: This error means Firebase Realtime Database rules might not include 'dailyUsage' path
[USAGE POST] 💡 FIX: Update Firebase rules with FIREBASE_RTDB_RULES_WITH_DAILY_USAGE.json
```
❌ **PROBLEM:** Firebase rules NOT updated yet.

### ⚠️ If You See This in Console (After Messages):
```
[useAppUsage] ⚠️ Tracked tutor locally (not persisted): 1/2
[useAppUsage] If this persists, check Firebase rules
```
⚠️ **PROBLEM:** Rules still missing the `dailyUsage` section.

---

## Fix Steps

### Step 1: Verify Current Firebase Rules
In **Firebase Console → Realtime Database → Rules**, search for `"dailyUsage"`

**You should see this section:**
```json
"dailyUsage": {
  ".read": "auth != null && $uid === auth.uid",
  ".write": "auth != null && $uid === auth.uid",
  ".indexOn": ["date"],
  "$date": {
    ".read": "auth != null && $uid === auth.uid",
    ".write": "auth != null && $uid === auth.uid",
    ".validate": "newData.isNumber() && newData.val() >= 0",
    "$appName": {
      ".read": "auth != null && $uid === auth.uid",
      ".write": "auth != null && $uid === auth.uid",
      ".validate": "newData.isNumber() && newData.val() >= 0"
    }
  }
}
```

**If NOT present → You need to update the rules!**

### Step 2: Update the Rules
1. Copy ALL content from: `FIREBASE_RTDB_RULES_WITH_DAILY_USAGE.json`
2. Go to **Firebase Console**
3. Click **Realtime Database** → **Rules**
4. Delete ALL existing content
5. Paste the new rules
6. Click **"Publish"** (blue button)
7. Wait for confirmation ✅

### Step 3: Test

1. **Clear browser cache:** Ctrl+Shift+Delete
2. **Open DevTools:** F12
3. **Go to Console tab**
4. **Send 3 messages** in Tutor
5. **Watch console for logs:**
   - First message: Should see `✓ Verified write succeeded: 1`
   - Second message: Should see `✓ Verified write succeeded: 2`
   - Third message: Should see `✓ Verified write succeeded: 3`
6. **Counter should update:** `1/2` → `2/2`

---

## Verification Checklist

- [ ] Searched Firebase rules for `"dailyUsage"` - FOUND IT
- [ ] Clicked **"Publish"** in Firebase Console (must be BLUE button)
- [ ] Cleared browser cache (Ctrl+Shift+Delete)
- [ ] Reloaded page
- [ ] Opened DevTools Console (F12)
- [ ] Sent test message
- [ ] **Console shows** `✓ Verified write succeeded`
- [ ] Counter incremented to `2/2`

---

## Advanced Debugging

If still not working, check these ONE BY ONE:

### Check 1: Firebase Auth
In browser console, run:
```javascript
firebase.auth().currentUser?.uid
```
Should return your user ID (not null/undefined)

### Check 2: Firebase Database URL
In browser console, run:
```javascript
console.log(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL)
```
Should show: `https://tutapp-88bf0-default-rtdb.firebaseio.com`

### Check 3: Manual Database Write Test
In browser Network tab:
1. Send a message
2. Look for `/api/usage/track` request
3. Click it → **Preview** tab
4. Should show: `"success": true`
5. Should show: `"messageCount": 1` (or higher)

### Check 4: Firebase Console Database Check
1. Go to **Firebase Console → Realtime Database**
2. Look for structure: `/users/{your-uid}/dailyUsage/2026-04-12/tutor`
3. Should show a number like `2`

If you see `2` in step 4 but counter shows `1` → Clear cache harder:
- F12 → Application → Clear Site Data
- Or use Incognito window

---

## Common Issues

**Issue:** Counter shows `Loading usage...` forever
**Fix:** Check Firebase auth (Check 1 above)

**Issue:** Counter shows `1/2` for all messages
**Fix:** Rules not updated (Step 1)

**Issue:** Console shows no `[USAGE]` logs at all
**Fix:** Check browser console is open (F12) and page is refreshed after cache clear

**Issue:** Firebase Console Rules show `dailyUsage` but still fails
**Fix:** Make sure you clicked **"Publish"** (not just reviewed)

---

## Expected Console Output (Full Flow)

**Sending 1st Message:**
```
[useAppUsage] ✓ Loaded tutor usage: 0
[USAGE POST] Getting current usage from: DB_URL/...
[USAGE POST] Current usage from DB: 0
[USAGE POST] Attempting PUT: 1 to tutor/2026-04-12
[USAGE POST] ✓ Verified write succeeded: 1
[USAGE POST] ✓ SUCCESS - User: abc123, App: tutor, Count: 1
[useAppUsage] ✓ Tracked tutor usage → 1/2
```

**Sending 2nd Message:**
```
[USAGE POST] Getting current usage from: DB_URL/...
[USAGE POST] Current usage from DB: 1
[USAGE POST] Attempting PUT: 2 to tutor/2026-04-12
[USAGE POST] ✓ Verified write succeeded: 2
[USAGE POST] ✓ SUCCESS - User: abc123, App: tutor, Count: 2
[useAppUsage] ✓ Tracked tutor usage → 2/2
```

If you're seeing the output from the first message but not the second, it's likely a race condition or the write is failing. Check your Firebase rules again!

---

## Need Help?

Collect this info:
1. Screenshot of Firebase Console Rules (show the `dailyUsage` section)
2. Screenshot of browser console (all `[USAGE]` logs)
3. Browser Network tab response from `/api/usage/track` (show the JSON)
4. Firebase Console Database view at `/users/{uid}/dailyUsage/2026-04-12/`

And share it in the issue!
