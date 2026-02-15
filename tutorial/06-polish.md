# Phase 6: Polish & Best Practices

## Styling in React

You've been using CSS classes, but React offers several styling approaches.

### Approach 1: CSS Files (What You've Been Using)

```javascript
// Component.js
import "./Component.css";

function Component() {
	return <div className="container">Content</div>;
}
```

**Pros:**

- Familiar CSS syntax
- Easy to organize
- Good for global styles

**Cons:**

- Global namespace (classes can conflict)
- Have to manage separate files

### Approach 2: Inline Styles

```javascript
function Tile({ color }) {
	const style = {
		backgroundColor: color,
		padding: "20px",
		borderRadius: "8px",
	};

	return <div style={style}>Tile</div>;
}
```

**Note:** CSS properties use camelCase: `backgroundColor`, not `background-color`

**Pros:**

- Dynamic styles based on props/state
- Scoped to component

**Cons:**

- No pseudo-classes (:hover, :active)
- No media queries
- Can be verbose

### Approach 3: Conditional Classes

```javascript
function Tile({ isActive, isGap }) {
	const classNames = ["tile"];

	if (isActive) classNames.push("tile-active");
	if (isGap) classNames.push("tile-gap");

	return <div className={classNames.join(" ")}>Tile</div>;
}

// Or use template literals
function Tile({ isActive, isGap }) {
	return (
		<div
			className={`tile ${isActive ? "tile-active" : ""} ${isGap ? "tile-gap" : ""}`}
		>
			Tile
		</div>
	);
}
```

### Approach 4: CSS Modules (Advanced)

Create `Tile.module.css`:

```css
.tile {
	background: blue;
}

.gap {
	background: transparent;
}
```

Use in component:

```javascript
import styles from "./Tile.module.css";

function Tile({ isGap }) {
	return <div className={isGap ? styles.gap : styles.tile}>Tile</div>;
}
```

**Pros:**

- Automatically scoped (no name conflicts!)
- Still write normal CSS

## Adding Animations

### Understanding Tile Movement

When a tile "slides into the gap", here's what actually happens:

1. **Data update**: Your array swaps the tile's value with `null`
2. **React re-render**: Components update with new props
3. **CSS Grid**: Each tile automatically repositions to match its array index
4. **CSS transitions**: Smooth animation between old and new positions!

The gap tile (with `null` value) acts as a visual placeholder. The numbered/emoji tiles are what actually animate when their position changes.

### CSS Transitions

```css
.tile {
	transition: all 0.3s ease;
}

.tile:hover {
	transform: scale(1.1);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
```

### Slide Animation

Animate tiles sliding into the gap:

```css
.tile {
	transition: transform 0.2s ease-out;
}

.tile-sliding {
	transform: scale(0.95);
}
```

Apply the class temporarily:

```javascript
const [slidingIndex, setSlidingIndex] = useState(null);

function handleTileClick(index) {
  // ... validation logic

  // Animate the slide
  setSlidingIndex(index);

  setTimeout(() => {
    // Do the actual swap
    const newTiles = swapTiles(tiles, index, gapIndex);
    setTiles(newTiles);
    setSlidingIndex(null);
  }, 200);
}

// In Tile component:
<div className={`tile ${index === slidingIndex ? 'tile-sliding' : ''}`}>
```

### Win Animation

```css
@keyframes bounce {
	0%,
	100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-20px);
	}
}

.tile-won {
	animation: bounce 0.5s ease;
}
```

Apply when won:

```javascript
<div className={`tile ${isWon ? 'tile-won' : ''}`}>
```

## Custom Hooks

Extract reusable logic into [custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks).

