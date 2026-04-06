# Auth State Machine

`AuthProvider` manages auth as an explicit state machine. All auth state lives in one
`useReducer` call with a single `status` field driving the two derived values exposed
to the rest of the app:

```
loading   = status !== 'ready'
isMerging = status === 'merging'
```

---

## States

| status          | What's happening                                             |
|-----------------|--------------------------------------------------------------|
| `initializing`  | App just mounted; waiting for Firebase to report a user      |
| `ready`         | Normal idle state — user is available and fully loaded       |
| `signing-in`    | Google sign-in popup is open; waiting for the user to pick an account |
| `merging`       | Google account selected; anonymous game data being merged in |
| `signing-out`   | Sign-out call in flight; user cleared eagerly                |

---

## Full State Diagram

```
                        ┌──────────────────────────────────────────────────────┐
                        │                                                      │
                        ▼                        AUTH_READY                    │
              ┌─────────────────┐  Firebase reports ┌────────┐                │
   App load   │  initializing   │─────── user ──────▶  ready  │                │
  ──────────▶ │                 │                   │        │                │
              └─────────────────┘     ┌─────────────│        │◀───────────────┤
                                      │             └────────┘                │
                                      │                │   ▲                  │
                              signIn()│         signOut()  │SIGN_OUT_COMPLETE  │
                                      │                │   │                  │
                                      ▼                ▼   │                  │
                                ┌──────────┐     ┌──────────────┐             │
                                │signing-in│     │ signing-out  │             │
                                └──────────┘     └──────────────┘             │
                                   │    │               │                     │
                            MERGE  │    │SIGN_IN         │SIGN_OUT_FAILED      │
                            _START │    │_ABORTED        └─────────────────────┘
                                   │    │
                                   │    └──────────────▶ ready
                                   │       (popup closed,
                                   │        error, or
                                   │        no game data)
                                   ▼
                              ┌─────────┐
                              │ merging │  (anonymous game data being
                              └─────────┘   written to Google account)
                                   │
                             SIGN_IN_SUCCESS
                                   │
                                   ▼
                                 ready
```

---

## All Possible "Stories"

### Story 1 — App loads for the first time
```
initializing
  → [Firebase reports no user]
  → signInAnonymouslyIfNeeded() runs
  → [Firebase reports new anonymous user]
  → AUTH_READY
  → ready
```

### Story 2 — App loads, user was already signed in (returning visitor)
```
initializing
  → [Firebase reports existing user (anonymous or Google)]
  → AUTH_READY
  → ready
```

### Story 3 — Anonymous user signs in, no prior game data
```
ready  (anonymous user)
  → signIn() called
  → SIGN_IN_START  →  signing-in
  → [no anonymous gameState to preserve]
  → [firebaseSignIn() succeeds]
  → SIGN_IN_SUCCESS  →  ready  (Google user)
```

### Story 4 — Anonymous user signs in WITH game data (merge)
```
ready  (anonymous user, has played some moves)
  → signIn() called
  → SIGN_IN_START  →  signing-in
  → [anonymous gameState snapshot captured]
  → MERGE_START  →  merging  (UI freezes current board, stays visible)
  → [firebaseSignIn() succeeds]
  → [mergeAnonymousDataToGoogle() writes to Google account]
  → SIGN_IN_SUCCESS  →  ready  (Google user, merged data)
  → [useGameState clears mergeSnapshot once Firestore confirms]
```

### Story 5 — Returning Google user signs in (account already existed)
Same as Story 3 or 4, but `firebaseSignIn()` internally hits
`auth/credential-already-in-use`, uses the embedded credential to sign in, and
AuthProvider detects the UID change and runs the merge.

### Story 6 — User closes the popup without signing in
```
ready
  → signIn() called
  → SIGN_IN_START  →  signing-in
  → [possibly MERGE_START if anonymous had game data]
  → [popup.closed detected within ~200ms]
  → SIGN_IN_ABORTED  →  ready  (prior user restored, board unchanged)
```

### Story 7 — Sign-in fails (network error, popup blocked, etc.)
```
ready
  → signIn() called
  → SIGN_IN_START  →  signing-in
  → [firebaseSignIn() throws]
  → SIGN_IN_ABORTED  →  ready  (prior user restored)
  → [error re-thrown → GoogleSignInButton shows error message]
```

### Story 8 — User signs out
```
ready  (Google user)
  → signOut() called
  → SIGN_OUT_START  →  signing-out  (user cleared eagerly)
  → [firebaseSignOut() completes]
  → SIGN_OUT_COMPLETE  →  ready  (user: null)
  → [onAuthChange fires with null]
  → signInAnonymouslyIfNeeded()
  → [onAuthChange fires with new anonymous user]
  → AUTH_READY  →  ready  (new anonymous user)
```

### Story 9 — Sign-out fails
```
ready
  → signOut() called
  → SIGN_OUT_START  →  signing-out
  → [firebaseSignOut() throws]
  → SIGN_OUT_FAILED  →  ready
  → [onAuthChange listener eventually restores correct user via AUTH_READY]
```

---

## Actions Reference

| Action                | Dispatched by        | Effect                                                     |
|-----------------------|---------------------|------------------------------------------------------------|
| `AUTH_READY`          | `onAuthChange`       | Sets `user`, transitions to `ready`                        |
| `AUTH_USER_CHANGED`   | `onAuthChange`       | Updates `user` only; status unchanged (op is in flight)    |
| `SIGN_IN_START`       | `signIn()`           | → `signing-in`, clears merge snapshot                      |
| `MERGE_START`         | `signIn()`           | → `merging`, stores anonymous gameState snapshot           |
| `SIGN_IN_SUCCESS`     | `signIn()`           | → `ready`, sets Google user                                |
| `SIGN_IN_ABORTED`     | `signIn()` catch     | → `ready`, restores prior user, clears merge snapshot      |
| `SIGN_OUT_START`      | `signOut()`          | → `signing-out`, clears user eagerly                       |
| `SIGN_OUT_COMPLETE`   | `signOut()` finally  | → `ready`                                                  |
| `SIGN_OUT_FAILED`     | `signOut()` catch    | → `ready`, rolls back `preferInitialAnonymousState`        |
| `CLEAR_MERGE_SNAPSHOT`| `clearMergeSnapshot()` | Clears `mergeSnapshotGameState` (called by `useGameState` once Firestore confirms merged data) |

---

## Why `authOpInFlightRef`?

Firebase's `onAuthStateChanged` listener fires whenever the signed-in user changes —
including mid-flow events during sign-in (e.g., Firebase changes the active user from
anonymous to Google before our `signIn()` has finished). The ref lets `onAuthChange`
know whether an auth op is in progress:

- **In flight (`true`):** dispatch `AUTH_USER_CHANGED` — only update the `user` object,
  leave `status` alone. `signIn()`/`signOut()` own the status transitions.
- **Idle (`false`):** dispatch `AUTH_READY` — update `user` AND transition to `ready`.

Without this, a mid-flow `onAuthChange` event would prematurely set `status = 'ready'`
and `loading = false` while the merge was still running.
