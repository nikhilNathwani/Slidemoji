# Troubleshooting Guide

Common issues you might encounter while building Slidemoji and how to fix them.

## Setup Issues

### `npx create-react-app` is slow

**Solution:**

- Be patient - it downloads and installs many packages
- Make sure you have a good internet connection
- Try clearing npm cache: `npm cache clean --force`

### `command not found: npm`

**Problem:** Node.js/npm not installed

**Solution:**

1. Download and install Node.js from [nodejs.org](https://nodejs.org)
2. Restart your terminal
3. Verify: `node --version` and `npm --version`

### Port 3000 already in use

**Problem:** Another app is using port 3000

**Solution:**

- Kill the process: On Mac/Linux: `lsof -ti:3000 | xargs kill -9`
- Or run on different port: `PORT=3001 npm start`

## Component Issues

### Component not rendering

**Check:**

```javascript
// ✅ Make sure to export
export default MyComponent;

// ✅ Import correctly
import MyComponent from "./components/MyComponent";

// ✅ Use in JSX
<MyComponent />;
```

### "Adjacent JSX elements must be wrapped"

**Problem:**

```javascript
return (
  <div>First</div>
  <div>Second</div>
);
```

**Solution:** Wrap in a parent element

```javascript
return (
	<div>
		<div>First</div>
		<div>Second</div>
	</div>
);

// Or use Fragment
return (
	<>
		<div>First</div>
		<div>Second</div>
	</>
);
```

### Component name must start with capital letter

**Problem:**

```javascript
function myComponent() {} // ❌
<myComponent />; // React thinks this is HTML
```

**Solution:**

```javascript
function MyComponent() {} // ✅
<MyComponent />;
```

## Props Issues

### Props are undefined

**Check:**

```javascript
// Make sure you're passing them
<Tile emoji="🎨" />;

// Make sure you're receiving them
function Tile(props) {
	console.log(props); // Debug: see what you're getting
	return <div>{props.emoji}</div>;
}

// Or destructure
function Tile({ emoji }) {
	return <div>{emoji}</div>;
}
```

### Props not updating

**Remember:** Props are read-only!

```javascript
// ❌ Wrong - can't change props
function Tile(props) {
  props.emoji = "🌟";  // This won't work!
}

// ✅ Correct - state lives in parent
function Board() {
  const [tiles, setTiles] = useState([...]);
  // Change tiles here, pass new values as props
}
```

### Passing numbers/booleans as props

**Remember:** Use curly braces for non-strings

```javascript
// ❌ Wrong - these are strings
<Tile position="5" isGap="true" />

// ✅ Correct - these are number and boolean
<Tile position={5} isGap={true} />
```

## State Issues

### State not updating

**Problem:** Mutating state directly

```javascript
// ❌ Wrong
const [items, setItems] = useState([1, 2, 3]);
items.push(4); // Mutating!
setItems(items); // React won't detect this change
```

**Solution:** Create new array/object

```javascript
// ✅ Correct
setItems([...items, 4]); // New array

// For objects
setUser({ ...user, name: "New Name" }); // New object
```

### State updates not immediate

**Problem:**

```javascript
setCount(count + 1);
console.log(count); // Still shows old value!
```

**Why:** State updates are asynchronous

**Solution:**

```javascript
const newCount = count + 1;
setCount(newCount);
console.log(newCount); // Shows new value
```

### Multiple state updates not working

**Problem:**

```javascript
setCount(count + 1);
setCount(count + 1);
// Only increments by 1!
```

**Solution:** Use functional update

```javascript
setCount((prev) => prev + 1);
setCount((prev) => prev + 1);
// Increments by 2!
```

### "Too many re-renders"

**Problem:** Infinite loop

```javascript
// ❌ Wrong - calls immediately, triggers re-render, infinite loop
<button onClick={handleClick()}>Click</button>;

// ❌ Wrong - state update causes re-render, triggers effect, infinite loop
useEffect(() => {
	setCount(count + 1);
}, [count]);
```

**Solution:**

```javascript
// ✅ Pass function reference
<button onClick={handleClick}>Click</button>;

// ✅ Don't update the dependency
useEffect(() => {
	setCount(count + 1);
}, []); // Or remove count from dependencies
```

## Event Handler Issues

### onClick not working

**Check:**

```javascript
// ❌ Wrong - calling function immediately
<button onClick={handleClick()}>

// ✅ Correct - passing function reference
<button onClick={handleClick}>

// ✅ Correct - arrow function
<button onClick={() => handleClick()}>

// ✅ Correct - with parameter
<button onClick={() => handleClick(id)}>
```

### Can't pass parameter to event handler

**Problem:**

```javascript
// This won't work as expected
<button onClick={handleClick(id)}>
```

**Solution:**

```javascript
// Use arrow function
<button onClick={() => handleClick(id)}>

// Or in map
{items.map((item, index) => (
  <div onClick={() => handleClick(index)}>
))}
```

### Event handler not getting event object

**Issue:**

```javascript
<input onChange={handleChange()} /> // ❌ No event object
```

**Solution:**

```javascript
<input onChange={handleChange} />  // ✅ Gets event automatically

// Or
<input onChange={(e) => handleChange(e)} />  // ✅ Explicit
```

## useEffect Issues

### Effect runs on every render

**Problem:**

```javascript
useEffect(() => {
	// Runs every render
});
```

**Solution:** Add dependency array

```javascript
// Run once on mount
useEffect(() => {
	// code
}, []);

// Run when value changes
useEffect(() => {
	// code
}, [value]);
```

### Effect runs too many times

**Problem:** Missing or incorrect dependencies

**Solution:**

```javascript
// Include ALL values from component scope that effect uses
useEffect(() => {
	console.log(count, name);
}, [count, name]); // Include both!
```

### Memory leaks with timers

**Problem:**

```javascript
useEffect(() => {
	setInterval(() => {
		// Timer keeps running after component unmounts!
	}, 1000);
}, []);
```

**Solution:** Clean up

```javascript
useEffect(() => {
	const timer = setInterval(() => {
		// code
	}, 1000);

	return () => clearInterval(timer); // Cleanup!
}, []);
```

## Styling Issues

### CSS classes not applying

**Check:**

```javascript
// ❌ Wrong - 'class' doesn't work in React
<div class="tile">

// ✅ Correct - use 'className'
<div className="tile">
```

### Styles not updating

**Check:**

- File is imported: `import './App.css';`
- CSS file is saved
- Browser cache - try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
- Check browser DevTools to see if styles are applied

### Inline styles syntax

**Remember:** JavaScript object, camelCase properties

```javascript
// ❌ Wrong
<div style="background-color: blue;">

// ✅ Correct
<div style={{ backgroundColor: 'blue', padding: '20px' }}>
```

## Game Logic Issues

### Tiles not swapping

**Debug:**

```javascript
function handleTileClick(index) {
	console.log("Clicked index:", index);

	const gapIndex = tiles.indexOf(null);
	console.log("Gap index:", gapIndex);

	const adjacent = isAdjacent(index, gapIndex, 3);
	console.log("Is adjacent?", adjacent);

	// ... rest of logic
}
```

### Win detection not working

**Debug:**

```javascript
function checkWin(tiles, solvedState) {
	console.log("Checking win:");
	console.log("Current:", tiles);
	console.log("Solved:", solvedState);

	for (let i = 0; i < tiles.length; i++) {
		console.log(
			`Position ${i}: ${tiles[i]} === ${solvedState[i]}?`,
			tiles[i] === solvedState[i],
		);
	}

	return tiles.every((tile, i) => tile === solvedState[i]);
}
```

### Grid math issues

**Test your calculations:**

```javascript
// For 3x3 grid (indices 0-8)
const gridSize = 3;

// Test index 5
const index = 5;
const row = Math.floor(index / gridSize); // Should be 1
const col = index % gridSize; // Should be 2

console.log(`Index ${index}: row ${row}, col ${col}`);

// Layout:
// 0 1 2  (row 0, cols 0-2)
// 3 4 5  (row 1, cols 0-2)
// 6 7 8  (row 2, cols 0-2)
```

### Adjacent check not working

**Test it:**

```javascript
function isAdjacent(idx1, idx2, gridSize) {
	const row1 = Math.floor(idx1 / gridSize);
	const col1 = idx1 % gridSize;
	const row2 = Math.floor(idx2 / gridSize);
	const col2 = idx2 % gridSize;

	console.log(`Index ${idx1}: (${row1}, ${col1})`);
	console.log(`Index ${idx2}: (${row2}, ${col2})`);

	const horizontal = row1 === row2 && Math.abs(col1 - col2) === 1;
	const vertical = col1 === col2 && Math.abs(row1 - row2) === 1;

	console.log(`Horizontal? ${horizontal}, Vertical? ${vertical}`);

	return horizontal || vertical;
}

// Test cases:
isAdjacent(4, 1, 3); // Should be true (vertical)
isAdjacent(4, 3, 3); // Should be true (horizontal)
isAdjacent(4, 8, 3); // Should be false (diagonal)
isAdjacent(0, 8, 3); // Should be false (opposite corners)
```

## List Rendering Issues

### "Each child should have unique key prop"

**Problem:**

```javascript
{
	items.map((item) => (
		<div>{item}</div> // ❌ Missing key
	));
}
```

**Solution:**

```javascript
{
	items.map((item, index) => (
		<div key={index}>{item}</div> // ✅ Has key
	));
}

// Better: use unique ID if available
{
	items.map((item) => <div key={item.id}>{item.name}</div>);
}
```

### List not updating

**Make sure you're creating a new array:**

```javascript
// ❌ Wrong - mutating
items.push(newItem);
setItems(items);

// ✅ Correct - new array
setItems([...items, newItem]);
```

## Console Errors

### "Cannot read property 'X' of undefined"

**Problem:** Trying to access property of undefined/null

```javascript
const [user, setUser] = useState(null);
return <div>{user.name}</div>; // ❌ user is null!
```

**Solution:** Check before accessing

```javascript
return <div>{user ? user.name : "Loading..."}</div>;
// Or
return <div>{user?.name}</div>; // Optional chaining
```

### "X is not defined"

**Problem:** Using variable that doesn't exist

**Check:**

- Is it imported?
- Is it in scope?
- Is it spelled correctly (JavaScript is case-sensitive!)

### Module not found

**Problem:** Import path is wrong

```javascript
// ❌ Wrong path
import Tile from "./Tile"; // Tile.js is in components/

// ✅ Correct path
import Tile from "./components/Tile";
```

## Debugging Strategies

### 1. Console.log Everything

```javascript
function MyComponent({ data }) {
	console.log("Component rendered");
	console.log("Props:", data);

	const [state, setState] = useState(0);
	console.log("State:", state);

	useEffect(() => {
		console.log("Effect ran");
	}, [data]);

	return <div>{data}</div>;
}
```

### 2. Use React DevTools

Install the browser extension:

- Chrome: Search "React Developer Tools" in Chrome Web Store
- Firefox: Search in Firefox Add-ons

Features:

- Inspect component tree
- View props and state
- Track which components re-render
- Profile performance

### 3. Isolate the Problem

Create a minimal reproduction:

```javascript
// Simplify component to bare minimum
function TestComponent() {
	const [count, setCount] = useState(0);
	console.log("Render:", count);

	return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 4. Comment Out Code

```javascript
function handleClick() {
	// console.log('Starting');
	// doSomething();
	console.log("This line works"); // Test which line breaks
	// doSomethingElse();
}
```

### 5. Check the Browser Console

- Open DevTools (F12 or Cmd+Option+I)
- Check Console tab for errors
- Red errors are problems you need to fix
- Warnings (yellow) are issues you should address

### 6. Read Error Messages Carefully

React error messages often tell you exactly what's wrong:

- "Cannot update during existing state transition" → You're calling setState during render
- "Maximum update depth exceeded" → Infinite loop
- "Hook called outside of component" → Hooks must be inside component functions

## Still Stuck?

1. **Re-read the tutorial section** - carefully follow each step
2. **Check your code against examples** - look for differences
3. **Search the error message** - someone probably had the same issue
4. **Take a break** - fresh eyes see bugs more easily
5. **Start fresh** - sometimes it's faster to rebuild the component

## Helpful Resources

- **React Docs:** https://react.dev
- **Stack Overflow:** Search for your error message
- **React Discord:** Community help
- **MDN Web Docs:** JavaScript reference

Remember: Every developer encounters these issues. Debugging is a skill that improves with practice! 🐛🔍
