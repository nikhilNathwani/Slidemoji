# Slidemoji Architecture Flow

This document shows how auth, React, hooks, and Firebase data modules interact.

## High-level Flow

```mermaid
flowchart TD
  UI[React UI Components] --> APP[App.jsx]
  APP --> AUTHCTX[AuthProvider + AuthContext]
  APP --> H_USER[useUser]
  APP --> H_PREF[usePreference]
  APP --> H_GAME[useGameState]
  APP --> H_PUZZLE[usePuzzle]

  AUTHCTX --> AUTHMOD[src/firebase/auth.js]
  AUTHCTX --> FS_USER[src/firebase/firestore/user.js]
  AUTHCTX --> FS_GAME[src/firebase/firestore/gameState.js]

  H_USER --> FS_USER
  H_PREF --> FS_PREF[src/firebase/firestore/preference.js]
  H_GAME --> FS_GAME
  H_PUZZLE --> FS_PUZZLE[src/firebase/firestore/puzzle.js]

  AUTHMOD --> FBCFG[src/firebase/firebaseConfig.js]
  FS_USER --> FBCFG
  FS_PREF --> FBCFG
  FS_GAME --> FBCFG
  FS_PUZZLE --> FBCFG

  FBCFG --> FBAUTH[(Firebase Auth)]
  FBCFG --> FS[(Cloud Firestore)]

  AUTHCTX -->|user/loading/isMerging + actions| UI
  H_USER -->|userData snapshot| APP
  H_PREF -->|preference value| APP
  H_GAME -->|gameState snapshot + save| APP
  H_PUZZLE -->|puzzle metadata| APP
```

## Sign-in Merge Sequence

```mermaid
sequenceDiagram
  participant UI as Sign-in Button
  participant AP as AuthProvider
  participant A as firebase/auth.js
  participant U as firestore/user.js
  participant G as firestore/gameState.js
  participant FS as Firestore

  UI->>AP: signIn()
  AP->>U: getFirestoreUserData(anonymousUid)
  AP->>A: signInWithGoogle()
  A-->>AP: firebaseUser (Google UID)
  AP->>U: syncFirestoreUserData(firebaseUser)
  AP->>G: mergeAnonymousDataToGoogle(anonymousUid, googleUid, anonymousData)
  G->>FS: runTransaction + set(merge)
  FS-->>G: commit
  G-->>AP: merge complete
  AP-->>UI: auth/user state updated
```

## Layer Responsibilities

- React app layer:
    - [src/App.jsx](../src/App.jsx) orchestrates page state and composes hooks.
    - Components render UI only.
- Auth/context layer:
    - [src/contexts/AuthProvider.jsx](../src/contexts/AuthProvider.jsx) owns auth lifecycle, sign-in/out, and merge orchestration.
- Hook layer:
    - [src/hooks/useUser.js](../src/hooks/useUser.js), [src/hooks/usePreference.js](../src/hooks/usePreference.js), [src/hooks/useGameState.js](../src/hooks/useGameState.js), [src/hooks/usePuzzle.js](../src/hooks/usePuzzle.js) adapt backend data APIs to React state.
- Firebase data layer:
    - [src/firebase/auth.js](../src/firebase/auth.js) handles identity operations.
    - [src/firebase/firestore/user.js](../src/firebase/firestore/user.js), [src/firebase/firestore/preference.js](../src/firebase/firestore/preference.js), [src/firebase/firestore/gameState.js](../src/firebase/firestore/gameState.js), [src/firebase/firestore/puzzle.js](../src/firebase/firestore/puzzle.js) handle Firestore reads/writes/subscriptions.
    - [src/firebase/index.js](../src/firebase/index.js) is the export surface.