📚 **Learn more:** [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

### Example: useTimer Hook

```javascript
// hooks/useTimer.js
import { useState, useEffect } from "react";

function useTimer(isRunning) {
	const [seconds, setSeconds] = useState(0);

	useEffect(() => {
		if (!isRunning) return;

		const timer = setInterval(() => {
			setSeconds((prev) => prev + 1);
		}, 1000);

		return () => clearInterval(timer);
	}, [isRunning]);

	const reset = () => setSeconds(0);

	return { seconds, reset };
}

export default useTimer;
```

Use it in your component:

```javascript
import useTimer from "./hooks/useTimer";

function Board() {
	const [isWon, setIsWon] = useState(false);
	const { seconds, reset: resetTimer } = useTimer(!isWon);

	//...
}
```

### Example: useLocalStorage Hook

```javascript
// hooks/useLocalStorage.js
import { useState, useEffect } from "react";

function useLocalStorage(key, initialValue) {
	// Get initial value from localStorage or use default
	const [value, setValue] = useState(() => {
		const saved = localStorage.getItem(key);
		return saved !== null ? JSON.parse(saved) : initialValue;
	});

	// Save to localStorage when value changes
	useEffect(() => {
		localStorage.setItem(key, JSON.stringify(value));
	}, [key, value]);

	return [value, setValue];
}

export default useLocalStorage;
```

Use it:

```javascript
const [bestTime, setBestTime] = useLocalStorage("bestTime", null);
```

Now you don't need separate useEffect hooks for localStorage!

## Performance Optimization

### React.memo

[`React.memo`](https://react.dev/reference/react/memo) prevents unnecessary re-renders of child components:

📚 **Learn more:** [memo Reference](https://react.dev/reference/react/memo)

```javascript
import { memo } from "react";

const Tile = memo(function Tile({ emoji, isGap, onClick }) {
	console.log("Tile rendered");

	return (
		<div className={isGap ? "tile tile-gap" : "tile"} onClick={onClick}>
			{emoji}
		</div>
	);
});

export default Tile;
```

**When to use:**

- Component renders often
- With same props
- Rendering is expensive

**Note:** For Slidemoji, it probably won't make a noticeable difference, but it's good to know!

### useCallback

[`useCallback`](https://react.dev/reference/react/useCallback) prevents functions from being recreated on every render:

📚 **Learn more:** [useCallback Reference](https://react.dev/reference/react/useCallback)

```javascript
import { useCallback } from 'react';

function Board() {
  const [tiles, setTiles] = useState([...]);

  // Without useCallback, this function is recreated every render
  // With useCallback, it's only recreated when tiles changes
  const handleTileClick = useCallback((index) => {
    // ... logic
  }, [tiles, moves, isWon]);  // Dependencies

  return (
    <div>
      {tiles.map((emoji, index) => (
        <Tile key={index} onClick={() => handleTileClick(index)} />
      ))}
    </div>
  );
}
```

**When to use:**

- Passing callbacks to memoized children
- The function is a dependency of an effect
- Creating the function is expensive

### useMemo

[`useMemo`](https://react.dev/reference/react/useMemo) caches expensive calculations:

📚 **Learn more:** [useMemo Reference](https://react.dev/reference/react/useMemo)

```javascript
import { useMemo } from 'react';

function Board() {
  const [tiles, setTiles] = useState([...]);

  // This calculation only runs when tiles changes
  const validMoves = useMemo(() => {
    const gapIndex = tiles.indexOf(null);
    return getAdjacentIndices(gapIndex, 3);
  }, [tiles]);

  return <div>{validMoves.length} possible moves</div>;
}
```

**When to use:**

- The calculation is expensive
- The result is used multiple times
- Dependencies don't change often

**Rule of thumb:** Don't optimize prematurely! Add these only if you notice performance issues.

## Component Organization

### File Structure

A good structure for your app:

```
src/
  components/
    Board/
      Board.js
      Board.css
    Tile/
      Tile.js
      Tile.css
    GameInfo/
      GameInfo.js
      GameInfo.css
  hooks/
    useTimer.js
    useLocalStorage.js
  utils/
    gameLogic.js
    puzzleHelpers.js
  App.js
  App.css
  index.js
```

### Splitting Components

When to create a new component:

- Piece of UI is reused
- Component is getting too large (>200 lines)
- Piece has its own logic/state
- Improves readability

Example - extract GameInfo:

```javascript
// components/GameInfo.js
function GameInfo({ moves, seconds, isWon, bestTime, onReset }) {
	const formatTime = (secs) => {
		const mins = Math.floor(secs / 60);
		const secs2 = secs % 60;
		return `${mins}:${secs2.toString().padStart(2, "0")}`;
	};

	return (
		<div className="game-info">
			<p>Time: {formatTime(seconds)}</p>
			<p>Moves: {moves}</p>
			{bestTime && <p>Best: {formatTime(bestTime)}</p>}
			<button onClick={onReset}>Reset</button>
			{isWon && <div className="win-message">🎉 You won!</div>}
		</div>
	);
}

export default GameInfo;
```

Use it in Board:

```javascript
<GameInfo
	moves={moves}
	seconds={seconds}
	isWon={isWon}
	bestTime={bestTime}
	onReset={handleReset}
/>
```

## Best Practices

### 1. Component Naming

```javascript
// ✅ Good - PascalCase for components
function TileCard() {}
function UserProfile() {}

// ❌ Bad
function tileCard() {}
function user_profile() {}
```

### 2. Props Naming

```javascript
// ✅ Good - descriptive, clear purpose
<Button onClick={handleClick} isDisabled={true} />

// ❌ Bad - unclear
<Button click={handleClick} disabled={true} />
```

### 3. State Naming

```javascript
// ✅ Good - what it is, not how it's used
const [username, setUsername] = useState("");
const [isLoading, setIsLoading] = useState(false);

// ❌ Bad
const [input, setInput] = useState("");
const [loading, setLoading] = useState(false);
```

### 4. Extract Helper Functions

```javascript
// ✅ Good - pure functions outside component
function calculateScore(moves, time) {
	return Math.max(1000 - moves * 10 - time, 0);
}

function Board() {
	const score = calculateScore(moves, seconds);
	// ...
}

// ❌ Bad - defined inside component (recreated every render)
function Board() {
	const calculateScore = (moves, time) => {
		return Math.max(1000 - moves * 10 - time, 0);
	};
	// ...
}
```

### 5. Keep Components Focused

Each component should do one thing well:

- Tile: displays a single tile
- Board: manages game logic and tile layout
- GameInfo: displays stats and controls
- App: orchestrates the app

### 6. Comment Complex Logic

```javascript
// Check if puzzle is solvable using inversion count
// More info: https://www.geeksforgeeks.org/check-instance-15-puzzle-solvable/
function isSolvable(tiles) {
	// ... complex algorithm
}
```

### 7. Use Semantic HTML

```javascript
// ✅ Good
<header>
  <h1>Slidemoji</h1>
</header>
<main>
  <Board />
</main>

// ❌ Bad
<div>
  <div>Slidemoji</div>
</div>
<div>
  <Board />
</div>
```

## 🛠️ BUILD: Final Polish

Let's make your game shine!

### Task 1: Beautiful Styling

Create a polished look:

```css
/* App.css */
body {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	min-height: 100vh;
	display: flex;
	justify-content: center;
	align-items: center;
	margin: 0;
}

.app {
	text-align: center;
	background: white;
	padding: 2rem;
	border-radius: 20px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.board {
	display: grid;
	grid-template-columns: repeat(3, 100px);
	grid-template-rows: repeat(3, 100px);
	gap: 8px;
	margin: 20px auto;
	background: #f0f0f0;
	padding: 10px;
	border-radius: 12px;
}

.tile {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 48px;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.tile:hover {
	transform: translateY(-4px);
	box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.tile-gap {
	background: transparent;
	box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	cursor: default;
}

.tile-gap:hover {
	transform: none;
}
```

### Task 2: Add Sound Effects (Optional)

```javascript
function Board() {
	const moveSound = new Audio("/move.mp3");
	const winSound = new Audio("/win.mp3");

	function handleTileClick(index) {
		// ... validation

		// Play sound
		moveSound.play();

		// ... swap logic

		if (checkWin(newTiles)) {
			winSound.play();
			setIsWon(true);
		}
	}
}
```

### Task 3: Add Difficulty Levels

```javascript
function App() {
	const [gridSize, setGridSize] = useState(3);

	return (
		<div>
			<h1>Slidemoji</h1>
			<div>
				<button onClick={() => setGridSize(3)}>Easy (3x3)</button>
				<button onClick={() => setGridSize(4)}>Medium (4x4)</button>
				<button onClick={() => setGridSize(5)}>Hard (5x5)</button>
			</div>
			<Board gridSize={gridSize} />
		</div>
	);
}

function Board({ gridSize }) {
	// Use gridSize to create appropriate number of tiles
	// Update all grid calculations to use gridSize
}
```

### Task 4: Add Image Mode

Let users use images instead of emojis:

```javascript
const [useImages, setUseImages] = useState(false);

// Generate tiles based on mode
const baseTiles = useImages
	? Array.from({ length: 8 }, (_, i) => `/images/piece-${i}.jpg`)
	: ["🎨", "🌟", "🎭", "🎪", "🎯", "🎲", "🎸", "🎹"];
```

For images, you'd need to:

1. Upload an image
2. Slice it into pieces
3. Use each piece as a background for tiles

### Task 5: Add Keyboard Controls

```javascript
useEffect(() => {
	function handleKeyPress(e) {
		const gapIndex = tiles.indexOf(null);
		const gridSize = 3;
		let targetIndex;

		switch (e.key) {
			case "ArrowUp":
				targetIndex = gapIndex + gridSize;
				break;
			case "ArrowDown":
				targetIndex = gapIndex - gridSize;
				break;
			case "ArrowLeft":
				targetIndex = gapIndex + 1;
				break;
			case "ArrowRight":
				targetIndex = gapIndex - 1;
				break;
			default:
				return;
		}

		if (targetIndex >= 0 && targetIndex < tiles.length) {
			handleTileClick(targetIndex);
		}
	}

	window.addEventListener("keydown", handleKeyPress);
	return () => window.removeEventListener("keydown", handleKeyPress);
}, [tiles, handleTileClick]);
```

### Task 6: Add Hint System

```javascript
const [showHints, setShowHints] = useState(false);

// In render:
{
	tiles.map((emoji, index) => {
		const isMovable = isAdjacent(index, gapIndex, 3);

		return (
			<Tile
				key={index}
				emoji={emoji}
				isGap={emoji === null}
				isHighlighted={showHints && isMovable}
				onClick={() => handleTileClick(index)}
			/>
		);
	});
}

// In Tile:
function Tile({ emoji, isGap, isHighlighted, onClick }) {
	const className = `tile 
    ${isGap ? "tile-gap" : ""} 
    ${isHighlighted ? "tile-highlighted" : ""}`;
	// ...
}
```

### Task 7: Add Move History & Undo

```javascript
const [history, setHistory] = useState([]);

function handleTileClick(index) {
	// ... validation and swap logic

	// Save to history
	setHistory([...history, { tiles: prevTiles, moves: prevMoves }]);
	setTiles(newTiles);
}

function handleUndo() {
	if (history.length === 0) return;

	const lastState = history[history.length - 1];
	setTiles(lastState.tiles);
	setMoves(lastState.moves);
	setHistory(history.slice(0, -1));
}
```

### Task 8: Responsive Design

Make it work on mobile:

```css
@media (max-width: 600px) {
	.board {
		grid-template-columns: repeat(3, 80px);
		grid-template-rows: repeat(3, 80px);
	}

	.tile {
		font-size: 36px;
	}
}
```

### Task 9: Dark Mode (Challenge)

```javascript
function App() {
	const [isDark, setIsDark] = useLocalStorage("darkMode", false);

	useEffect(() => {
		document.body.className = isDark ? "dark-mode" : "light-mode";
	}, [isDark]);

	return (
		<div>
			<button onClick={() => setIsDark(!isDark)}>
				{isDark ? "☀️" : "🌙"}
			</button>
			{/* rest of app */}
		</div>
	);
}
```

```css
.light-mode {
	--bg: white;
	--text: black;
}

.dark-mode {
	--bg: #1a1a1a;
	--text: white;
}

body {
	background: var(--bg);
	color: var(--text);
}
```

## Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

### Deploy Options

1. **Netlify** (Easiest)
    - Drag and drop the `build` folder
    - Or connect your GitHub repo

2. **Vercel**
    - Import your GitHub repo
    - Auto-deploys on push

3. **GitHub Pages**
    ```bash
    npm install gh-pages
    ```
    Add to package.json:
    ```json
    "homepage": "https://yourusername.github.io/slidemoji",
    "scripts": {
      "predeploy": "npm run build",
      "deploy": "gh-pages -d build"
    }
    ```
    Deploy:
    ```bash
    npm run deploy
    ```

## Congratulations! 🎉

You've built a complete React application and learned:

✅ Components & JSX
✅ Props for data flow
✅ State management with useState
✅ Event handling
✅ Effects with useEffect
✅ Custom hooks
✅ Performance optimization
✅ Best practices
✅ Deployment

## What's Next?

### Continue Learning React

- **React Router** - Multi-page applications
- **Context API** - Global state management
- **useReducer** - Complex state logic
- **React Query** - Data fetching and caching
- **Testing** - Jest and React Testing Library

### Build More Projects

- Todo app with filters and persistence
- Weather app with API integration
- Chat application
- E-commerce product page
- Your own idea!

### Learn the Ecosystem

- **Next.js** - React framework with SSR
- **TypeScript** - Type safety
- **Redux** or **Zustand** - State management
- **Styled Components** or **Tailwind** - Advanced styling

## Resources

- **React Docs:** https://react.dev
- **React DevTools:** Browser extension for debugging
- **MDN Web Docs:** JavaScript reference
- **CSS Tricks:** CSS tutorials and references

You've done an amazing job working through this tutorial. Now go build something awesome! 🚀
