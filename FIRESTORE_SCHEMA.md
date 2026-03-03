# Firestore Database Schema for Slidemoji

## Collection: `users/{userId}`

Each authenticated user gets ONE document with this structure:

```javascript
{
  // Identity (from Google Auth)
  uid: "abc123...",                    // Firebase User ID
  email: "user@example.com",           // User's email
  displayName: "John Doe",             // User's name
  createdAt: Timestamp,                // When account was created
  updatedAt: Timestamp,                // Last modification

  // User Preferences
  preferences: {
    darkMode: true,                    // Theme preference
    showNumbers: false,                // Show numbers in tiles
    // Future: sound effects, animations, etc.
  },

  // Statistics & Progress
  stats: {
    totalGamesPlayed: 42,              // Total puzzles attempted
    totalWins: 38,                     // Total puzzles completed
    currentStreak: 5,                  // Current daily streak
    maxStreak: 12,                     // Best streak ever
    lastPlayedDate: "2026-03-03",      // For streak tracking

    // Trophy collection - key is puzzleId (date: "2026-03-03")
    trophies: {
      "2026-03-03": {
        won: true,                     // Completed this puzzle
        moves: 42,                     // Number of moves to solve
        difficulty: 3,                 // Grid size (3x3, 4x4, etc.)
        completedAt: Timestamp,        // When they won
        timeSpent: 125,                // Seconds to complete (optional)
      },
      "2026-03-02": {
        won: true,
        moves: 38,
        difficulty: 4,
        completedAt: Timestamp,
      },
      // ... more trophies
    }
  },

  // Current Game State (for resume functionality)
  gameState: {
    puzzleId: "2026-03-03",            // Which puzzle (date)
    difficulty: 3,                     // Grid size
    moves: 15,                         // Current move count
    board: [                           // Current board state
      0, 1, 2,
      3, 4, 5,
      6, 7, 8
    ],
    startedAt: Timestamp,              // When they started
    lastMoveAt: Timestamp,             // Last activity (for abandonment detection)
  } || null                            // null if no game in progress
}
```

## Design Decisions & Optimizations

### ✅ **Single Document per User**

- **Why:** Simpler queries, atomic updates, better for small-to-medium data
- **Alternative:** Separate collections for stats/trophies
- **Trade-off:** Single doc is easier but has 1MB size limit (we're nowhere near that)

### ✅ **Trophies as Map (not subcollection)**

- **Why:** All trophies in one read, no extra queries
- **Alternative:** `users/{uid}/trophies/{puzzleId}` subcollection
- **Trade-off:** Subcollection = unlimited trophies, but slower reads. Map = faster but limited to ~10k trophies (plenty for daily puzzles over 27+ years!)

### ✅ **Game State in User Doc**

- **Why:** Only one active game at a time, save/load together
- **Alternative:** Separate `gameStates/{uid}` collection
- **Trade-off:** Keep it simple - one doc to rule them all

### ✅ **PuzzleId = Date String**

- **Why:** Human-readable, easy to query, sorts chronologically
- **Format:** `"2026-03-03"` (YYYY-MM-DD)
- **Alternative:** Auto-generated IDs - but dates are more meaningful

### 📊 **Read/Write Patterns**

**On App Load (signed in):**

1. Read user doc → 1 read
2. Get all trophies, stats, and last game state → Already included!

**During Gameplay:**

- Save game state every 5 moves (debounced) → ~5-10 writes per session
- Or save on every move → Could be 50-100 writes (more expensive)

**On Win:**

- Update trophy + stats → 1 write

**Firestore Pricing Impact:**

- Free tier: 50k reads/day, 20k writes/day
- Your cost: ~100 users × 10 writes/day = 1k writes (well under limit!)

## Questions for You:

1. **Game State Auto-save Frequency:**
    - Option A: Save every move (immediate sync, but more writes)
    - Option B: Save every 5 moves or 30 seconds (balanced)
    - Option C: Only save when navigating away (less writes, but could lose progress)

    **My recommendation:** Option B (debounced auto-save)

2. **Time Tracking:**
    - Should we track how long it takes to solve each puzzle?
    - Could show "You solved this in 2 minutes!"
    - Trade-off: Adds `timeSpent` to each trophy

3. **Stats to Track:**
    - Current schema has: total games, wins, streaks
    - Should we add: average moves, best time, completion rate by difficulty?

4. **Trophy History:**
    - Do you want to limit how far back users can see trophies?
    - Or unlimited history (stored in the map)?
    - Maps can hold ~10,000 trophies = 27 years of daily puzzles

## Sample Firestore Queries

```javascript
// Get user's data (one-shot)
const userData = await getUserData(userId);

// Get all trophies
const trophies = userData.stats.trophies;

// Get specific trophy
const todayTrophy = trophies["2026-03-03"];

// Check if won today
const hasWonToday = trophies["2026-03-03"]?.won ?? false;

// Get trophy count
const trophyCount = Object.keys(trophies).filter(
	(id) => trophies[id].won,
).length;
```

Let me know your thoughts on this schema! Any changes you'd like?
