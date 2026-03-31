# PayPal Subscription Fix - Complete Solution

## Problem
The PayPal buttons on your live website are not calling the backend API to save subscriptions to the database. When users complete payment, the `onApprove` callback only shows an alert instead of saving the subscription.

## Root Cause
The production PayPal button code is outdated and missing the API integration:

```javascript
// ❌ CURRENT (BROKEN)
onApprove: function(data, actions) {
  alert(data.subscriptionID); // Only shows alert, doesn't save to DB!
}
```

## Solution
Replace the PayPal button code with the version that calls your backend API. Here's the complete fixed implementation:

---

## FIXED PayPal Button Code for $3 Premium Plan

Replace this entire block on your pricing page:

```html
<div id="paypal-button-container-P-51711759R0127122YNHA4ITY"></div>
<script src="https://www.paypal.com/sdk/js?client-id=AV4Blmjwp981Sl85YsvLyCpdJC1qCdRnZ-Y6jzQNcFtEr9laPnG8zt3fQffQpBUmUzEo0UUlBd_McFGe&vault=true&intent=subscription" data-sdk-integration-source="button-factory"></script>
<script>
  paypal.Buttons({
      style: {
          shape: 'rect',
          color: 'gold',
          layout: 'vertical',
          label: 'subscribe'
      },
      createSubscription: function(data, actions) {
        return actions.subscription.create({
          plan_id: 'P-51711759R0127122YNHA4ITY'
        });
      },
      onApprove: async function(data, actions) {
        try {
          console.log('Payment approved, saving to database...', data.subscriptionID);
          
          // Get user info from localStorage or your auth system
          const userId = localStorage.getItem('userId');
          const userEmail = localStorage.getItem('userEmail');
          
          if (!userId || !userEmail) {
            alert('❌ User information not found. Please sign in again.');
            return;
          }
          
          // Call your backend API to save subscription
          const response = await fetch('/api/subscription/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId,
              email: userEmail,
              plan: 'premium',
              subscriptionId: data.subscriptionID,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save subscription');
          }
          
          const result = await response.json();
          console.log('✅ Subscription saved:', result);
          
          alert(`✅ Successfully subscribed to Premium plan!\n\nYour subscription will auto-renew in 30 days.\n\nRefresh to see changes!`);
          
          // Reload page after 2 seconds to show updated status
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          
        } catch (error) {
          console.error('Error saving subscription:', error);
          alert('❌ Subscription created but failed to save to database.\n\n' + error.message + '\n\nPlease try refreshing the page or contact support.');
        }
      },
      onError: function(err) {
        console.error('PayPal error:', err);
        alert('Payment failed. Please try again.');
      }
  }).render('#paypal-button-container-P-51711759R0127122YNHA4ITY');
</script>
```

---

## FIXED PayPal Button Code for $0.10 Test Plan

Replace this entire block on your pricing page:

```html
<div id="paypal-button-container-P-7V61468029079353FNHDOXSQ"></div>
<script src="https://www.paypal.com/sdk/js?client-id=AV4Blmjwp981Sl85YsvLyCpdJC1qCdRnZ-Y6jzQNcFtEr9laPnG8zt3fQffQpBUmUzEo0UUlBd_McFGe&vault=true&intent=subscription" data-sdk-integration-source="button-factory"></script>
<script>
  paypal.Buttons({
      style: {
          shape: 'rect',
          color: 'gold',
          layout: 'vertical',
          label: 'subscribe'
      },
      createSubscription: function(data, actions) {
        return actions.subscription.create({
          plan_id: 'P-7V61468029079353FNHDOXSQ'
        });
      },
      onApprove: async function(data, actions) {
        try {
          console.log('Payment approved, saving to database...', data.subscriptionID);
          
          // Get user info from localStorage or your auth system
          const userId = localStorage.getItem('userId');
          const userEmail = localStorage.getItem('userEmail');
          
          if (!userId || !userEmail) {
            alert('❌ User information not found. Please sign in again.');
            return;
          }
          
          // Call your backend API to save subscription
          const response = await fetch('/api/subscription/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId,
              email: userEmail,
              plan: 'test',
              subscriptionId: data.subscriptionID,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save subscription');
          }
          
          const result = await response.json();
          console.log('✅ Subscription saved:', result);
          
          alert(`✅ Successfully subscribed to Test Boomnut plan!\n\nYour subscription will auto-renew in 30 days.\n\nRefresh to see changes!`);
          
          // Reload page after 2 seconds to show updated status
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          
        } catch (error) {
          console.error('Error saving subscription:', error);
          alert('❌ Subscription created but failed to save to database.\n\n' + error.message + '\n\nPlease try refreshing the page or contact support.');
        }
      },
      onError: function(err) {
        console.error('PayPal error:', err);
        alert('Payment failed. Please try again.');
      }
  }).render('#paypal-button-container-P-7V61468029079353FNHDOXSQ');
</script>
```

