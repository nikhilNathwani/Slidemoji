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

    // Streaks - track both play and win streaks (Wordle-style)
    currentPlayStreak: 7,             // Consecutive days played (any attempt, win or lose)
    maxPlayStreak: 15,                // Best play streak ever
    currentWinStreak: 5,              // Consecutive days with at least one completion
    maxWinStreak: 12,                 // Best win streak ever
    lastPlayedDate: "2026-03-03",     // For streak calculation (daily puzzles only, not archive)

    // Completed puzzles - nested by puzzleId then difficulty
    // Allows tracking multiple difficulty completions per puzzle!
    completedPuzzles: {
      1: {
        3: {                          // Completed puzzle 1 on 3x3
          moves: 42,
          completedAt: Timestamp,
          startedAt: Timestamp,
          timeSpent: 125,             // Seconds (completedAt - startedAt)
          fromArchive: false,         // false = daily puzzle, true = archive play
        },
        4: {                          // Also completed puzzle 1 on 4x4!
          moves: 58,
          completedAt: Timestamp,
          startedAt: Timestamp,
          timeSpent: 180,
          fromArchive: false,
        },
      },
      2: {
        3: {                          // Only completed puzzle 2 on 3x3
          moves: 38,
          completedAt: Timestamp,
          startedAt: Timestamp,
          timeSpent: 92,
          fromArchive: false,
        },
        // No 4x4 completion for puzzle 2
      },
      3: {
        4: {                          // Went straight to 4x4 for puzzle 3
          moves: 72,
          completedAt: Timestamp,
          startedAt: Timestamp,
          timeSpent: 210,
          fromArchive: false,
        },
      },
      50: {
        3: {                          // Archive play - doesn't affect streaks
          moves: 35,
          completedAt: Timestamp,
          startedAt: Timestamp,
          timeSpent: 95,
          fromArchive: true,          // Played from archive
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
        fromArchive: false,           // Track if this is an archive play
      },
      4: {                            // Difficulty (4x4)
        moves: 8,
        board: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
        startedAt: Timestamp,
        fromArchive: false,
      },
    },
    2: {                              // Another puzzle
      3: {
        moves: 5,
        board: [0,1,2,3,4,5,6,7,8],
        startedAt: Timestamp,
        fromArchive: false,
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

### ✅ **Track both play streaks AND win streaks**

- **Play streak:** Consecutive days played (any attempt, even if not completed)
- **Win streak:** Consecutive days with at least one completion
- **Why both?**
    - Play streak = Wordle-style, encourages daily habit without pressure
    - Win streak = Extra motivation for completionists
- **No pressure:** Don't emphasize streaks heavily in UI
- **Daily only:** Archive plays don't count toward streaks (see below)

### ✅ **Archive plays: Track but don't affect streaks**

- **Support:** Users can play any past puzzle anytime
- **Completions:** Still saved in `completedPuzzles` (with `fromArchive: true`)
- **Stats:** Archive plays increment `totalAttempted` and `totalCompleted`
- **Streaks:** Only daily puzzles (`fromArchive: false`) update `lastPlayedDate` and streaks
- **Why:** Streaks represent daily engagement, not total games played
- **Example:** Playing puzzle #50 from archive on 2026-03-03 won't break your streak if you haven't played today's puzzle yet

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
const completed3x3 = Object.values(userData.stats.completedPuzzles).filter(
	(p) => p[3],
).length;

// Count 4x4 completions
const completed4x4 = Object.values(userData.stats.completedPuzzles).filter(
	(p) => p[4],
).length;
```

---

## Implementation Details

**When user starts a puzzle (or switches difficulty):**

```javascript
const puzzleId = newPuzzleId;
const difficulty = selectedDifficulty; // 3 or 4
const fromArchive = (puzzleId !== getTodaysPuzzleNumber()); // Is this an archive play?

// Ensure nested structure exists
if (!gameState) gameState = {};
if (!gameState[puzzleId]) gameState[puzzleId] = {};

// Save progress for this puzzle+difficulty combo
gameState[puzzleId][difficulty] = {
  moves: 0,
  board: initialBoard,
  startedAt: Timestamp.now(),
  fromArchive: fromArchive,
};

// Update play streak (only for daily puzzles, not archive)
if (!fromArchive) {
	const today = getTodaysDate(); // e.g., "2026-03-03"
	const yesterday = getYesterdaysDate(); // e.g., "2026-03-02"

	if (stats.lastPlayedDate === yesterday) {
		// Continuing streak
		stats.currentPlayStreak++;
		stats.maxPlayStreak = Math.max(
			stats.maxPlayStreak,
			stats.currentPlayStreak,
		);
	} else if (stats.lastPlayedDate !== today) {
		// First play today, but broke streak
		stats.currentPlayStreak = 1;
	}
	// If lastPlayedDate === today, already played today, don't update

	stats.lastPlayedDate = today;
}

// Save to Firestore
await updateDoc(userDoc, { gameState, stats });
```

**When user wins:**

```javascript
const puzzleId = currentPuzzleId;
const difficulty = currentDifficulty;
const fromArchive = gameState[puzzleId][difficulty].fromArchive; // Get from saved game state

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
	timeSpent: Math.floor(
		(Timestamp.now().toMillis() - game.startedAt.toMillis()) / 1000,
	),
	isDaily: isDaily, // Track whether this was a daily or archive play
};

// Update totals
stats.totalCompleted++;

// Update win streak (only for daily puzzles, not archive)
if (!fromArchive) {
	const today = getTodaysDate();
	const yesterday = getYesterdaysDate();

	// lastPlayedDate was already updated when they started (for play streak)
	// Now check if this is their first WIN today
	const hasWonToday = Object.entries(stats.completedPuzzles).some(
		([pId, difficulties]) =>
			Object.values(difficulties).some(
				(comp) =>
					comp.isDaily &&
					comp.completedAt.toDate().toDateString() ===
						new Date().toDateString(),
			),
	);

	if (!hasWonToday) {
		// First win today
		if (stats.lastPlayedDate === yesterday) {
			// Continuing win streak
			stats.currentWinStreak++;
			stats.maxWinStreak = Math.max(
				stats.maxWinStreak,
				stats.currentWinStreak,
			);
		} else {
			// Won today but broke win streak
			stats.currentWinStreak = 1;
		}
	}
}

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
	Object.keys(gameState).forEach((puzzleId) => {
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

## Helper Functions

**Date utilities for streak calculation:**

```javascript
// Get today's date as YYYY-MM-DD string
function getTodaysDate() {
	const now = new Date();
	return now.toISOString().split("T")[0];
}

// Get yesterday's date as YYYY-MM-DD string
function getYesterdaysDate() {
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	return yesterday.toISOString().split("T")[0];
}

// Calculate today's puzzle number based on start date
function getTodaysPuzzleNumber() {
	const startDate = new Date("2026-01-01"); // First puzzle date
	const today = new Date();
	const daysSinceStart = Math.floor(
		(today - startDate) / (1000 * 60 * 60 * 24),
	);
	return (daysSinceStart % 365) + 1; // Cycle after 365 puzzles
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
	"stats.newField": value,
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
const usersRef = collection(db, "users");
const snapshot = await getDocs(usersRef);

snapshot.forEach(async (doc) => {
	const data = doc.data();
	await updateDoc(doc.ref, {
		"stats.newName": data.stats.oldName,
		"stats.oldName": deleteField(),
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
				},
			},
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

## Next Steps: Integrating with the Game

### **1. Update firestore.js functions**

**Current state:** Basic CRUD functions exist but use old schema

**Changes needed:**

```javascript
// src/firebase/firestore.js

// Update saveGameState to use nested structure
export async function saveGameState(userId, puzzleId, difficulty, gameData) {
	const userRef = doc(db, "users", userId);
	await updateDoc(userRef, {
		[`gameState.${puzzleId}.${difficulty}`]: {
			moves: gameData.moves,
			board: gameData.board,
			startedAt: gameData.startedAt,
		},
	});
}

// Update saveTrophy/saveCompletion to include streak logic
export async function saveCompletion(
	userId,
	puzzleId,
	difficulty,
	completionData,
) {
	// Implementation from "When user wins" section above
	// Includes: isDaily flag, streak calculation, nested structure
}

// New function: Update play streak when starting puzzle
export async function startPuzzle(userId, puzzleId, difficulty) {
	// Implementation from "When user starts" section above
	// Includes: play streak update, totalAttempted increment
}

// Load user data on app startup
export async function getUserData(userId) {
	const userRef = doc(db, "users", userId);
	const userSnap = await getDoc(userRef);
	return userSnap.exists() ? userSnap.data() : null;
}
```

### **2. Integrate into Game.jsx**

**Current state:** Game manages local state only

**Changes needed:**

```javascript
// src/components/Game.jsx

import { saveGameState, saveCompletion, startPuzzle } from '../firebase/firestore';
import { useAuth } from '../hooks/useAuth';

function Game() {
  const { user } = useAuth();
  const [puzzleId, setPuzzleId] = useState(getTodaysPuzzleNumber());
  const [difficulty, setDifficulty] = useState(3);
  const [board, setBoard] = useState([]);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState(null);

  // On mount or puzzle change: Load saved state or start fresh
  useEffect(() => {
    if (user && user.gameState?.[puzzleId]?.[difficulty]) {
      // Resume saved game
      const saved = user.gameState[puzzleId][difficulty];
      setBoard(saved.board);
      setMoves(saved.moves);
      setStartedAt(saved.startedAt);
    } else {
      // Start fresh
      const initialBoard = getInitialBoard(difficulty);
      setBoard(initialBoard);
      setMoves(0);
      setStartedAt(Timestamp.now());

      // Save to Firestore (updates play streak if daily)
      if (user) {
        startPuzzle(user.uid, puzzleId, difficulty);
      }
    }
  }, [user, puzzleId, difficulty]);

  // On every move: Save to Firestore
  const handleMove = (newBoard) => {
    setBoard(newBoard);
    setMoves(moves + 1);

    if (user) {
      saveGameState(user.uid, puzzleId, difficulty, {
        board: newBoard,
        moves: moves + 1,
        startedAt,
      });
    }
  };

  // On win: Save completion
  const handleWin = () => {
    if (user) {
      saveCompletion(user.uid, puzzleId, difficulty, {
        moves,
        startedAt,
      });
    }
  };

  // Allow switching between archive and daily puzzles
  const loadPuzzle = (newPuzzleId) => {
    setPuzzleId(newPuzzleId);
    // useEffect will handle loading saved state or starting fresh
  };

  return (
    // ... game UI
  );
}
```

### **3. Add archive puzzle picker (future)**

```javascript
// src/components/ArchivePicker.jsx

function ArchivePicker({ onSelectPuzzle }) {
	const puzzles = [1, 2, 3, 4, 5]; // List of available puzzles

	return (
		<div className="archive">
			{puzzles.map((id) => (
				<button key={id} onClick={() => onSelectPuzzle(id)}>
					Puzzle #{id}
				</button>
			))}
		</div>
	);
}
```

### **4. Update App.jsx to load user data on mount**

```javascript
// src/App.jsx

import { getUserData } from "./firebase/firestore";
import { useAuth } from "./hooks/useAuth";

function App() {
	const { user } = useAuth();
	const [userData, setUserData] = useState(null);

	useEffect(() => {
		if (user) {
			getUserData(user.uid).then((data) => {
				setUserData(data);
			});
		}
	}, [user]);

	return (
		<div className={userData?.preferences?.darkMode ? "dark" : "light"}>
			<Game userData={userData} />
		</div>
	);
}
```

### **5. Update StatsContent.jsx to show streaks**

```javascript
// src/components/dialogs/StatsContent.jsx

function StatsContent({ userData }) {
	return (
		<div className="stats">
			<div>
				Play Streak: {userData?.stats?.currentPlayStreak || 0} days
			</div>
			<div>Win Streak: {userData?.stats?.currentWinStreak || 0} days</div>
			<div>Total Completed: {userData?.stats?.totalCompleted || 0}</div>
			{/* Trophy case showing completedPuzzles */}
		</div>
	);
}
```

### **Summary of code changes:**

1. ✅ **firestore.js**: Rewrite functions to use nested gameState, add streak logic
2. ✅ **Game.jsx**: Integrate save/load, call Firestore on moves/wins
3. ✅ **App.jsx**: Load userData on mount, pass to children
4. ✅ **StatsContent.jsx**: Display play/win streaks and trophies
5. 🔜 **ArchivePicker.jsx**: (Later) Let users select old puzzles

---

Does this schema work for you? Any other changes?
