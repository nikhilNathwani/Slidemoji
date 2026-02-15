# Phase 2: Props - Component Communication

## What are Props?

**[Props](https://react.dev/learn/passing-props-to-a-component)** (short for "properties") are how you pass data from a parent component to a child component. Think of them like function arguments.

### Why Props?

Without props, every tile would be identical. Props let you customize each instance of a component.

📚 **Learn more:** [Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)

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

**What if you destructure a prop that doesn't exist?** It becomes `undefined`, which is safe! React will just render nothing for `{undefinedValue}`. Your IDE (like VS Code with proper extensions) can warn you about typos. You can also provide default values: `function Greeting({ name = "Guest" })` - now if no name is passed, it uses "Guest".

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

### Why Can't You Modify Props?

1. **Single Source of Truth**: The data lives in the parent. If children could change props, you'd have multiple places managing the same data, making bugs hard to track.

2. **Predictable Data Flow**: With one-way data flow (parent → child), you always know where data comes from. If something's wrong, you check the parent.

3. **Reusability**: Components that don't modify their props are "pure" - they always render the same output for the same input, making them easier to test and reuse.

If you need to change something based on props, use state in the parent and pass new props down!

📚 **Learn more:** [Props are read-only snapshots](https://react.dev/learn/passing-props-to-a-component#how-props-change-over-time)

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

When rendering multiple components, use [`.map()`](https://react.dev/learn/rendering-lists):

📚 **Learn more:** [Rendering Lists](https://react.dev/learn/rendering-lists)

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

Modify `src/components/Tile.jsx` to accept props:

1. Accept a `value` prop (the number/emoji to display)
2. Accept an `isGap` prop (boolean - is this the empty space?)
3. If `isGap` is true, render an empty tile with a different class
4. Otherwise, display the value

**Why render the gap as a tile?** You might think an empty space makes more sense, but representing the gap as a tile has benefits:

- **Consistent grid structure** - Always 9 tiles, simpler array logic
- **Visual feedback** - You can style the gap (dashed border, subtle background) to show where tiles can slide
- **Easier animations** - When you animate tiles sliding, the gap acts as a visual placeholder. The actual numbered tiles move into the gap's position in the CSS Grid.

**Hint:** Use destructuring and conditional rendering

Example:

```javascript
function Tile({ value, isGap, onClick }) {
	if (isGap) {
		return <div className="tile tile-gap" onClick={onClick}></div>;
	}

	return (
		<div className="tile" onClick={onClick}>
			{value}
		</div>
	);
}
```

### Task 2: Create Tile Data

In `src/components/Board.jsx`:

1. Create an array of 9 items representing your puzzle
2. For learning, use numbers 1-8 and one `null` (for the gap)
3. Example: `[1, 2, 3, 4, 5, 6, 7, 8, null]`

**Want emojis instead?** Just use: `['🎨', '🌟', '🎭', '🎪', '🎯', '🎲', '🎸', '🎹', null]`

Numbers are easier to see the puzzle state while learning!

### Task 3: Render Tiles with Props

In `Board.jsx`:

1. Use `.map()` to render a `Tile` for each item in your array
2. Pass each value as a prop
3. Pass `isGap={true}` when the item is `null`
4. Don't forget the `key` prop! (Use the index for now)

Example structure:

```javascript
function Board() {
	const tiles = [1, 2, 3, 4, 5, 6, 7, 8, null];

	return (
		<div className="board">
			{tiles.map((value, index) => (
				<Tile key={index} value={value} isGap={value === null} />
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
2. In `Tile.jsx`, display the position in the corner of each tile (small text)
3. Remove this later when your game works!

### Expected Result

You should now see:

- 9 tiles in a 3x3 grid
- 8 tiles with different numbers (or emojis if you chose those)
- 1 tile that's the gap (empty or styled differently)
- Each tile is unique based on the props it receives

### Checkpoint Questions

Before moving to Phase 3, make sure you understand:

- **What are props and why do we need them?** Props are how you pass data from parent to child components. Without them, every component instance would be identical.
- **How do you pass props to a component?** Like HTML attributes: `<Tile emoji="🎨" position={5} />`
- **How do you receive and use props in a component?** As the first parameter: `function Tile(props)` or with destructuring: `function Tile({ emoji, position })`
- **Why can't you modify props?** They're read-only to maintain predictable one-way data flow. The parent owns the data, child components just display it.
- **What is the `key` prop used for when rendering lists?** React uses it to track which items changed, were added, or removed, preventing bugs and improving performance.
- **What is destructuring and why is it useful?** Unpacking values from an object: `{ emoji, position }` is cleaner than writing `props.emoji` and `props.position` everywhere.

## Understanding Data Flow

Take a moment to understand what's happening:

```
App
 └─ Board (has the tile data array)
     └─ Tile (receives emoji and isGap as props)
         └─ Renders different UI based on props
```

Data flows **down**: Board tells each Tile what to display. Tiles can't change their own value - that data lives in Board.

But what if we want clicks on tiles to change the board? That requires **state**, which makes data dynamic!

## Next Steps

You've learned how to pass data down through props. But your tiles are still static. How do we make them interactive and changeable? That's where **state** comes in!

Continue to `tutorial/03-state.md` →
