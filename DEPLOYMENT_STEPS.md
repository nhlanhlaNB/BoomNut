# Step-by-Step: Deploy PayPal Subscription Fix

## **OPTION A: If using local Next.js code (Recommended)**

Your local Next.js code in `/app/pricing/page.tsx` is **correct and already has the proper integration**. You just need to deploy it.

### Steps:
1. **Ensure your local code is up-to-date** with the latest pricing page from this workspace
2. **Run tests locally**:
   ```bash
   npm run dev
   # Visit http://localhost:3000/pricing
   # Test the $0.10 plan
   ```
3. **Deploy to production** (Vercel/your host):
   ```bash
   git add .
   git commit -m "Fix: PayPal subscription API integration"
   git push origin main
   ```
4. **Test on production**:
   - Visit https://www.boomnut.co.za/pricing
   - Sign in with test account
   - Try $0.10 test plan
   - Check browser console for "✅ Subscription saved:" message
   - Verify subscription appears in Firebase RTDB

---

## **OPTION B: If using hardcoded HTML (Quick Fix)**

If you're managing the pricing page through a website builder or static HTML:

### Step 1: Backup Current Code
Save your current pricing page HTML/code somewhere safe.

### Step 2: Update the $3 Premium Plan Button

**Find this code block:**
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
          /* Creates the subscription */
          plan_id: 'P-51711759R0127122YNHA4ITY'
        });
      },
      onApprove: function(data, actions) {
        alert(data.subscriptionID);
      }
  }).render('#paypal-button-container-P-51711759R0127122YNHA4ITY');
</script>
```

**Replace with:**
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
          
          // Get user info from localStorage
          const userId = localStorage.getItem('userId');
          const userEmail = localStorage.getItem('userEmail');
          
          if (!userId || !userEmail) {
            alert('❌ User information not found. Please sign in again.');
            return;
          }
          
          // Call backend API to save subscription
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

### Step 3: Update the $0.10 Test Plan Button

**Find this code block:**
```html
<div id="paypal-button-container-P-7V61468029079353FNHDOXSQ"></div>
...
plan_id: 'P-7V61468029079353FNHDOXSQ'
```

**Replace with:** (same code as above, but change:)
```javascript
plan: 'test', // instead of 'premium'
```

### Step 4: Save and Publish

- Save the updated HTML
- Publish/deploy your website
- Clear browser cache (Ctrl+Shift+Delete)

---

## **Testing Your Fix**

### Before Testing:
- Make sure user is **signed in**
- Make sure `userId` and `userEmail` are stored in localStorage

### Test Steps:
1. **Go to https://www.boomnut.co.za/pricing**
2. **Sign in with test account**
3. **Click "$0.10" test plan button**
4. **Complete PayPal payment** (use PayPal test account)
5. **Check browser console** (F12 → Console):
   - Should see: `✅ Subscription saved: { success: true, ... }`
   - NOT: `❌ Subscription created but failed to save...`
6. **After page reloads**, should show subscription details
7. **Go to Firebase Console** → Realtime Database → `subscriptions/`:
   - Should see new entry with your userId, plan: 'test', status: 'active'

---

## **Expected Results**

✅ **Success**: Browser shows alert "✅ Successfully subscribed..." then reloads
✅ **Database**: Subscription appears in Firebase Realtime DB under `/subscriptions/`
✅ **Next time you visit pricing**: Should show "✓ Active - 30 days left" instead of payment button

❌ **Failure**: Browser shows "❌ Subscription created but failed to save..."
❌ **What to check**:
- Is user signed in?
- Are `userId` and `userEmail` in localStorage?
- Is Firebase RTDB URL configured?
- Check browser console for detailed error message

---

## **Troubleshooting**

| Error | Cause | Fix |
|---|---|---|
| "User information not found" | Not signed in | Sign in first, then try subscription |
| "Failed to save subscription" | Backend error | Check server logs, ensure endpoint exists |
| No entry in Firebase RTDB | Database not configured | Check NEXT_PUBLIC_FIREBASE_DATABASE_URL |
| Page doesn't reload after alert | Firebase write slow | Wait 5 seconds, then manually reload |
| Same error after fix | Old code still running | Clear browser cache completely |

---

## **If This Doesn't Work**

Contact support with:
1. Browser console output (F12 → Console, copy all logs)
2. PayPal subscription ID (from the alert or Console)
3. Your Firebase project ID
4. Confirmation that you updated the code exactly as shown above

---

## **Key difference: Old vs New Code**

| Aspect | Old Code | New Code |
|---|---|---|
| **onApprove** | Shows alert only | Calls API + saves to database |
| **Error handling** | None | Detailed error messages |
| **Database save** | ❌ Never happens | ✅ Automatic |
| **User experience** | Fails silently | Clear success/error feedback |

