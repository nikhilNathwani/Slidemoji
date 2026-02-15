# Phase 5: Effects & Advanced Features

## What are Effects?

**Effects** are operations that happen **outside** of rendering:

- Fetching data from an API
- Setting up subscriptions or timers
- Manually updating the DOM
- Reading from localStorage
- Scrambling your puzzle when the game starts

Think of effects as **side effects** - they're not about returning JSX, but doing something else.

## The useEffect Hook

[`useEffect`](https://react.dev/reference/react/useEffect) lets you run code **after** your component renders.

### Basic Syntax

📚 **Learn more:** [useEffect Reference](https://react.dev/reference/react/useEffect)

```javascript
import { useEffect } from "react";

function MyComponent() {
	useEffect(() => {
		// Code here runs after render
		console.log("Component rendered!");
	});

	return <div>Hello</div>;
}
```

### The Dependency Array

Control **when** your effect runs with a dependency array:

```javascript
// Runs after EVERY render
useEffect(() => {
	console.log("Rendered!");
});

// Runs only ONCE (on mount)
useEffect(() => {
	console.log("Component mounted!");
}, []);

// Runs when 'count' changes
useEffect(() => {
	console.log("Count changed:", count);
}, [count]);

// Runs when 'name' OR 'age' changes
useEffect(() => {
	console.log("User data changed");
}, [name, age]);
```

**Rule:** Include **all** values from your component that the effect uses.

### Effect Cleanup

Some effects need cleanup (timers, subscriptions):

```javascript
useEffect(() => {
	// Setup: start a timer
	const timer = setInterval(() => {
		console.log("Tick");
	}, 1000);

	// Cleanup: stop the timer
	return () => {
		clearInterval(timer);
	};
}, []);
```

The cleanup function runs:

- Before the effect runs again
- When the component unmounts (is removed)

## Effect Examples

### Example 1: Log on Mount

```javascript
useEffect(() => {
	console.log("App started!");
}, []); // Empty array = run once
```

### Example 2: Document Title

```javascript
function Counter() {
	const [count, setCount] = useState(0);

	useEffect(() => {
		document.title = `Count: ${count}`;
	}, [count]); // Run when count changes

	return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Example 3: Fetch Data

```javascript
function UserProfile({ userId }) {
	const [user, setUser] = useState(null);

	useEffect(() => {
		fetch(`/api/users/${userId}`)
			.then((res) => res.json())
			.then((data) => setUser(data));
	}, [userId]); // Re-fetch when userId changes

	if (!user) return <div>Loading...</div>;
	return <div>{user.name}</div>;
}
```

### Example 4: Timer

```javascript
function Timer() {
	const [seconds, setSeconds] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setSeconds((prev) => prev + 1);
		}, 1000);

		// Cleanup: stop timer when component unmounts
		return () => clearInterval(timer);
	}, []); // Empty array: setup once

	return <div>Elapsed: {seconds}s</div>;
}
```

### Example 5: Local Storage

```javascript
function App() {
	const [name, setName] = useState("");

	// Load from localStorage on mount
	useEffect(() => {
		const saved = localStorage.getItem("name");
		if (saved) setName(saved);
	}, []);

	// Save to localStorage when name changes
	useEffect(() => {
		localStorage.setItem("name", name);
	}, [name]);

	return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

## Common Effect Patterns

### Pattern 1: Initialization

Run code once when component mounts:

```javascript
useEffect(() => {
	initializeGame();
	loadSettings();
}, []);
```

### Pattern 2: Synchronization

Keep something in sync with state:

```javascript
useEffect(() => {
	document.title = `${unreadCount} unread messages`;
}, [unreadCount]);
```

### Pattern 3: Subscription

Setup and teardown:

```javascript
useEffect(() => {
	const subscription = dataSource.subscribe(handleData);
	return () => subscription.unsubscribe();
}, [dataSource]);
```

## Array Scrambling

To scramble your puzzle, use the Fisher-Yates shuffle algorithm:

```javascript
function shuffleArray(array) {
	const shuffled = [...array]; // Copy array

	for (let i = shuffled.length - 1; i > 0; i--) {
		// Pick a random index from 0 to i
		const j = Math.floor(Math.random() * (i + 1));

		// Swap elements i and j
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return shuffled;
}
```

### Ensuring Solvability

**Important:** Not all random arrangements of a sliding puzzle are solvable! Some configurations are impossible to solve.

For simplicity, use this approach:

- Start with the solved state
- Make random valid moves
- After enough moves, it's scrambled but guaranteed solvable

```javascript
function scramblePuzzle(solvedState, numMoves = 100) {
	let tiles = [...solvedState];
	let gapIndex = tiles.indexOf(null);

	for (let i = 0; i < numMoves; i++) {
		// Get valid adjacent positions
		const validMoves = getAdjacentIndices(gapIndex, 3);

		// Pick a random adjacent tile
		const randomMove =
			validMoves[Math.floor(Math.random() * validMoves.length)];

		// Swap with gap
		[tiles[gapIndex], tiles[randomMove]] = [
			tiles[randomMove],
			tiles[gapIndex],
		];
		gapIndex = randomMove;
	}

	return tiles;
}

function getAdjacentIndices(index, gridSize) {
	const row = Math.floor(index / gridSize);
	const col = index % gridSize;
	const adjacent = [];

	// Up
	if (row > 0) adjacent.push(index - gridSize);
	// Down
	if (row < gridSize - 1) adjacent.push(index + gridSize);
	// Left
	if (col > 0) adjacent.push(index - 1);
	// Right
	if (col < gridSize - 1) adjacent.push(index + 1);

	return adjacent;
}
```

## 🛠️ BUILD: Add Effects and Polish

Let's finish your game!

### Task 1: Scramble on Start

Use `useEffect` to scramble the puzzle when the game loads:

```javascript
function Board() {
	const [tiles, setTiles] = useState(SOLVED_STATE);
	// ... other state

	// Scramble puzzle once on mount
	useEffect(() => {
		const scrambled = scramblePuzzle(SOLVED_STATE, 100);
		setTiles(scrambled);
	}, []); // Empty array: run once on mount

	// ... rest of component
}
```

### Task 2: Implement scramblePuzzle

Add the `scramblePuzzle` function before your Board component:

1. Copy the solved state
2. Find gap index
3. Make N random valid moves (try 100)
4. Return scrambled tiles

You'll also need `getAdjacentIndices` - write it using the grid math from Phase 4.

### Task 3: Add a Timer

Track how long the player takes:

```javascript
function Board() {
	const [tiles, setTiles] = useState(SOLVED_STATE);
	const [moves, setMoves] = useState(0);
	const [isWon, setIsWon] = useState(false);
	const [seconds, setSeconds] = useState(0);

	// Timer effect
	useEffect(() => {
		// Don't start timer if won
		if (isWon) return;

		const timer = setInterval(() => {
			setSeconds((prev) => prev + 1);
		}, 1000);

		// Cleanup: stop timer
		return () => clearInterval(timer);
	}, [isWon]); // Re-run if isWon changes

	// Format seconds to MM:SS
	const formatTime = (secs) => {
		const mins = Math.floor(secs / 60);
		const remainingSecs = secs % 60;
		return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
	};

	// Display timer in your JSX
	return (
		<div>
			<div className="game-info">
				<p>Time: {formatTime(seconds)}</p>
				<p>Moves: {moves}</p>
			</div>
			{/* ... */}
		</div>
	);
}
```

### Task 4: Update Reset Function

When resetting, also reset the timer:

```javascript
function handleReset() {
	const scrambled = scramblePuzzle(SOLVED_STATE, 100);
	setTiles(scrambled);
	setMoves(0);
	setIsWon(false);
	setSeconds(0);
}
```

### Task 5: Show Stats on Win

When the player wins, show their stats:

```javascript
{
	isWon && (
		<div className="win-message">
			<h2>🎉 You won!</h2>
			<p>Time: {formatTime(seconds)}</p>
			<p>Moves: {moves}</p>
			<button onClick={handleReset}>Play Again</button>
		</div>
	);
}
```

### Task 6: Save Best Score (Optional)

Use localStorage to save the best time:

```javascript
const [bestTime, setBestTime] = useState(null);

// Load best time on mount
useEffect(() => {
	const saved = localStorage.getItem("bestTime");
	if (saved) setBestTime(parseInt(saved));
}, []);

// When won, check if it's a new record
useEffect(() => {
	if (isWon && (bestTime === null || seconds < bestTime)) {
		setBestTime(seconds);
		localStorage.setItem("bestTime", seconds.toString());
	}
}, [isWon, seconds, bestTime]);

// Display best time
{
	bestTime !== null && <p>Best Time: {formatTime(bestTime)}</p>;
}
```

### Task 7: Add Loading State

Show loading while scrambling:

```javascript
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
	// Simulate scrambling delay
	setTimeout(() => {
		const scrambled = scramblePuzzle(SOLVED_STATE, 100);
		setTiles(scrambled);
		setIsLoading(false);
	}, 500);
}, []);

if (isLoading) {
	return <div className="loading">Scrambling puzzle...</div>;
}
```

### Expected Result

A polished, fully functional game:

- Scrambles automatically on load
- Timer tracks play time
- Stops when you win
- Shows stats on completion
- Saves best score
- Reset button scrambles again

### Checkpoint Questions

Before moving to Phase 6, make sure you understand:

- **What are effects and when do you need them?** Effects are for side effects (data fetching, timers, DOM updates) that happen outside of rendering.
- **What does the dependency array control?** It tells React when to re-run the effect - only when those dependencies change.
- **Why do some effects need cleanup?** To prevent memory leaks and bugs. Timers, subscriptions, and event listeners should be cleaned up when the component unmounts.
- **When does the cleanup function run?** Before the effect runs again, and when the component unmounts (is removed from the screen).
- **How do you run an effect only once?** Use an empty dependency array: `useEffect(() => { }, [])`
- **What happens if you forget a dependency?** Your effect uses stale data. If your effect uses a variable from the component, include it in the dependency array or you'll have bugs!

## Common useEffect Mistakes

### Mistake 1: Missing Dependencies

```javascript
// ❌ Bad - count is not in dependency array
useEffect(() => {
	console.log(count);
}, []);

// ✅ Good
useEffect(() => {
	console.log(count);
}, [count]);
```

**What happens?** The effect always uses the `count` value from when it first ran. If `count` changes to 5, your effect still logs the old value (like 0). This is called "stale closure" and causes confusing bugs.

**The fix:** Include ALL values from your component scope that the effect uses in the dependency array. React DevTools will warn you about this!

📚 **Learn more:** [Specifying reactive dependencies](https://react.dev/reference/react/useEffect#specifying-reactive-dependencies)

### Mistake 2: Infinite Loops

```javascript
// ❌ Bad - setCount causes re-render, triggers effect, infinite loop!
useEffect(() => {
	setCount(count + 1);
}, [count]);

// ✅ Good - runs once
useEffect(() => {
	setCount(count + 1);
}, []);
```

### Mistake 3: Not Cleaning Up

```javascript
// ❌ Bad - timer keeps running even after unmount
useEffect(() => {
	setInterval(() => setCount((c) => c + 1), 1000);
}, []);

// ✅ Good - cleans up timer
useEffect(() => {
	const id = setInterval(() => setCount((c) => c + 1), 1000);
	return () => clearInterval(id);
}, []);
```

## Understanding Effect Timing

```
1. Component renders (JSX is calculated)
2. React updates the DOM
3. Browser paints the screen
4. Effects run
```

This is why effects are perfect for:

- Operations that need the DOM to be updated first
- Operations that don't need to block visual updates
- Side effects that don't affect the initial render

## Next Steps

Your game is fully functional! The final phase will cover styling, animations, and best practices to make your code production-ready.

Continue to `tutorial/06-polish.md` →
