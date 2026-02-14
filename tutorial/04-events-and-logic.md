# Phase 4: Events & Game Logic

## Event Handling in React

You've already seen `onClick`, but let's dive deeper into events.

### Common Events

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

1. You click a tile
2. If the tile is **adjacent** to the gap, it slides into the gap
3. If not adjacent, nothing happens
4. Each successful move increments the move counter
5. When the puzzle matches the solved state, you win!

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

In `Board.js`, create a constant for the solved puzzle:

```javascript
const SOLVED_STATE = ["🎨", "🌟", "🎭", "🎪", "🎯", "🎲", "🎸", "🎹", null];
```

Put this **outside** your component function (it doesn't change).

### Task 2: Create Helper Functions

Add these helper functions to `Board.js` (outside the component):

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

### Task 4: Test Your Game

At this point, your game should be playable!

1. Start with tiles in solved state
2. Move one tile into the gap
3. Try to solve it
4. Check that:
    - Only adjacent tiles can move
    - Move counter increments
    - Win message appears when solved
    - Can't make moves after winning

### Task 5: Add Visual Feedback

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

- How do event handlers work in React?
- Why do we pass function references, not function calls?
- How do you calculate row and column from a 1D array index?
- Why is it important to create new arrays instead of mutating state?
- How does the adjacency check work?
- When should helper functions be inside vs outside the component?

## Next Steps

Your game is playable, but it starts in solved state! Next, you'll learn about `useEffect` to scramble the puzzle when the game loads, add a timer, and implement other "side effects".

Continue to `tutorial/05-effects.md` →
