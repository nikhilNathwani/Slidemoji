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
    totalCompleted: 38,               // Total puzzles solved
    currentStreak: 5,                 // Consecutive days
    maxStreak: 12,                    // Best ever
    lastPlayedDate: "2026-03-03",     // For streak calculation
    
    // Only track COMPLETED puzzles (for trophy case)
    // Key is puzzleId (NUMBER: 1, 2, 3...)
    completedPuzzles: {
      1: {
        moves: 42,                    // Move count (for reference only)
        difficulty: 3,                // Grid size they used
        completedAt: Timestamp,       // When solved
        timeSpent: 125,               // Seconds (tracked but not competitive)
      },
      3: {
        moves: 38,
        difficulty: 4,
        completedAt: Timestamp,
        timeSpent: 92,
      },
      // Note: Puzzle #2 not here = user never completed it
  // Current game in progress (for resume)
  gameState: {
    puzzleId: 1,                      // Puzzle number
    difficulty: 3,                    // Grid size
    moves: 15,                        // Current moves
    board: [0,1,2,3,4,5,6,7,8],      // Current state
    startedAt: Timestamp,             // Session start
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
- **Incomplete attempts:** Not saved (only current `gameState`)
- **Trophy Case:** Just iterate `completedPuzzles` (no filtering!)

### ✅ **Keep stats even if not displayed**

- **Why:** Cheap to store, useful later
- **Cost:** Negligible - part of user doc
- **Philosophy:** Track it, but don't pressure users with it

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
    1: { moves: 42 },  // Map/object
    2: { moves: 38 },
  }
}
```

- ✅ All data in one read
- ✅ Simpler queries - just iterate!
- ✅ No filtering needed
- ❌ Limited to ~10k entries (fine for 27+ years of puzzles!)

**Subcollection (alternative - NOT using):**

```javascript
users/{uid}/completedPuzzles/{puzzleId}
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

// Check if user completed today's puzzle
const hasWonToday = todayPuzzleNum in userData.stats.completedPuzzles;

// Get all completed puzzles (for trophy case) - NO FILTERING!
const trophies = Object.entries(userData.stats.completedPuzzles)
  .map(([id, data]) => ({ puzzleId: id, ...data }));

// Trophy count
const trophyCount = Object.keys(userData.stats.completedPuzzles).length;
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

Does this schema work for you? Any other changes?
