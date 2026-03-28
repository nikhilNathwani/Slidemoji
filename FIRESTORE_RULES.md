# Firestore Security Rules Deployment

## Deploy Rules to Firebase

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize (if not already done)
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

## Security Rules Explained

### ✅ What's Protected:
1. **User Isolation**: Each user (anonymous or Google) can ONLY read/write their own data
2. **UID Verification**: `request.auth.uid == userId` ensures user can only access documents with their own UID
3. **No Cross-User Access**: User A cannot read or modify User B's data
4. **Puzzle Protection**: Puzzles are read-only (managed by admins)
5. **UID Immutability**: Once created, a user's UID cannot be changed

### 🔒 Attack Prevention:
- ❌ Cannot read other users' progress/preferences
- ❌ Cannot modify other users' progress/preferences  
- ❌ Cannot create documents for other users
- ❌ Cannot delete any documents
- ❌ Cannot modify puzzles

### ⚠️ Important:
After deploying these rules, **enable Anonymous Authentication** in Firebase Console:
1. Go to Firebase Console → Authentication
2. Click "Sign-in method" tab
3. Click "Anonymous" → Enable → Save

Without enabling anonymous auth in the console, the app will stay stuck on "Loading..."
