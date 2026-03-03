# Firebase Setup for Slidemoji

## ✅ Completed Setup

1. ✅ Installed Firebase SDK
2. ✅ Created Firebase configuration files
3. ✅ Created Firestore utility functions
4. ✅ Created authentication helpers
5. ✅ Set up environment variable structure

## 🔧 What You Need to Do Now

### 1. Complete Firebase Console Setup

#### Create Firestore Database

1. In Firebase Console, click **"Create a database"**
2. Select **Standard Edition**
3. Choose **nam5 (United States)** for location
4. Select **"Start in test mode"** for now (we'll secure it later)
5. Click **"Enable"**

#### Register Your Web App

1. Go to **Project Settings** (gear icon) → **General**
2. Scroll to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Enter app nickname: `Slidemoji`
5. Click **"Register app"** (no need for Firebase Hosting - we're using Vercel!)
6. **Copy the firebaseConfig values** - you'll need these next!

### 2. Set Up Environment Variables

1. Copy the example file:

    ```bash
    cp .env.local.example .env.local
    ```

2. Open `.env.local` and paste your Firebase config values from the console:

    ```env
    VITE_FIREBASE_API_KEY=your-actual-api-key
    VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your-project-id
    VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
    VITE_FIREBASE_APP_ID=your-app-id
    ```

3. **Important**: `.env.local` is already in `.gitignore` - never commit this file!

### 3. Add Environment Variables to Vercel

Since you're hosting on Vercel, add these same variables:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable (without the `VITE_` prefix showing in Vercel, but keep it in the variable name)
4. Make sure to add them for all environments (Production, Preview, Development)

### 4. Set Up Firebase Security Rules

In Firebase Console → Firestore Database → Rules, replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User documents
    match /users/{userId} {
      // Users can only read/write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **"Publish"** to apply the rules.

### 5. Enable Google Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click **Google** provider
3. Toggle **"Enable"**
4. Select a support email
5. Click **"Save"**

### 6. Test the Setup

Restart your dev server to pick up the environment variables:

```bash
npm run dev
```

The Firebase connection will be ready to use!

## 📁 File Structure

```
src/
  firebase/
    config.js          # Firebase initialization
    auth.js            # Authentication helpers
    firestore.js       # Firestore data operations
    index.js           # Exports all Firebase functions
```

## 🔥 Using Firebase in Your App

### Import Firebase functions:

```javascript
import {
	signInWithGoogle,
	signOut,
	getUserData,
	saveTrophy,
	saveGameState,
} from "./firebase";
```

### Example: Sign in and save data

```javascript
// Sign in
const user = await signInWithGoogle();

// Get user data
const userData = await getUserData(user.uid);

// Save a trophy
await saveTrophy(user.uid, '2024-01-01', { moves: 42 });

// Save game state
await saveGameState(user.uid, {
  currentPuzzleId: '2024-01-01',
  board: [...],
  moves: 10
});
```

## 🎯 Data Structure

### User Document (Firestore)

```javascript
{
  uid: "user-id",
  email: "user@example.com",
  displayName: "John Doe",
  preferences: {
    // User settings
  },
  stats: {
    totalGamesPlayed: 10,
    totalWins: 8,
    currentStreak: 3,
    maxStreak: 5,
    trophies: {
      "2024-01-01": {
        won: true,
        moves: 42,
        completedAt: Timestamp
      }
    }
  },
  gameState: {
    currentPuzzleId: "2024-01-01",
    board: [...],
    moves: 10
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🚀 Next Steps

1. ✅ Complete Firebase Console setup (above)
2. ✅ Set up environment variables
3. ✅ Configure Firestore security rules
4. ✅ Enable Google Authentication
5. 🔜 Integrate authentication UI in your app
6. 🔜 Hook up game state persistence
7. 🔜 Implement trophy/stats tracking

## ❓ Hosting: Vercel vs Firebase

You're already on **Vercel** which is great! Stick with it because:

- ✅ Vercel is excellent for React/Vite apps
- ✅ Great Git integration and preview deployments
- ✅ You can still use Firebase for backend (Firestore + Auth)
- ✅ No need to migrate hosting

**Recommendation**: Keep using Vercel for hosting, Firebase for data/auth.