---

## Why This Fixes It

1. **onnApprove callback now calls the API**: After PayPal approves the subscription, it sends the data to `/api/subscription/create`
2. **Saves to Firebase**: The backend endpoint saves the subscription to your Realtime Database
3. **Better error handling**: Shows detailed error messages if the save fails
4. **Proper user info**: Gets userId and userEmail from localStorage (make sure your auth system sets these)
5. **Page reload**: Reloads after 2 seconds so Firebase has time to write the data before checking it again

---

## Additional Requirements

### 1. Make sure your auth system stores user info in localStorage:

```javascript
// In your signin/signup page or AuthProvider
localStorage.setItem('userId', user.uid);
localStorage.setItem('userEmail', user.email);
```

OR if you're using the local pricing page code (which uses the context), your code already handles this through the `useAuth` hook.

### 2. Verify Firebase Realtime Database Rules

Your rules look correct, but make sure they allow writes to subscriptions:

```json
{
  "rules": {
    "subscriptions": {
      "$subId": {
        ".read": "auth != null",
        ".write": "newData.hasChildren(['userId', 'status', 'email', 'plan'])",
        ".validate": "newData.hasChildren(['userId', 'status', 'email', 'plan']) && newData.child('userId').isString() && newData.child('status').isString() && newData.child('email').isString() && newData.child('plan').isString()"
      }
    }
  }
}
```

✅ **Your rules are correct!**

### 3. Check that `/api/subscription/create` endpoint exists

Your local code shows the endpoint is implemented correctly and should work.

---

## Testing Steps

1. **Replace the PayPal button code** on your production website with the fixed version above
2. **Sign in with a test account**
3. **Try the $0.10 test plan first** (cheaper to test)
4. **Check browser console** for "✅ Subscription saved:" message
5. **Check Firebase Realtime Database** - you should see a new entry in `/subscriptions/` with userId, plan, status, etc.
6. **Verify the success message** appears instead of the database error

---

## Debugging Checklist

If it still doesn't work:

- [ ] Check browser Console → Network tab → See if `/api/subscription/create` is called and succeeds
- [ ] Check Firebase RTDB for `/subscriptions/` path - should exist
- [ ] Verify `NEXT_PUBLIC_FIREBASE_DATABASE_URL` is set in your `.env.local`
- [ ] Make sure `userId` and `userEmail` are being stored in localStorage
- [ ] Check server logs for errors in the `/api/subscription/create` endpoint

---

## Quick Reference

| Environment | Status | Issue |
|---|---|---|
| **Local Code** | ✅ Good | Pricing page already has correct implementation |
| **Production Website** | ❌ Broken | Using old PayPal buttons that don't call API |
| **Backend API** | ✅ Good | `/api/subscription/create` endpoint is correct |
| **Firebase RTDB** | ✅ Good | Rules and setup are correct |

**Action Required**: Update the PayPal button HTML on production website with the fixed code above.
