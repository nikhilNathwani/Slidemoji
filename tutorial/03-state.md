# Phase 3: State - Making Things Dynamic

## What is State?

**State** is data that can change over time. When state changes, React automatically re-renders the component to reflect the new data.

Examples of state:

- Is a button toggled on or off?
- What text is in an input field?
- What's the current score?
- What's the arrangement of tiles in your puzzle?

## State vs Props

| Props               | State                    |
| ------------------- | ------------------------ |
| Passed from parent  | Managed within component |
| Read-only           | Can be updated           |
| External            | Internal                 |
| Function parameters | Local variables          |

Think of it this way:

- **Props**: Configuration given to you
- **State**: Data you manage

## The useState Hook

React provides the [`useState`](https://react.dev/reference/react/useState) hook to add state to components.

### Basic Syntax

📚 **Learn more:** [useState Reference](https://react.dev/reference/react/useState)

```javascript
import { useState } from "react";

function Counter() {
	const [count, setCount] = useState(0);

	return (
		<div>
			<p>Count: {count}</p>
			<button onClick={() => setCount(count + 1)}>Increment</button>
		</div>
	);
}
```

Let's break this down:

```javascript
const [count, setCount] = useState(0);
//     ^       ^           ^
//     |       |           |
//     |       |           Initial value
//     |       Function to update state
//     Current state value
```

- `useState(0)` creates a state variable with initial value `0`
- Returns an array with two elements (we destructure it):
    - `count`: the current state value
    - `setCount`: function to update the state
- When you call `setCount(newValue)`, React re-renders the component

### Naming Convention

Always name your state update function `set` + `StateName`:

- `[count, setCount]`
- `[name, setName]`
- `[isOpen, setIsOpen]`
- `[tiles, setTiles]`

## State Update Examples

### Simple Updates

```javascript
function Toggle() {
	const [isOn, setIsOn] = useState(false);

	return (
		<button onClick={() => setIsOn(!isOn)}>{isOn ? "ON" : "OFF"}</button>
	);
}
```

### Multiple State Variables

```javascript
function UserForm() {
	const [name, setName] = useState("");
	const [age, setAge] = useState(0);
	const [email, setEmail] = useState("");

	return (
		<form>
			<input value={name} onChange={(e) => setName(e.target.value)} />
			{/* More inputs... */}
		</form>
	);
}
```

### State with Objects

```javascript
function Profile() {
	const [user, setUser] = useState({
		name: "Alice",
		age: 30,
		email: "alice@example.com",
	});

	// Update one field - must spread the rest!
	const updateName = (newName) => {
		setUser({
			...user, // Keep other properties
			name: newName, // Update only name
		});
	};

	return <div>{user.name}</div>;
}
```

### State with Arrays

```javascript
function TodoList() {
	const [todos, setTodos] = useState(["Learn React", "Build project"]);

	const addTodo = (text) => {
		setTodos([...todos, text]); // Add to end
	};

	const removeTodo = (index) => {
		setTodos(todos.filter((_, i) => i !== index));
	};

	return (
		<ul>
			{todos.map((todo, i) => (
				<li key={i}>{todo}</li>
			))}
		</ul>
	);
}
```

## Important State Rules

### 1. Never Mutate State Directly

```javascript
// ❌ WRONG - Mutating state
const [tiles, setTiles] = useState([1, 2, 3]);
tiles[0] = 99; // Don't do this!
setTiles(tiles); // React won't detect the change

// ✅ CORRECT - Create new array
const newTiles = [...tiles];
newTiles[0] = 99;
setTiles(newTiles);

// ✅ ALSO CORRECT - One step
setTiles([99, ...tiles.slice(1)]);
```

### 2. State Updates are Asynchronous

```javascript
const [count, setCount] = useState(0);

function handleClick() {
	setCount(count + 1);
	console.log(count); // Still shows old value!
	// State update hasn't happened yet
}
```

If you need the new value immediately, use it directly:

```javascript
function handleClick() {
	const newCount = count + 1;
	setCount(newCount);
	console.log(newCount); // Shows new value
}
```

### 3. State is Isolated

Each component instance has its own state:

```javascript
function Counter() {
	const [count, setCount] = useState(0);
	return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

function App() {
	return (
		<div>
			<Counter /> {/* Has its own count */}
			<Counter /> {/* Has its own count */}
		</div>
	);
}
```

## Where Should State Live?

**Rule of thumb:** State should live in the **common parent** of all components that need it.

### Bad: State in Wrong Place

```javascript
// Each Tile has its own emoji state
// Board can't rearrange them!
function Tile() {
	const [emoji, setEmoji] = useState("🎨");
	return <div>{emoji}</div>;
}
```

### Good: State in Parent

```javascript
// Board manages all tiles
// Can rearrange them from one place
function Board() {
	const [tiles, setTiles] = useState(["🎨", "🌟", "🎭"]);

	return (
		<div>
			{tiles.map((emoji, i) => (
				<Tile key={i} emoji={emoji} />
			))}
		</div>
	);
}
```

## Lifting State Up

When two components need to share state, move it to their parent:

```
Before:
  ComponentA [has stateX]
  ComponentB [needs stateX]

After:
  Parent [has stateX]
    ├─ ComponentA [receives stateX as prop]
    └─ ComponentB [receives stateX as prop]
```

## State Update Patterns

### Pattern 1: Update Based on Current State

When new state depends on old state, use the function form:

```javascript
// ⚠️ Can cause bugs with multiple updates
setCount(count + 1);

// ✅ Always safe
setCount((prevCount) => prevCount + 1);
```

Why? If you call the setter multiple times in quick succession:

```javascript
// Both use the same `count` value - only increments once!
setCount(count + 1);
setCount(count + 1);

// Each uses the latest value - increments twice!
setCount((prev) => prev + 1);
setCount((prev) => prev + 1);
```

### Pattern 2: Complex State Updates

```javascript
const [tiles, setTiles] = useState([...]);

function swapTiles(index1, index2) {
  setTiles(prevTiles => {
    const newTiles = [...prevTiles];  // Copy array
    const temp = newTiles[index1];     // Swap
    newTiles[index1] = newTiles[index2];
    newTiles[index2] = temp;
    return newTiles;  // Return new array
  });
}
```

## 🛠️ BUILD: Add State to Your Game

Now let's make Slidemoji interactive!

### Task 1: Move Tile Data to State

In `src/components/Board.jsx`:

1. Import `useState` from React
2. Convert your `tiles` array to state
3. Initial state should be your array of emojis with one `null`

```javascript
import { useState } from "react";

function Board() {
	const [tiles, setTiles] = useState([1, 2, 3, 4, 5, 6, 7, 8, null]);

	// Or with emojis:
	// const [tiles, setTiles] = useState([
	//   '🎨', '🌟', '🎭',
	//   '🎪', '🎯', '🎲',
	//   '🎸', '🎹', null,
	// ]);

	// Rest of your component...
}
```

### Task 2: Add Click Handlers (Preparation)

For now, just verify clicks are working:

1. Create a function `handleTileClick` in Board that accepts an `index`
2. For now, just console.log the index
3. Pass this function to each Tile as a prop

In Board.jsx:

```javascript
function Board() {
  const [tiles, setTiles] = useState([...]);

  const handleTileClick = (index) => {
    console.log('Clicked tile at index:', index);
  };

  return (
    <div className="board">
      {tiles.map((emoji, index) => (
        <Tile
          key={index}
          emoji={emoji}
          isGap={emoji === null}
          onClick={() => handleTileClick(index)}
        />
      ))}
    </div>
  );
}
```

### Task 3: Make Tiles Clickable

In `src/components/Tile.jsx`:

1. Accept an `onClick` prop (destructure it)
2. Add `onClick={onClick}` to your div
3. Add a cursor style to non-gap tiles

```javascript
function Tile({ emoji, isGap, onClick }) {
	return (
		<div
			className={isGap ? "tile tile-gap" : "tile"}
			onClick={onClick}
			style={{ cursor: isGap ? "default" : "pointer" }}
		>
			{isGap ? "" : emoji}
		</div>
	);
}
```

### Task 4: Test Your Setup

1. Open your browser console
2. Click on tiles
3. You should see log messages with the index

### Task 5: Add More State

Your game needs more than just tile data. Add state for:

1. `moves` - number of moves made (starts at 0)
2. `isWon` - whether the puzzle is solved (starts at false)

```javascript
function Board() {
  const [tiles, setTiles] = useState([...]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);

  // ...
}
```

### Task 6: Display Game Info

Update your Board's render to show:

- Move counter: "Moves: {moves}"
- Win message: Show "You won!" when `isWon` is true

```javascript
return (
	<div>
		<div className="game-info">
			<p>Moves: {moves}</p>
			{isWon && <p className="win-message">🎉 You won!</p>}
		</div>
		<div className="board">{/* tiles... */}</div>
	</div>
);
```

### Task 7: Test State Updates

Temporarily add buttons to test state updates:

```javascript
<button onClick={() => setMoves(moves + 1)}>Add Move</button>
<button onClick={() => setIsWon(true)}>Test Win</button>
```

Click them and verify the UI updates. Remove them after testing.

### Expected Result

You should have:

- Tiles stored in state
- Ability to click tiles (console logs the index)
- Move counter displayed
- Win message that can be toggled
- Understanding of how state updates cause re-renders

### Checkpoint Questions

Before moving to Phase 4, make sure you understand:

- **What is state and how is it different from props?** State is internal, changeable data managed by a component. Props are external, read-only data passed from a parent.
- **How do you create state with `useState`?** Call `useState(initialValue)` and destructure the result: `const [value, setValue] = useState(0);`
- **How do you update state?** Call the setter function: `setValue(newValue)` or `setValue(prev => prev + 1)` for updates based on previous state.
- **Why should you never mutate state directly?** React won't detect the change and won't re-render. Always create new objects/arrays.
- **Why should state live in the parent component for Slidemoji?** The Board needs to manage all tiles together to implement game logic (swapping, win detection).
- **What happens when you call a state setter function?** React schedules a re-render with the new state value. The component function runs again with the updated state.

## Understanding Re-renders

When state changes, React re-renders the component:

1. You click a tile
2. `handleTileClick` is called
3. State update function is called (e.g., `setMoves`)
4. React re-runs your component function
5. New JSX is generated with updated values
6. React efficiently updates only what changed in the DOM

This is React's core power: you describe what the UI should look like for any state, and React handles the updates!

## Next Steps

You have state managing your game data, and you can detect clicks. Now you need to implement the actual game logic: which tiles can move, how to swap them, and how to detect a win!

Continue to `tutorial/04-events-and-logic.md` →
