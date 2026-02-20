# Google OAuth Setup Guide

This guide walks you through setting up Google Sign-In for Slidemoji.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name it "Slidemoji" and click "Create"

## Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click it and press "Enable"

## Step 3: Create OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (unless you have a Google Workspace)
3. Fill in the required fields:
   - App name: `Slidemoji`
   - User support email: Your email
   - Developer contact email: Your email
4. Click "Save and Continue"
5. Skip "Scopes" for now (click "Save and Continue")
6. Add test users if needed (for testing before publishing)
7. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Client ID

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Name it "Slidemoji Web Client"
5. Add Authorized JavaScript origins:
   - `http://localhost:5173` (for local development)
   - `https://yourdomain.com` (your production domain)
6. Add Authorized redirect URIs:
   - `http://localhost:5173` (for local development)
   - `https://yourdomain.com` (your production domain)
7. Click "Create"
8. **Copy the Client ID** - you'll need this!

## Step 5: Configure Environment Variables

1. Create a `.env` file in your project root (if it doesn't exist):
   ```bash
   touch .env
   ```

2. Add your Google Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

3. Add `.env` to your `.gitignore` to keep it private:
   ```
   echo ".env" >> .gitignore
   ```

## Step 6: Update App.jsx to Use Auth

The auth utilities are already created in `src/utils/auth.js`. Now integrate them:

```jsx
import { useEffect, useState } from "react";
import { initGoogleAuth, signInWithGoogle, signOut, getCurrentUser } from "./utils/auth";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Initialize Google Auth when app loads
    initGoogleAuth();

    // Listen for auth state changes
    const handleAuthChange = (event) => {
      setUser(event.detail);
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    
    // Check if already signed in
    setUser(getCurrentUser());

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  const handleSignIn = () => {
    signInWithGoogle();
  };

  const handleSignOut = () => {
    signOut();
  };

  // Use handleSignIn for both landing page and stats dialog sign-in buttons
  // ...
}
```

## Step 7: Backend Integration

To save user data (trophies, stats, streaks), you'll need a backend. Here are your options:

### Option A: Firebase (Recommended for Quick Start)

**Pros:** Easy setup, handles auth + database, generous free tier
**Setup:**

1. Install Firebase:
   ```bash
   npm install firebase
   ```

2. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

3. Enable Firestore Database

4. Create `src/utils/firebase.js`:
   ```js
   import { initializeApp } from 'firebase/app';
   import { getFirestore } from 'firebase/firestore';

   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID
   };

   const app = initializeApp(firebaseConfig);
   export const db = getFirestore(app);
   ```

5. Add Firebase config to `.env`

6. Create `src/utils/userdata.js` for database operations:
   ```js
   import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
   import { db } from './firebase';

   export async function saveUserProgress(userId, data) {
     await setDoc(doc(db, 'users', userId), data, { merge: true });
   }

   export async function getUserProgress(userId) {
     const docRef = doc(db, 'users', userId);
     const docSnap = await getDoc(docRef);
     return docSnap.exists() ? docSnap.data() : null;
   }

   export async function addTrophy(userId, emoji, puzzleNumber, date) {
     const userRef = doc(db, 'users', userId);
     const userData = await getUserProgress(userId);
     
     const trophies = userData?.trophies || [];
     trophies.push({ emoji, puzzleNumber, date });
     
     await updateDoc(userRef, { trophies });
   }
   ```

### Option B: Supabase

**Pros:** PostgreSQL database, real-time features, good free tier

1. Install Supabase:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Create project at [supabase.com](https://supabase.com)

3. Create tables for user data

### Option C: Custom Backend (Node.js + PostgreSQL/MongoDB)

**Pros:** Full control, scalable
**Cons:** More setup work

1. Create Express.js API
2. Setup database (PostgreSQL or MongoDB)
3. Create endpoints:
   - `POST /api/auth/google` - Verify Google token
   - `GET /api/user/:id` - Get user data
   - `POST /api/user/:id/trophy` - Add trophy
   - `GET /api/user/:id/stats` - Get stats

## Data Schema

Here's what you should store per user:

```json
{
  "userId": "google_user_id",
  "email": "user@example.com",
  "settings": {
    "darkMode": true,
    "difficulty": 3
  },
  "trophies": [
    {
      "emoji": "😀",
      "name": "Grinning Face",
      "puzzleNumber": 1,
      "completedAt": "2026-02-20T10:30:00Z",
      "moves": 42,
      "timeSeconds": 123
    }
  ],
  "stats": {
    "totalPuzzlesSolved": 15,
    "currentStreak": 5,
    "longestStreak": 12,
    "averageMoves": 38,
    "averageTime": 145
  }
}
```

## Next Steps After Setup

1. **Test Sign-In**: Run your app and try signing in
2. **Add Loading States**: Show loading when auth is initializing
3. **Handle Errors**: Add error handling for failed sign-ins
4. **Sync Data**: When user signs in, sync their local data to backend
5. **Add Sign Out**: Show user info and sign out button when signed in
6. **Privacy Policy**: Create a privacy policy page (required by Google)
7. **Terms of Service**: Create ToS page
8. **Publish OAuth App**: Submit for Google verification (for production)

## Testing

1. Start dev server: `npm run dev`
2. Click "Sign in with Google"
3. Select your Google account
4. Grant permissions
5. You should be signed in!

## Troubleshooting

- **"popup_closed_by_user"**: User closed the sign-in popup
- **"invalid_client"**: Check your Client ID is correct
- **"redirect_uri_mismatch"**: Add your URL to authorized redirect URIs
- **CORS errors**: Make sure JavaScript origins are configured

## Production Checklist

- [ ] Add production domain to OAuth settings
- [ ] Set up SSL certificate (HTTPS required)
- [ ] Update environment variables for production
- [ ] Test sign-in on production domain
- [ ] Submit app for Google verification
- [ ] Add privacy policy and terms links to OAuth consent screen
