# Complete Firebase Firestore Security Rules

Complete, production-ready Firebase Firestore Security Rules for BoomNut AI Learning Platform.

## How to Deploy

### Step 1: Copy the Rules
Go to [Firebase Console](https://console.firebase.google.com):
1. Select your project
2. Go to **Firestore Database** → **Rules** tab
3. Delete existing rules
4. Copy & paste the rules from `firebaseRulesSubscription.json`
5. Click **Publish**

### Step 2: Wait for Deployment
Firebase deploys rules within 2-3 seconds. You'll see a green checkmark when complete.

---

## Rules Structure Explained

### **Helper Functions**
These functions are used throughout the rules to reduce duplication:

```javascript
isAuthenticated()      // User is logged in
isUser(userId)         // Request is from that specific userId
isSubscribed(userId)   // User has active subscription
hasValidTimestamp()    // Data is less than 90 days old
```

---

## Collection Rules

### **1. `/users/{userId}` - User Profiles**
```
✓ Read:   User can read own profile
✓ Write:  User can update own profile
✓ Update: PayPal webhooks can update subscription status
✗ Deny:   Other users cannot access
```
**Stores:**
- User email, name, profile photo
- Subscription status & dates
- User settings & preferences

---

### **2. `/chatSessions/{sessionId}/` - Tutor Chat Sessions**
```
✓ Read:   User owning the session
✓ Write:  User owning the session
✓ Create: Any authenticated user
✗ Deny:   Other users cannot access
```
**Subcollection: `messages/`**
- Chat messages with timestamps
- Automatic 90-day retention

---

### **3. `/studySets/{setId}/` - Flashcard Sets**
```
✓ Read:   Owner or public sets
✓ Create: Any authenticated user
✓ Update: Owner only
✓ Delete: Owner only
✗ Public sets: Anyone can read
```
**Subcollections:**
- **`cards/`** - Individual flashcard definitions
- **`reviews/`** - Spaced repetition review data

---

### **4. `/quizzes/{quizId}/` - Quiz History**
```
✓ Read:   Owner or public quizzes
✓ Create: Any authenticated user
✓ Update: Owner only
✓ Delete: Owner only
```
**Subcollection: `attempts/`**
- Quiz attempt history
- Scores and answers

---

### **5. `/studyGuides/{guideId}/` - Study Guides**
```
✓ Read:   Owner or public guides
✓ Create: Any authenticated user
✓ Update: Owner only
✓ Delete: Owner only
```
**Subcollection: `sections/`**
- Guide sections with content

---

### **6. `/documents/{docId}/` - Uploaded Documents**
```
✓ Read:   Owner or public documents
✓ Create: Any authenticated user
✓ Update: Owner only
✓ Delete: Owner only
```
**Stores:**
- Uploaded PDFs, images, etc.
- Extracted text content
- File metadata

---

### **7. `/progress/{progressId}/` - Learning Progress**
```
✓ Read:   User only
✓ Create: User only (auto-created)
✓ Update: User only
✓ Delete: User only
```
**Stores:**
- Topics completed
- Scores achieved
- Achievements unlocked
- Time spent studying

---

### **8. `/studyRooms/{roomId}/` - Collaborative Study Rooms**
```
✓ Read:   Room creator, participants, or public rooms
✓ Create: Any authenticated user
✓ Update: Room creator only
✓ Delete: Room creator only
```
**Subcollections:**
- **`messages/`** - Room chat messages
- **`participants/`** - List of participants

---

### **9. `/communityPosts/{postId}/` - Community Posts**
```
✓ Read:   Public or owner (shared knowledge)
✓ Create: Any authenticated user
✓ Update: Creator only
✓ Delete: Creator only
```
**Subcollections:**
- **`comments/`** - Post comments
- **`likes/`** - Like tracking

---

### **10. `/notifications/{notifId}/` - Notifications**
```
✓ Read:   User only
✓ Write:  Server only (via functions)
✓ Delete: User only
```
**Auto-created notifications:**
- Achievement unlocked
- Friend request
- Study milestone
- New community posts

---

### **11. `/paymentHistory/{paymentId}/` - Payment Records**
```
✓ Read:   User only
✓ Create: Server only (PayPal webhook)
✓ Delete: Never (audit trail)
```
**Stores:**
- PayPal transaction IDs
- Plan purchased
- Amount paid
- Date/time
- Subscription status change

---

### **12. `/activityLogs/{logId}/` - Activity Logs**
```
✓ Read:   User only
✓ Create: User writes own activity
✓ Delete: Auto-delete after 90 days
```
**Tracks:**
- Login timestamps
- Study sessions
- Feature usage

---

## Security Features

### ✅ Authentication Protection
- All writes require valid Firebase authentication
- Webhook-only routes allow PayPal server access
- No public write access (except comments)

### ✅ User Isolation
- Users can only read/write their own data
- Cannot access other users' private data
- Public data accessible to everyone

### ✅ Subscription Integration
- PayPal webhooks update subscription status
- Cannot manually change valid subscription
- Automatic expiry after 30 days

### ✅ Rate Limiting (via Cloud Functions)
- Limit number of documents users can create
- Prevent spam in comments/posts
- Throttle API calls

### ✅ Data Validation
- Timestamps must be valid
- Required fields checked
- Data types validated

### ✅ Sensitive Data Protection
- Password hashes never stored in Firestore
- Payment details only in PayPal
- No credit card data in database

---

## Collections Quick Reference

| Collection | Purpose | Public? | Owner Only? |
|---|---|---|---|
| `users` | Profiles & subscriptions | No | ✓ |
| `chatSessions` | Tutor conversations | No | ✓ |
| `studySets` | Flashcard collections | Optional | ✓ |
| `quizzes` | Quiz history | Optional | ✓ |
| `studyGuides` | Study guide content | Optional | ✓ |
| `documents` | Uploaded files | Optional | ✓ |
| `progress` | Learning progress | No | ✓ |
| `studyRooms` | Collab rooms | Optional | ✓ |
| `communityPosts` | Shared knowledge | Yes | ✓ |
| `notifications` | User notifications | No | ✓ |
| `paymentHistory` | Payment records | No | ✓ |
| `activityLogs` | User activity | No | ✓ |

---

## Testing the Rules

### Test Case 1: Unauthorized Access
```javascript
// This should FAIL
db.collection('users').doc('other-user-id').get()
// Result: Permission denied
```

### Test Case 2: Own Data Access
```javascript
// This should SUCCEED
db.collection('users').doc(currentUser.uid).get()
// Result: User data retrieved
```

### Test Case 3: Public Post Access
```javascript
// This should SUCCEED
db.collection('communityPosts').where('isPublic', '==', true).get()
// Result: Public posts retrieved
```

### Test Case 4: Webhook Update
```javascript
// This should SUCCEED (from PayPal server)
// No auth header, updates subscription
db.collection('users').doc(userId).update({
  'subscription.status': 'expired'
})
// Result: Subscription updated
```

---

## Best Practices

### ✅ DO

✓ Always check `isAuth` before write operations  
✓ Validate `userId` matches request.auth.uid  
✓ Use helper functions to reduce duplication  
✓ Set 90-day retention for historical data  
✓ Require `isPublic` for shared content  
✓ Log all payment/subscription changes  

### ❌ DON'T

✗ Allow unauthenticated writes (except webhooks)  
✗ Skip user verification checks  
✗ Store sensitive data unencrypted  
✗ Allow cross-user data access  
✗ Delete payment history  
✗ Make all user data public by default  

---

## Troubleshooting

### Rules Rejected - Syntax Error
- Check brackets and colons
- Ensure all `match` blocks are closed
- Verify function syntax

### Permissions Denied
- Verify user is authenticated
- Check `request.auth.uid` matches document `userId`
- Confirm rule allows the operation

### Webhook Not Working
- Verify PayPal webhook is calling correct endpoint
- Check `request.auth == null` condition
- Ensure `Firestore.admin.firestore()` in backend

### Data Not Persisting
- Check browser console for errors
- Verify Firestore is initialized
- Confirm `.env.local` has Firebase keys

---

## Advanced Configuration

### Add Backup Rules
```javascript
// For complete public read (for announcements)
match /announcements/{announcementId} {
  allow read: if true;
  allow write: if false; // Admin only
}
```

### Add Rate Limiting
```javascript
match /comments/{commentId} {
  allow create: if request.time > resource.createTime + duration.value(60, 's');
}
```

### Enable Field-Level Access
```javascript
match /users/{userId} {
  allow read: if isUser(userId);
  allow update: if isUser(userId) && 
                   request.resource.data.email == resource.data.email; // Email immutable
}
```

---

## Production Checklist

- [ ] Rules copied to Firebase Console
- [ ] Rules published (green checkmark)
- [ ] Test read access works
- [ ] Test write access fails for unauthorized users
- [ ] PayPal webhook verified
- [ ] All collections created
- [ ] Backup enabled in Firebase
- [ ] Monitoring alerts set up
- [ ] User privacy policy updated
- [ ] GDPR compliance verified

---

## Additional Resources

- [Firebase Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Rules Playground](https://firebase.google.com/console) → Rules tab
- [Security Best Practices](https://firebase.google.com/docs/firestore/security/best-practices)

---

**Last Updated:** March 24, 2026  
**Status:** ✅ Production Ready
