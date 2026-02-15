# Phase 4: Events & Game Logic

## Event Handling in React

You've already seen `onClick`, but let's dive deeper into [events in React](https://react.dev/learn/responding-to-events).

### Common Events

📚 **Learn more:** [Responding to Events](https://react.dev/learn/responding-to-events)

```javascript
// Click events
<button onClick={handleClick}>Click me</button>

// Input events
<input onChange={handleChange} />

// Form events
<form onSubmit={handleSubmit}>

// Mouse events
<div
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
>

// Keyboard events
<input
  onKeyDown={handleKeyDown}
  onKeyPress={handleKeyPress}
/>
```

### Event Handlers

Event handlers receive a **Synthetic Event** object:

```javascript
function handleClick(event) {
	console.log(event.target); // The element that was clicked
	event.preventDefault(); // Prevent default behavior
	event.stopPropagation(); // Stop event bubbling
}

<button onClick={handleClick}>Click</button>;
```

#### Understanding the Event Object

**`event.target`** - The actual DOM element that triggered the event

```javascript
function handleClick(event) {
	console.log(event.target); // <div class="tile">5</div>
	console.log(event.target.className); // "tile"
}
```

**`event.preventDefault()`** - Stops the browser's default action

- Prevents form submission: `<form onSubmit={handleSubmit}>`
- Prevents link navigation: `<a href="#" onClick={handleClick}>`
- Prevents checkbox toggle, etc.

```javascript
function handleSubmit(event) {
	event.preventDefault(); // Don't reload the page!
	// Handle form submission with JavaScript instead
}
```

**`event.stopPropagation()`** - Stops the event from bubbling up to parent elements

```javascript
// Without stopPropagation:
<div onClick={handleParentClick}>
	{" "}
	{/* This fires too! */}
	<button onClick={handleButtonClick}>
		{" "}
		{/* Click this */}
		Click
	</button>
</div>;

// With stopPropagation:
function handleButtonClick(event) {
	event.stopPropagation(); // Parent's onClick won't fire
	// Handle button click
}
```

**Do you need these in Slidemoji?** Probably not!

- Your tiles are just `<div>` elements with no default behavior
- You're not nesting clickable elements inside each other
- Simple click handlers work fine without these methods

### Passing Arguments to Event Handlers

You have three options:

```javascript
// Option 1: Arrow function in JSX (most common for parameters)
<button onClick={() => handleClick(id)}>Delete</button>

// Option 2: Wrap in another function
function handleClickWrapper() {
  handleClick(id);
}
<button onClick={handleClickWrapper}>Delete</button>

// Option 3: Use bind (less common in modern React)
<button onClick={handleClick.bind(null, id)}>Delete</button>
```

#### Why Do We Need the Arrow Function?

**Q: Can I just use `onClick={handleTileClick}` instead of `onClick={() => handleTileClick(index)}`?**

**A:** Only if you don't need to pass any parameters!

```javascript
// ✅ Works - No parameters needed
<button onClick={handleClick}>Click</button>

// ❌ Doesn't work - You need to pass the index!
// This would call the function with the event object, not the index
<button onClick={handleTileClick}>Click</button>

// ✅ Works - Arrow function passes the index
<button onClick={() => handleTileClick(index)}>Click</button>
```

The arrow function `() => handleTileClick(index)` creates a **new function** that will call `handleTileClick` with your specific `index` value when the click happens.

**Important:** Don't call the function immediately!

```javascript
// ❌ WRONG - Calls immediately on render
<button onClick={handleClick()}>Click</button>

// ✅ CORRECT - Passes function reference
<button onClick={handleClick}>Click</button>

// ✅ CORRECT - Arrow function calls it on click
<button onClick={() => handleClick()}>Click</button>
```

## Implementing Game Logic

Let's think about the sliding puzzle rules:

### Game Rules

1. You click a tile (not the gap)
2. If the tile is **adjacent** to the gap, it slides into the gap
3. If not adjacent, nothing happens
4. Each successful move increments the move counter
5. When the puzzle matches the solved state, you win!

### How the Gap Works

The gap is represented as a tile with `value={null}` and `isGap={true}`. When you "slide a tile into the gap", you're actually:

1. **Swapping positions** in the array: the numbered tile and `null` trade places
2. **React re-renders** with the new array order
3. **CSS Grid repositions** each tile automatically
4. Later (Phase 6), you'll add CSS transitions to animate the movement smoothly!

The gap tile provides a visual placeholder and maintains consistent grid structure, making both logic and animations simpler.

### Breaking Down the Logic

We need these functions:

- `findGapIndex()` - Find where the gap is
- `isAdjacent()` - Check if two positions are adjacent
- `swapTiles()` - Swap a tile with the gap
- `checkWin()` - Check if puzzle is solved

## Grid Math

Your 3x3 grid has indices 0-8:

```
0 1 2
3 4 5
6 7 8
```

Given an index, calculate:

- **Row**: `Math.floor(index / gridSize)`
- **Column**: `index % gridSize`

```javascript
// Example: Index 5 in a 3x3 grid
const gridSize = 3;
const index = 5;
const row = Math.floor(5 / 3); // 1
const col = 5 % 3; // 2
// Position: row 1, column 2 ✓
```

### Adjacent Tiles

Two tiles are adjacent if:

- Same row, columns differ by 1 (horizontal neighbors), OR
- Same column, rows differ by 1 (vertical neighbors)

```javascript
function isAdjacent(index1, index2, gridSize) {
	const row1 = Math.floor(index1 / gridSize);
	const col1 = index1 % gridSize;
	const row2 = Math.floor(index2 / gridSize);
	const col2 = index2 % gridSize;

	// Horizontal neighbors
	if (row1 === row2 && Math.abs(col1 - col2) === 1) {
		return true;
	}

	// Vertical neighbors
	if (col1 === col2 && Math.abs(row1 - row2) === 1) {
		return true;
	}

	return false;
}
```

### Swapping Algorithm

To swap tiles, create a new array with the swapped values:

```javascript
function swapTiles(tiles, index1, index2) {
	const newTiles = [...tiles]; // Copy array
	const temp = newTiles[index1];
	newTiles[index1] = newTiles[index2];
	newTiles[index2] = temp;
	return newTiles;
}
```

### Helper Function Placement

**Outside the component (best for pure functions):**

```javascript
// These don't use props/state, so define them outside
function isAdjacent(idx1, idx2, gridSize) {
	/* ... */
}
function swapTiles(tiles, idx1, idx2) {
	/* ... */
}

function Board() {
	/* uses the helpers */
}
```

**Inside the component (when needed):**

```javascript
function Board() {
  const [tiles, setTiles] = useState([...]);

  // This uses state, so it needs to be inside
  function handleTileClick(index) {
    const gapIndex = tiles.indexOf(null);
    // ...
  }
}
```

Pure functions outside = cleaner code and no unnecessary recreations!

### Win Condition

The puzzle is solved when tiles match a solved configuration:

```javascript
const solvedState = ["🎨", "🌟", "🎭", "🎪", "🎯", "🎲", "🎸", "🎹", null];

function checkWin(tiles, solvedState) {
	for (let i = 0; i < tiles.length; i++) {
		if (tiles[i] !== solvedState[i]) {
			return false;
		}
	}
	return true;
}

// Or using array methods:
function checkWin(tiles, solvedState) {
	return tiles.every((tile, i) => tile === solvedState[i]);
}
```

## Putting It All Together

Here's how your `handleTileClick` should work:

```javascript
function handleTileClick(index) {
	// 1. Find the gap
	const gapIndex = tiles.indexOf(null);

	// 2. Check if clicked tile is adjacent to gap
	if (!isAdjacent(index, gapIndex, 3)) {
		return; // Not adjacent, do nothing
	}

	// 3. Swap tile with gap
	const newTiles = swapTiles(tiles, index, gapIndex);
	setTiles(newTiles);

	// 4. Increment moves
	setMoves(moves + 1);

	// 5. Check win condition
	if (checkWin(newTiles, solvedState)) {
		setIsWon(true);
	}
}
```

## 🛠️ BUILD: Implement Game Logic

Time to make your puzzle playable!

### Task 1: Define Solved State

In `Board.jsx`, create a constant for the solved puzzle:

```javascript
const SOLVED_STATE = [1, 2, 3, 4, 5, 6, 7, 8, null];

// Or with emojis:
// const SOLVED_STATE = [
//   '🎨', '🌟', '🎭',
//   '🎪', '🎯', '🎲',
//   '🎸', '🎹', null
// ];
```

Put this **outside** your component function (it doesn't change).

### Task 2: Create Helper Functions

Add these helper functions to `Board.jsx` (outside the component):

1. **findGapIndex** - Returns the index of `null` in the tiles array

    ```javascript
    // Hint: use array.indexOf()
    ```

2. **isAdjacent** - Returns true if two indices are adjacent

    ```javascript
    function isAdjacent(index1, index2, gridSize) {
    	// Calculate rows and columns
    	// Check if horizontal or vertical neighbors
    }
    ```

3. **swapTiles** - Returns a new array with two elements swapped

    ```javascript
    function swapTiles(tiles, index1, index2) {
    	// Copy array
    	// Swap elements
    	// Return new array
    }
    ```

4. **checkWin** - Returns true if tiles match solved state
    ```javascript
    function checkWin(tiles, solvedState) {
    	// Compare every element
    }
    ```

**Tip:** Write these one at a time. Test each with `console.log()` before moving to the next.

### Task 3: Implement handleTileClick

Update your `handleTileClick` function to:

1. Find the gap index
2. Check if clicked tile is adjacent to gap
3. If not adjacent, return early
4. If adjacent:
    - Swap tiles
    - Update state with new tiles
    - Increment move counter
    - Check if puzzle is solved

```javascript
function handleTileClick(clickedIndex) {
	// Don't do anything if already won
	if (isWon) return;

	// Don't do anything if clicked the gap itself
	if (tiles[clickedIndex] === null) return;

	// Your implementation here...
}
```

### Task 4: Add Styling for the Gap

**Important:** Style your gap tile with `opacity: 0` or a different background color, but **NOT** `display: none`!

```css
/* ✅ GOOD - Gap is invisible but takes up space */
.tile-gap {
	opacity: 0;
	/* or */
	background-color: #f0f0f0;
	border: 2px dashed #ccc;
}

/* ❌ BAD - Breaks the grid! */
.tile-gap {
	display: none; /* Don't do this! */
}
```

**Why?** Using `display: none` removes the gap from the CSS Grid entirely, breaking your 3×3 layout. The gap needs to occupy a grid cell as a placeholder for tiles to slide into.

### Task 5: Test Your Game

At this point, your game should be playable!

1. Start with tiles in solved state
2. Move one tile into the gap
3. **Tiles should visually swap positions on the screen!**
4. Try to solve it
5. Check that:
    - Only adjacent tiles can move
    - Move counter increments
    - Win message appears when solved
    - Can't make moves after winning

**Debug tip:** Add `console.log()` statements:

```javascript
function handleTileClick(clickedIndex) {
	console.log("Clicked:", clickedIndex);
	console.log("Gap at:", tiles.indexOf(null));
	console.log("Adjacent?", isAdjacent(clickedIndex, tiles.indexOf(null), 3));
	// ...
}
```

## 🔧 Troubleshooting: "Clicking Tiles Does Nothing!"

If clicking adjacent tiles doesn't visually move them, check these common issues:

### 1. Is Your Click Handler Being Called?

Add a `console.log` at the start:

```javascript
function handleTileClick(clickedIndex) {
  console.log('Tile clicked:', clickedIndex);
  // ...\n}
```

No log? Check that you're passing `onClick` to the Tile component correctly.

### 2. Is Your Gap Using `display: none`?

This breaks the grid! Check your CSS:

```css
/* ❌ This breaks everything */
.tile-gap {
	display: none;
}

/* ✅ Use this instead */
.tile-gap {
	opacity: 0;
	/* or give it a visible style */
	background-color: #f0f0f0;
	border: 2px dashed #ccc;
}
```

### 3. Is `isAdjacent` Working Correctly?

Test it:

```javascript
function handleTileClick(clickedIndex) {
	const gapIndex = tiles.indexOf(null);
	console.log("Clicked:", clickedIndex, "Gap:", gapIndex);
	console.log("Adjacent?", isAdjacent(clickedIndex, gapIndex, 3));
	// ...
}
```

### 4. Is State Updating?

Log before and after:

```javascript
function handleTileClick(clickedIndex) {
	console.log("Before:", tiles);
	const newTiles = swapTiles(tiles, clickedIndex, gapIndex);
	console.log("After:", newTiles);
	setTiles(newTiles);
}
```

### 5. Are You Returning a New Array?

`swapTiles` must return a **new** array, not modify the existing one:

```javascript
// ✅ CORRECT - Creates new array
function swapTiles(tiles, i1, i2) {
	const newTiles = [...tiles]; // Copy first!
	[newTiles[i1], newTiles[i2]] = [newTiles[i2], newTiles[i1]];
	return newTiles;
}

// ❌ WRONG - Modifies original array
function swapTiles(tiles, i1, i2) {
	[tiles[i1], tiles[i2]] = [tiles[i2], tiles[i1]];
	return tiles; // React doesn't detect the change!
}
```

### Expected Behavior After Phase 4

Clicking an adjacent tile should:

1. **Visually swap** the tile and gap positions on screen
2. **Update** the move counter
3. **Detect** when you solve the puzzle (if you started from solved state)

If tiles aren't moving visually, check the issues above!

### Task 6: Add Visual Feedback

Make it clear which tiles are clickable:

1. Add hover effects in CSS:

```css
.tile:not(.tile-gap):hover {
	transform: scale(1.05);
	cursor: pointer;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	transition: all 0.2s;
}
```

2. Add a class for adjacent tiles (optional challenge):
    - Highlight tiles that can currently move
    - Calculate this when rendering

### Task 6: Add a Reset Button

Create a reset function:

```javascript
function handleReset() {
	setTiles(SOLVED_STATE); // Or a scrambled state later
	setMoves(0);
	setIsWon(false);
}
```

Add a reset button to your UI:

```javascript
<button onClick={handleReset}>Reset Game</button>
```

### Expected Result

A fully playable puzzle game!

- Click adjacent tiles to slide them
- Non-adjacent tiles don't move
- Move counter tracks your moves
- Win detection works
- Can reset the game

### Debugging Tips

If something isn't working:

1. **Tiles not moving?**
    - Console.log the gap index
    - Console.log the isAdjacent result
    - Check that you're creating a new array (not mutating)

2. **Win detection not working?**
    - Console.log your tiles and solvedState
    - Compare them element by element
    - Make sure you're checking the NEW tiles after swap

3. **Moves not counting?**
    - Check that setMoves is called
    - Remember state updates are async (can't console.log immediately)

## Advanced: Preventing Invalid Interactions

Make your game more robust:

```javascript
function handleTileClick(clickedIndex) {
	// Prevent all interactions if won
	if (isWon) return;

	// Can't click the gap
	if (tiles[clickedIndex] === null) return;

	const gapIndex = tiles.indexOf(null);

	// Must be adjacent
	if (!isAdjacent(clickedIndex, gapIndex, 3)) {
		return;
	}

	// Valid move - proceed with logic...
}
```

### Optional: Add Click Feedback

Show when a click is invalid:

```javascript
const [message, setMessage] = useState("");

function handleTileClick(clickedIndex) {
	if (!isAdjacent(clickedIndex, gapIndex, 3)) {
		setMessage("That tile cannot move!");
		setTimeout(() => setMessage(""), 2000); // Clear after 2 seconds
		return;
	}
	// ...
}

// In your JSX:
{
	message && <p className="message">{message}</p>;
}
```

## Checkpoint Questions

Before moving to Phase 5, make sure you understand:

- **How do event handlers work in React?** You pass a function to event props like `onClick`. React calls your function when the event occurs.
- **Why do we pass function references, not function calls?** `onClick={handleClick}` passes the function; `onClick={handleClick()}` calls it immediately during render.
- **How do you calculate row and column from a 1D array index?** `row = Math.floor(index / gridSize)` and `col = index % gridSize`
- **Why is it important to create new arrays instead of mutating state?** React compares references to detect changes. Mutating doesn't create a new reference, so React won't re-render.
- **How does the adjacency check work?** Two tiles are adjacent if they're in the same row with columns differing by 1, OR same column with rows differing by 1.
- **When should helper functions be inside vs outside the component?** Put them outside if they're pure functions (don't use props/state). Keep them inside if they need props/state, or use `useCallback` to prevent recreation.

## Next Steps

Your game is playable, but it starts in solved state! Next, you'll learn about `useEffect` to scramble the puzzle when the game loads, add a timer, and implement other "side effects".

Continue to `tutorial/05-effects.md` →
