# Phase 2: Props - Component Communication

## What are Props?

**Props** (short for "properties") are how you pass data from a parent component to a child component. Think of them like function arguments.

### Why Props?

Without props, every tile would be identical. Props let you customize each instance of a component.

## Basic Props Example

### Passing Props

```javascript
function App() {
	return (
		<div>
			<Greeting name="Alice" />
			<Greeting name="Bob" />
		</div>
	);
}
```

### Receiving Props

```javascript
function Greeting(props) {
	return <h1>Hello, {props.name}!</h1>;
}
```

The `props` parameter is an **object** containing all the props passed to the component:

```javascript
props = {
	name: "Alice",
};
```

## Destructuring Props

Instead of writing `props.name` everywhere, you can destructure:

```javascript
// Before
function Greeting(props) {
	return <h1>Hello, {props.name}!</h1>;
}

// After (cleaner!)
function Greeting({ name }) {
	return <h1>Hello, {name}!</h1>;
}
```

You can destructure multiple props:

```javascript
function UserCard({ name, age, email }) {
	return (
		<div>
			<h2>{name}</h2>
			<p>Age: {age}</p>
			<p>Email: {email}</p>
		</div>
	);
}

// Usage
<UserCard name="Alice" age={30} email="alice@example.com" />;
```

## Props Can Be Any Type

### Strings

```javascript
<Tile emoji="🎨" />
```

### Numbers

```javascript
<Tile position={5} />
```

### Booleans

```javascript
<Tile isGap={true} />
```

### Arrays

```javascript
<Board tiles={["🎨", "🌟", "🎭"]} />
```

### Objects

```javascript
<Tile data={{ emoji: "🎨", position: 5 }} />
```

### Functions

```javascript
<Tile onClick={handleClick} />
```

**Important:** For non-string props, use curly braces: `{value}` not `"value"`

## Props are Read-Only

A component **cannot modify** its own props. Props flow **one way**: from parent to child.

```javascript
// ❌ WRONG - Never do this!
function Tile(props) {
	props.emoji = "🎭"; // This won't work and breaks React rules
	return <div>{props.emoji}</div>;
}

// ✅ CORRECT - Props are read-only
function Tile({ emoji }) {
	return <div>{emoji}</div>;
}
```

Why? This makes React predictable. Data flows down, making it easy to track where data comes from.

## Conditional Rendering with Props

You can use props to decide what to render:

```javascript
function Tile({ isGap, emoji }) {
	if (isGap) {
		return <div className="tile tile-gap"></div>;
	}

	return <div className="tile">{emoji}</div>;
}
```

Or use a ternary operator:

```javascript
function Tile({ isGap, emoji }) {
	return (
		<div className={isGap ? "tile tile-gap" : "tile"}>
			{isGap ? "" : emoji}
		</div>
	);
}
```

## Default Props

You can provide default values using destructuring:

```javascript
function Tile({ emoji = "❓", size = 100 }) {
	return <div style={{ width: size, height: size }}>{emoji}</div>;
}

// If no emoji prop is passed, it uses "❓"
<Tile size={120} />;
```

## Props vs Attributes

JSX props work like HTML attributes, but with superpowers:

```javascript
// HTML
<img src="photo.jpg" alt="A photo" />

// React JSX (attributes are props)
<img src={photoUrl} alt={description} />

// Your custom component
<Tile emoji="🎨" position={5} />
```

## Rendering Lists with Props

When rendering multiple components, use `.map()`:

```javascript
function Board() {
	const emojis = ["🎨", "🌟", "🎭", "🎪", "🎯", "🎲", "🎸", "🎹"];

	return (
		<div className="board">
			{emojis.map((emoji, index) => (
				<Tile key={index} emoji={emoji} />
			))}
		</div>
	);
}
```

### The `key` Prop

Notice the `key` prop? It's special:

- React uses it to track which items changed, were added, or removed
- Must be unique among siblings
- Usually use an ID from your data; `index` works for static lists

```javascript
// ✅ Good - stable IDs
{
	todos.map((todo) => <TodoItem key={todo.id} text={todo.text} />);
}

// ⚠️ OK for static lists
{
	emojis.map((emoji, index) => <Tile key={index} emoji={emoji} />);
}
```

## Props Drilling

When you need to pass props through multiple levels:

```javascript
function App() {
	const boardSize = 3;
	return <Game boardSize={boardSize} />;
}

function Game({ boardSize }) {
	return <Board boardSize={boardSize} />;
}

function Board({ boardSize }) {
	// Now Board can use boardSize
}
```

This is called "prop drilling". It's fine for small apps. (Later you'll learn about Context and state management for complex apps.)

## 🛠️ BUILD: Make Your Tiles Unique

Time to use props in Slidemoji!

### Task 1: Update Tile Component

Modify `src/components/Tile.js` to accept props:

1. Accept an `emoji` prop (the emoji/image to display)
2. Accept an `isGap` prop (boolean - is this the empty space?)
3. If `isGap` is true, render an empty tile with a different class
4. Otherwise, display the emoji

**Hint:** Use destructuring and conditional rendering

### Task 2: Create Tile Data

In `src/components/Board.js`:

1. Create an array of 9 items representing your puzzle
2. Use 8 different emojis and one `null` (for the gap)
3. Example: `['🎨', '🌟', '🎭', '🎪', '🎯', '🎲', '🎸', '🎹', null]`

### Task 3: Render Tiles with Props

In `Board.js`:

1. Use `.map()` to render a `Tile` for each item in your array
2. Pass each emoji as a prop
3. Pass `isGap={true}` when the item is `null`
4. Don't forget the `key` prop! (Use the index for now)

Example structure:

```javascript
function Board() {
	const tiles = [
		/* your emoji array */
	];

	return (
		<div className="board">
			{tiles.map((emoji, index) => (
				<Tile key={index} emoji={emoji} isGap={emoji === null} />
			))}
		</div>
	);
}
```

### Task 4: Style the Gap

In `src/App.css`, add a style for `.tile-gap`:

```css
.tile-gap {
	background-color: #f0f0f0; /* Or make it transparent */
	border: 2px dashed #ccc;
}
```

### Task 5: Add Tile Positions (Optional Challenge)

For debugging and learning, add a `position` prop to each tile:

1. Pass the index as `position={index}`
2. In `Tile.js`, display the position in the corner of each tile (small text)
3. Remove this later when your game works!

### Expected Result

You should now see:

- 9 tiles in a 3x3 grid
- 8 tiles with different emojis
- 1 tile that's the gap (empty or styled differently)
- Each tile is unique based on the props it receives

### Checkpoint Questions

Before moving to Phase 3, make sure you understand:

- What are props and why do we need them?
- How do you pass props to a component?
- How do you receive and use props in a component?
- Why can't you modify props?
- What is the `key` prop used for when rendering lists?
- What is destructuring and why is it useful?

## Understanding Data Flow

Take a moment to understand what's happening:

```
App
 └─ Board (has the tile data array)
     └─ Tile (receives emoji and isGap as props)
         └─ Renders different UI based on props
```

Data flows **down**: Board tells each Tile what to display. Tiles can't change their own emoji - that data lives in Board.

But what if we want clicks on tiles to change the board? That requires **state**, which makes data dynamic!

## Next Steps

You've learned how to pass data down through props. But your tiles are still static. How do we make them interactive and changeable? That's where **state** comes in!

Continue to `tutorial/03-state.md` →
