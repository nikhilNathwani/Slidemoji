# Firebase Anonymous Auth Architecture

## Questions & Answers

### 1. Why check `user && !user.isAnonymous` instead of just `!user.isAnonymous`?

**You're right** - now that everyone auto-signs in (anonymous or Google), `user` is always populated. We can simplify to just check `user?.isAnonymous === false`.

**Updated:**
- Before: `user && !user.isAnonymous` 
- After: `user?.isAnonymous === false` (clearer intent)

The `?.` optional chaining is still useful during the initial loading state before auto sign-in completes.

### 2. Doesn't anonymous auth eliminate branching logic?

**Partially, but not completely.** Anonymous auth eliminates:
- ❌ Dual storage (localStorage vs Firestore)
- ❌ "if signed in use Firestore, else use localStorage" logic
- ❌ Data migration complexity

**But branching is still needed for UX:**
- ✅ Show "Sign in" button for anonymous users
- ✅ Show "Sign in to save" upsell for anonymous users
- ✅ Show avatar/sign-out menu only for Google users

Anonymous users SHOULD save to Firestore - that's the whole point! When they upgrade to Google, the data migrates seamlessly via `linkWithCredential`.

### 3. Where is anonymous user data saved? IndexedDB or Firestore?

**Both!** Here's how it works:

```
Anonymous User → Firebase UID (e.g., "abc123")
                ↓
         Saves to Firestore (cloud)
                ↓
      Firestore SDK automatically caches in IndexedDB (local)
```

**Data flow:**
1. **Write**: `updateDoc(db, "users/abc123", data)` → Saved to Firestore cloud
2. **Offline persistence**: Firestore SDK automatically mirrors to IndexedDB
3. **Read**: `onSnapshot(db, "users/abc123")` → Reads from IndexedDB cache (instant!), syncs from cloud
4. **Offline**: Works entirely from IndexedDB cache
5. **Comes back online**: IndexedDB queue auto-syncs to Firestore

**Summary:** 
- **Firestore** = Source of truth (cloud database)
- **IndexedDB** = Automatic offline cache (managed by Firestore SDK)
- We write to Firestore, Firestore SDK handles IndexedDB automatically

### 4. Should anonymous users see trophy count "1 / 87"?

**Yes, show it!** Reasons:
- ✅ **Motivating**: Shows there are 87 total puzzles to collect
- ✅ **Progress**: Visual sense of completion (1.1% vs 100%)
- ✅ **Gamification**: Makes the collection feel bigger and more valuable
- ❌ **Not confusing**: It's clear what the numbers mean

The sign-in upsell ("Sign in to save your trophies") combined with the count creates FOMO and urgency.

### 5. Why did I lose data when signing in?

**Critical bug:** `linkWithCredential` fails when you already have a Google account in Firebase from a previous session.

**The problem:**
1. You were anonymous with progress (3x3 solved, 4x4 in progress)
2. Clicked "Sign in with Google"
3. Firebase tried to link anonymous UID to your existing Google account
4. Failed with `auth/credential-already-in-use`
5. Old buggy code called `signOut()` → Lost everything
6. Tried to open new popup → Blocked by browser (auth/popup-blocked)
7. You became a brand new anonymous user 😢

**Fixed with data merging:**
```javascript
// New flow when linking fails:
try {
  await linkWithCredential(anonymousUser, googleCredential);
} catch (error) {
  if (error.code === 'auth/credential-already-in-use') {
    // 1. Get anonymous user's data
    const anonymousData = await getFirestoreUserData(anonymousUserId);
    
    // 2. Sign out anonymous user
    await signOut();
    
    // 3. Sign in with existing Google account
    const googleUser = await signInWithPopup(auth, googleProvider);
    
    // 4. Merge anonymous data into Google account
    await mergeAnonymousDataToGoogle(anonymousUserId, googleUser.uid);
    
    // ✅ You keep your 3x3 trophy and 4x4 progress!
  }
}
```

**What was fixed:**
- ✅ Data merge function added
- ✅ Proper error handling
- ✅ No more popup-blocked errors
- ✅ Progress preserved when upgrading to Google
- ✅ Button shows "Loading..." during sign-in (no stuck disabled state)

## Architecture Summary

**Before (with React Query + localStorage):**
```
User state → if(signed in) use Firestore + React Query
          → else use localStorage
          
Migration: Manual copy from localStorage → Firestore on first sign-in
Bugs: Cache sync issues, optimistic update conflicts, dual storage complexity
```

**After (with Firebase Anonymous Auth):**
```
Everyone → Firebase UID (anonymous or Google)
        → Saves to Firestore
        → IndexedDB persistence automatic (via Firestore SDK)
        → Real-time updates via onSnapshot
        
Upgrade: linkWithCredential (seamless) or data merge (if account exists)
Benefits: Simpler, fewer bugs, real-time by default, one storage system
```

## Files Changed

- `src/backend/auth.js` - Added data merge logic for existing Google accounts
- `src/backend/firestore.js` - Added `mergeAnonymousDataToGoogle()` function
- `src/components/common/GoogleSignInButton.jsx` - Added loading state, fixed disabled button
- `src/components/Header.jsx` - Simplified `user?.isAnonymous === false` check
- `src/components/stats/StatsContent.jsx` - Show trophy count for anonymous users

## Testing the Fix

1. ✅ Anonymous user wins puzzle → Trophy saved
2. ✅ Anonymous user refreshes → Trophy persists
3. ✅ Anonymous user changes preference → Preference persists
4. ✅ Anonymous user signs in with Google → Data merges, nothing lost
5. ✅ If sign-in popup cancelled → Button re-enables properly
6. ✅ If already have Google account → Data merges correctly
