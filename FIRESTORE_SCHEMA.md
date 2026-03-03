# Firestore Database Schema for Slidemoji

## Firestore Basics (for SQL folks)

**SQL → Firestore mapping:**

```
Database → Firebase Project
Table    → Collection
Row      → Document
Column   → Field
```

**Example:**

```
SQL:                          NoSQL (Firestore):
users (table)                 users (collection)
├─ id=1, name=John           ├─ "user123" (document)
├─ id=2, name=Jane           │  ├─ name: "John"
└─ id=3, name=Bob            │  └─ email: "john@..."
                             ├─ "user456" (document)
                             └─ "user789" (document)

puzzles (table)               puzzles (collection)
├─ id=1, emoji=🎉           ├─ "1" (document)
├─ id=2, emoji=🎂           │  ├─ emoji: "🎉"
└─ id=3, emoji=🎈           │  └─ emojiName: "..."
                             └─ "2" (document)
```

**Key differences:**

- ✅ Documents can have nested objects (no JOINs!)
- ✅ No rigid schema (flexible fields)
- ✅ Document ID = row identifier

---

## Collection: `users/{userId}`

Each authenticated user gets ONE document:

```javascript
{
  // Identity (from Google Auth)
  uid: "abc123...",
  email: "user@example.com",
  displayName: "John Doe",
  createdAt: Timestamp,
  updatedAt: Timestamp,

  // User Preferences
  preferences: {
    darkMode: true,
    // showNumbers is NOT persisted - always starts ON
  },

  // Statistics & Progress
  stats: {
    // High-level stats (kept for potential future use, even if not displayed)
    totalAttempted: 50,               // Any puzzle started (even incomplete)
    totalCompleted: 38,               // Total completions across all difficulties
    currentStreak: 5,                 // Consecutive days with at least one completion
    maxStreak: 12,                    // Best ever
    lastPlayedDate: "2026-03-03",     // For streak calculation

    // Completed puzzles - nested by puzzleId then difficulty
    // Allows tracking multiple difficulty completions per puzzle!
    completedPuzzles: {
      1: {
        3: {                          // Completed puzzle 1 on 3x3
          moves: 42,
          completedAt: Timestamp,
          startedAt: Timestamp,
          timeSpent: 125,             // Seconds (completedAt - startedAt)
        },
        4: {                          // Also completed puzzle 1 on 4x4!
          moves: 58,
          completedAt: Timestamp,
          startedAt: Timestamp,
          timeSpent: 180,
        },
      },
      2: {
        3: {                          // Only completed puzzle 2 on 3x3
          moves: 38,
          completedAt: Timestamp,
          startedAt: Timestamp,
          timeSpent: 92,
        },
        // No 4x4 completion for puzzle 2
      },
      3: {
        4: {                          // Went straight to 4x4 for puzzle 3
          moves: 72,
          completedAt: Timestamp,
          startedAt: Timestamp,
          timeSpent: 210,
        },
      },
    }
  },

  // Current games in progress (for resume) - supports multiple puzzles at multiple difficulties
  gameState: {
    1: {                              // Puzzle ID
      3: {                            // Difficulty (3x3)
        moves: 15,
        board: [0,1,2,3,4,5,6,7,8],
        startedAt: Timestamp,
      },
      4: {                            // Difficulty (4x4)
        moves: 8,
        board: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
        startedAt: Timestamp,
      },
    },
    2: {                              // Another puzzle
      3: {
        moves: 5,
        board: [0,1,2,3,4,5,6,7,8],
        startedAt: Timestamp,
      },
    },
  } || null
}
```

## Collection: `puzzles/{puzzleId}`

Shared puzzle definitions (not user-specific):

```javascript
{
  id: 1,                              // Puzzle number
  date: "2026-03-03",                 // Release date (for dailies)
  emoji: "🎉",
  emojiName: "Party Popper",
  initialBoard3x3: [0,1,2,3,4,5,6,7,8],  // Starting config for 3x3
  initialBoard4x4: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],  // Starting config for 4x4
}
```

**Why separate?**

- ✅ Same starting board for ALL users (fair comparison)
- ✅ No duplication across user docs
- ✅ Easy to preload future puzzles
- ✅ Can change emoji without touching user data

---

## Design Decisions - Your Questions Answered

### ✅ **Puzzle IDs: Numbers not Dates**

- **Why:** Can cycle back to #1 easily
- **Example:** After 365 puzzles, go back to puzzle #1
- **Lookup:** `puzzles/{1}` returns emoji, board, etc.

### ✅ **Only Store Completed Puzzles**

- **Why:** Simpler, faster, smaller docs
- **Incomplete attempts:** Not saved permanently
- **Current game:** Tracked in `gameState` field
- **After abandoning:** Old `gameState` is cleared/overwritten when starting new puzzle

### ✅ **Track totalAttempted**

- **Why:** Calculate win rate if needed later
- **When to increment:** When user starts a new puzzle+difficulty combo for first time
- **Useful for:** Win percentage = totalCompleted / totalAttempted

### ✅ **Multiple Difficulty Trophies per Puzzle**

- **Why:** User can beat puzzle #1 on both 3x3 AND 4x4
- **Storage:** Nested structure `completedPuzzles[puzzleId][difficulty]`
- **UI display:** Show highest difficulty trophy (4x4 > 3x3)
- **Both tracked:** Backend keeps both completions for reference
- **Example:** Won puzzle #1 on 3x3, switch to 4x4, win again → both stored!

### ✅ **Keep both startedAt and timeSpent**

- **startedAt:** When they first attempted this puzzle+difficulty
- **completedAt:** When they finished
- **timeSpent:** Seconds elapsed (includes breaks/pauses)
- **Calculation:** `timeSpent = (completedAt - startedAt) / 1000`

### ✅ **Keep stats even if not displayed**

- **Why:** Cheap to store, useful later
- **Cost:** Negligible - part of user doc
- **Philosophy:** Track it, but don't pressure users with it

### ✅ **Use numeric keys (not strings)**

- **Puzzle IDs:** `1, 2, 3` not `"puzzle-1"`
- **Difficulty:** `3, 4` not `"normal", "hard"`
- **Why:** Cleaner, shorter, easier to work with in code
- **Grid size semantic:** `3` and `4` represent grid dimensions (3x3, 4x4)

### ✅ **Calculate difficulty breakdowns on-the-fly**

- **Don't store:** `completed3x3Count`, `attempted4x4Count`, etc.
- **Why:** Easy to compute from `completedPuzzles` and `gameState`
- **Example:** `Object.values(completedPuzzles).filter(p => p[3]).length`
- **Benefit:** Simpler schema, always accurate

### ✅ **Win-based streaks only**

- **Track:** Days with at least one completion
- **Don't track:** "Play streak" (started but didn't finish)
- **Why:** More meaningful for a daily puzzle game

### ✅ **Track moves & time, but don't be competitive**

- **Why:** Interesting for personal reflection ("I'm getting faster!")
- **Don't show:** Leaderboards, global averages, "beat this time"
- **Optional:** Show in trophy details if user wants to see

### ✅ **Same board for everyone = Critical!**

- **Why:** Fair comparison of moves/time
- **Implementation:** `puzzles/{id}` collection stores initial boards
- **On new game:** Fetch `puzzles/{todaysPuzzleId}` to get starting state

### ✅ **showNumbers always starts ON**

- **Why:** Better UX - let users disable if they want challenge
- **Implementation:** Don't persist, always default true

---

## NoSQL Terms Explained

### **Map vs Subcollection**

**Map (what we're using):**

```javascript
stats: {
  completedPuzzles: {
    1: {                              // Puzzle ID
      3: { moves: 42 },               // Difficulty 3x3
      4: { moves: 58 },               // Difficulty 4x4
    },
    2: {
      3: { moves: 38 },
    },
  }
}
```

- ✅ All data in one read (entire user doc)
- ✅ Can store multiple difficulties per puzzle
- ✅ Simple nested structure
- ✅ No filtering needed
- ❌ Limited to ~10k entries (fine for 27+ years of puzzles!)

**Subcollection (alternative - NOT using):**

```javascript
users / { uid } / completedPuzzles / { puzzleId };
```

- ✅ Unlimited entries
- ❌ Requires separate reads (slower)
- ❌ More complex queries

**For Slidemoji:** Map is perfect!

---

## Save Frequency: Every Move is Fine!

**Firestore limits (free tier):**

- 50k reads/day
- 20k writes/day

**Your usage (TOTAL across ALL users):**

- 100 active users/day
- 50 moves per game per user
- Save every move = 50 writes/user
- **Total: 100 × 50 = 5,000 writes/day**

**Capacity: 5k / 20k = 25% of free tier**

**You can support ~400 daily active users before hitting limits!** 🎉

**Recommendation:** Save on every move

- ✅ Never lose progress
- ✅ Syncs across devices instantly
- ✅ Well within free tier
- ✅ Firestore is designed for this!

---

## When to Load Data?

**On app load (when signed in):**

Load the entire user document = **1 read** includes:

- Preferences (dark mode) → needed immediately
- completedPuzzles → trophy case data
- gameState → resume current game
- stats → streak, counts

**Why load everything at once:**

- ✅ It's ONE document = ONE read
- ✅ Not slower to include trophy data
- ✅ Ready for trophy case whenever user opens it
- ✅ No extra loading when clicking stats

**Trophy case is "free"** - it comes with the user data!

---

## Sample Queries

```javascript
// Get today's puzzle
const todayPuzzleNum = getTodaysPuzzleNumber(); // e.g., 1
const puzzle = await getDoc(doc(db, "puzzles", todayPuzzleNum.toString()));

// Check if user completed today's puzzle (any difficulty)
const hasWonToday = todayPuzzleNum in userData.stats.completedPuzzles;

// Check if user completed on specific difficulty
const hasWonToday3x3 =
	userData.stats.completedPuzzles[todayPuzzleNum]?.[3] !== undefined;
const hasWonToday4x4 =
	userData.stats.completedPuzzles[todayPuzzleNum]?.[4] !== undefined;

// Get best trophy for today (4x4 > 3x3)
const todayTrophies = userData.stats.completedPuzzles[todayPuzzleNum];
const bestDifficulty = todayTrophies?.[4] ? 4 : todayTrophies?.[3] ? 3 : null;

// Get all completed puzzles for trophy case
const allCompletions = Object.entries(userData.stats.completedPuzzles).flatMap(
	([puzzleId, difficulties]) =>
		Object.entries(difficulties).map(([diff, data]) => ({
			puzzleId: parseInt(puzzleId),
			difficulty: parseInt(diff),
			...data,
		})),
);

// Trophy count (show highest difficulty per puzzle)
const uniquePuzzlesCompleted = Object.keys(
	userData.stats.completedPuzzles,
).length;

// Win rate
const winRate = userData.stats.totalCompleted / userData.stats.totalAttempted;

// Get current game for a specific puzzle+difficulty
const currentGame = userData.gameState?.[puzzleId]?.[difficulty];

// Check if user has an in-progress game for today's puzzle
const hasGameInProgress = todayPuzzleNum in (userData.gameState || {});

// Count 3x3 completions
const completed3x3 = Object.values(userData.stats.completedPuzzles).filter(p => p[3]).length;

// Count 4x4 completions  
const completed4x4 = Object.values(userData.stats.completedPuzzles).filter(p => p[4]).length;
```

---

## Implementation Details

**When user starts a puzzle (or switches difficulty):**

```javascript
const puzzleId = newPuzzleId;
const difficulty = selectedDifficulty; // 3 or 4

// Ensure nested structure exists
if (!gameState) gameState = {};
if (!gameState[puzzleId]) gameState[puzzleId] = {};

// Save progress for this puzzle+difficulty combo
gameState[puzzleId][difficulty] = {
  moves: 0,
  board: initialBoard,
  startedAt: Timestamp.now(),
};

// Increment attempts counter (only if first time trying this puzzle+difficulty)
if (!stats.completedPuzzles[puzzleId]?.[difficulty]) {
  stats.totalAttempted++;
}

// Save to Firestore
await updateDoc(userDoc, { gameState, stats });
```

**When user wins:**

```javascript
const puzzleId = currentPuzzleId;
const difficulty = currentDifficulty;

// Get the game state for this puzzle+difficulty
const game = gameState[puzzleId][difficulty];

// Ensure nested structure exists
if (!stats.completedPuzzles[puzzleId]) {
  stats.completedPuzzles[puzzleId] = {};
}

// Save completion for this difficulty
stats.completedPuzzles[puzzleId][difficulty] = {
  moves: game.moves,
  completedAt: Timestamp.now(),
  startedAt: game.startedAt,
  timeSpent: Math.floor((Timestamp.now().toMillis() - game.startedAt.toMillis()) / 1000),
};

// Update totals
stats.totalCompleted++;
stats.lastPlayedDate = getTodaysDate(); // e.g., "2026-03-03"

// Clear THIS game state (but keep other in-progress games)
delete gameState[puzzleId][difficulty];
if (Object.keys(gameState[puzzleId]).length === 0) {
  delete gameState[puzzleId]; // Clean up empty puzzle object
}

// Save to Firestore
await updateDoc(userDoc, { gameState: gameState || null, stats });
```

**When user abandons a game:**

```javascript
// User navigates away, closes tab, etc.
// Their in-progress games remain in gameState
// They can resume later!

// Optional: Clean up old abandoned games (e.g., from puzzles >7 days ago)
const cutoffPuzzleId = getTodaysPuzzleNumber() - 7;
if (gameState) {
  Object.keys(gameState).forEach(puzzleId => {
    if (parseInt(puzzleId) < cutoffPuzzleId) {
      delete gameState[puzzleId];
    }
  });
  await updateDoc(userDoc, { gameState: gameState || null });
}
```

**On app load - resume game:**

```javascript
// Get user's gameState for current puzzle+difficulty
const todayPuzzleId = getTodaysPuzzleNumber();
const currentDifficulty = 3; // or from user selection

const savedGame = userData.gameState?.[todayPuzzleId]?.[currentDifficulty];

if (savedGame) {
  // Resume from saved state
  board = savedGame.board;
  moves = savedGame.moves;
  startedAt = savedGame.startedAt;
} else {
  // Start fresh
  board = initialBoard;
  moves = 0;
  startedAt = Timestamp.now();
}
```

---

## Build-Time Puzzle Generation

**Yes, you should predefine puzzles!**

```javascript
// In your codebase (not Firestore):
export const PUZZLES = [
	{
		id: 1,
		date: "2026-01-01",
		emoji: "🎉",
		emojiName: "Party Popper",
		initialBoard3x3: [1, 2, 0, 3, 4, 5, 6, 7, 8], // Predefined shuffle
	},
	{
		id: 2,
		date: "2026-01-02",
		emoji: "🎂",
		emojiName: "Birthday Cake",
		initialBoard3x3: [0, 1, 2, 4, 5, 3, 6, 7, 8],
	},
	// ...
];
```

**Upload to Firestore once:**

```javascript
// Admin script (run once)
PUZZLES.forEach(async (puzzle) => {
	await setDoc(doc(db, "puzzles", puzzle.id.toString()), puzzle);
});
```

**At runtime:**

- Fetch current puzzle from Firestore
- Everyone gets the same board = fair!

---

## Philosophy: Non-Competitive Tracking

**Your instinct is right!** Here's how to implement it:

**Track (silently):**

- ✅ Moves, time, completion
- ✅ Store in Firestore

**Don't show competitively:**

- ❌ No "Solve in under 2 minutes!"
- ❌ No "Beat 85% of players!"
- ❌ No move count pressure

**Do show (optionally):**

- ✅ "You completed puzzle #42!" (celebration)
- ✅ Personal stats in profile (if they want)
- ✅ Trophy collection (non-competitive)

**Implementation:**

- Track everything
- Hide it by default
- Let users opt-in to see their own stats
- Never compare users

Perfect balance! 🎯

---

## Schema Evolution: How Hard to Change Later?

**EASY - Adding new fields:**

```javascript
// Just start writing them for new users
await updateDoc(userDoc, { 
  "stats.newField": value 
});

// Old users won't have it - handle with defaults
const newField = userData.stats.newField || defaultValue;
```

- ✅ No migration needed
- ✅ Old & new users coexist
- ✅ Can deploy anytime

**MODERATE - Renaming fields:**

```javascript
// Need a one-time migration script
const usersRef = collection(db, 'users');
const snapshot = await getDocs(usersRef);

snapshot.forEach(async (doc) => {
  const data = doc.data();
  await updateDoc(doc.ref, {
    'stats.newName': data.stats.oldName,
    'stats.oldName': deleteField(),
  });
});
```

- ⚠️ Requires batch script
- ⚠️ Can be slow for many users
- ✅ But doable!

**MODERATE - Restructuring (like gameState change):**

```javascript
// Migration for nested gameState
snapshot.forEach(async (doc) => {
  const old = doc.data().gameState;
  if (old && old.puzzleId) {
    // Convert old flat structure to new nested
    const newGameState = {
      [old.puzzleId]: {
        [old.difficulty]: {
          moves: old.moves,
          board: old.board,
          startedAt: old.startedAt,
        }
      }
    };
    await updateDoc(doc.ref, { gameState: newGameState });
  }
});
```

- ⚠️ Requires careful conversion logic
- ⚠️ Test thoroughly before running
- ✅ Doable with planning

**Bottom line:**

- 🟢 **Get the core structure right now** (puzzle IDs, difficulty nesting)
- 🟢 **Don't stress about stats fields** - easy to add/tweak
- 🟢 **Firestore is flexible** - migrations are possible but not fun
- 🟢 **We're in good shape!** Current schema is solid

---

Does this schema work for you? Any other changes?

