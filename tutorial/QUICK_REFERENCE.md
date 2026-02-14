# React Concepts Quick Reference

A handy reference for all the React concepts covered in this tutorial.

## Core Concepts

### Components

Reusable pieces of UI. Functions that return JSX.

```javascript
function MyComponent() {
	return <div>Hello!</div>;
}
```

**Rules:**

- Must start with capital letter
- Must return JSX (or null)
- One component per file is best practice

### JSX

JavaScript XML - write HTML-like syntax in JavaScript.

```javascript
const element = <h1>Hello, {name}!</h1>;
```

**Rules:**

- Return single parent element
- Use `className` not `class`
- Close all tags: `<img />`, `<input />`
- Use camelCase for attributes: `onClick`, `backgroundColor`
- Embed JS with curly braces: `{variable}`

### Props

Data passed from parent to child. Read-only.

```javascript
// Passing props
<Greeting name="Alice" age={30} />;

// Receiving props
function Greeting({ name, age }) {
	return (
		<p>
			Hello {name}, you are {age}
		</p>
	);
}
```

**Key points:**

- Flow down (parent to child)
- Cannot be modified by child
- Can be any type: string, number, boolean, array, object, function
- Use destructuring for cleaner code

### State

Data that changes over time. Managed within component.

```javascript
import { useState } from "react";

function Counter() {
	const [count, setCount] = useState(0);

	return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Key points:**

- Local to component
- Triggers re-render when updated
- Update with setter function, never directly
- Updates are asynchronous
- Use functional update when new state depends on old: `setCount(c => c + 1)`

### Events

Respond to user interactions.

```javascript
function Button() {
  function handleClick(event) {
    console.log('Clicked!');
  }

  return <button onClick={handleClick}>Click</button>;
}

// With parameters
<button onClick={() => handleClick(id)}>Delete</button>

// With event object
<input onChange={(e) => setValue(e.target.value)} />
```

**Common events:**

- `onClick` - clicking
- `onChange` - input changes
- `onSubmit` - form submission
- `onMouseEnter`, `onMouseLeave` - hover
- `onKeyDown`, `onKeyPress` - keyboard

## Hooks

Functions that let you use React features. Must start with `use`.

### useState

Add state to component.

```javascript
const [value, setValue] = useState(initialValue);
```

**Examples:**

```javascript
const [count, setCount] = useState(0);
const [name, setName] = useState("");
const [isOpen, setIsOpen] = useState(false);
const [items, setItems] = useState([]);
const [user, setUser] = useState({ name: "", age: 0 });
```

### useEffect

Perform side effects.

```javascript
useEffect(() => {
	// Effect code

	return () => {
		// Cleanup (optional)
	};
}, [dependencies]);
```

**Dependency patterns:**

```javascript
// Run on every render
useEffect(() => {});

// Run once on mount
useEffect(() => {}, []);

// Run when value changes
useEffect(() => {}, [value]);

// Run when any dependency changes
useEffect(() => {}, [val1, val2, val3]);
```

**Common uses:**

- Fetching data
- Setting up timers/subscriptions
- Updating document title
- Reading from/writing to localStorage
- Scrambling puzzle on mount

### Custom Hooks

Extract reusable logic.

```javascript
function useTimer(isRunning) {
	const [seconds, setSeconds] = useState(0);

	useEffect(() => {
		if (!isRunning) return;

		const timer = setInterval(() => {
			setSeconds((s) => s + 1);
		}, 1000);

		return () => clearInterval(timer);
	}, [isRunning]);

	return seconds;
}

// Usage
const seconds = useTimer(!isWon);
```

## Patterns

### Conditional Rendering

```javascript
// If/else
if (isLoading) return <Spinner />;
return <Content />;

// Ternary
{
	isLoggedIn ? <Dashboard /> : <Login />;
}

// Logical AND
{
	error && <ErrorMessage />;
}
{
	items.length > 0 && <List items={items} />;
}
```

### Rendering Lists

```javascript
{
	items.map((item) => <Item key={item.id} data={item} />);
}

// With index (only if no unique ID)
{
	items.map((item, index) => <Item key={index} data={item} />);
}
```

**Always include `key` prop!**

### Controlled Components

Form inputs controlled by React state.

```javascript
function Form() {
	const [name, setName] = useState("");

	return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

### Lifting State Up

Move state to common parent when multiple components need it.

```
Before:                After:
ComponentA (state)     Parent (state)
ComponentB (needs)        ├─ ComponentA (prop)
                         └─ ComponentB (prop)
```

### Composition

Build complex UIs from simple components.

```javascript
function App() {
	return (
		<Container>
			<Header />
			<Main>
				<Sidebar />
				<Content />
			</Main>
			<Footer />
		</Container>
	);
}
```

## State Update Patterns

### Simple Updates

```javascript
setCount(5);
setName("Alice");
setIsOpen(true);
```

### Functional Updates

Use when new state depends on old state.

```javascript
setCount((prevCount) => prevCount + 1);
setItems((prevItems) => [...prevItems, newItem]);
```

### Object Updates

Spread to preserve other properties.

```javascript
setUser((prevUser) => ({
	...prevUser,
	name: "New Name",
}));
```

### Array Updates

Never mutate - create new arrays.

```javascript
// Add item
setItems([...items, newItem]);
setItems([newItem, ...items]); // Add to start

// Remove item
setItems(items.filter((item) => item.id !== id));

// Update item
setItems(
	items.map((item) => (item.id === id ? { ...item, done: true } : item)),
);

// Replace item
const newItems = [...items];
newItems[index] = newValue;
setItems(newItems);
```

## Common Mistakes

### ❌ Calling Functions Immediately

```javascript
// Wrong - calls immediately on render
<button onClick={handleClick()}>

// Correct - passes function reference
<button onClick={handleClick}>
<button onClick={() => handleClick()}>
```

### ❌ Mutating State

```javascript
// Wrong - mutates state
items.push(newItem);
setItems(items);

// Correct - creates new array
setItems([...items, newItem]);
```

### ❌ Missing Dependencies

```javascript
// Wrong - count not in dependencies
useEffect(() => {
	console.log(count);
}, []);

// Correct
useEffect(() => {
	console.log(count);
}, [count]);
```

### ❌ Lowercase Component Names

```javascript
// Wrong
function myComponent() {}

// Correct
function MyComponent() {}
```

### ❌ Multiple Root Elements

```javascript
// Wrong
return (
  <div>First</div>
  <div>Second</div>
);

// Correct
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

## Styling Methods

### CSS Classes

```javascript
import "./Component.css";

function Component() {
	return <div className="container">Content</div>;
}
```

### Inline Styles

```javascript
<div style={{
  backgroundColor: 'blue',
  padding: '20px',
  borderRadius: '8px'
}}>
```

### Conditional Classes

```javascript
<div className={isActive ? 'active' : 'inactive'}>
<div className={`base ${isActive ? 'active' : ''}`}>
```

## Performance

### React.memo

Prevent re-renders if props haven't changed.

```javascript
import { memo } from "react";

const MyComponent = memo(function MyComponent({ data }) {
	return <div>{data}</div>;
});
```

### useCallback

Memoize function references.

```javascript
const handleClick = useCallback(() => {
	// handler code
}, [dependencies]);
```

### useMemo

Memoize calculated values.

```javascript
const expensiveValue = useMemo(() => {
	return calculateSomething(data);
}, [data]);
```

**Note:** Only optimize when needed!

## Debugging Tips

### Console Logging

```javascript
function Component({ data }) {
	console.log("Component rendered with:", data);

	useEffect(() => {
		console.log("Effect ran");
	}, [dependency]);

	return <div>{data}</div>;
}
```

### React DevTools

Install browser extension to:

- Inspect component tree
- View props and state
- Track re-renders
- Profile performance

### Common Issues

**State not updating immediately?**

- State updates are asynchronous
- Use the new value directly instead of reading state

**Infinite re-renders?**

- Check useEffect dependencies
- Don't call state setters unconditionally

**Component not re-rendering?**

- Make sure you're creating new objects/arrays, not mutating
- Check that keys are unique and stable

## Best Practices

1. **One component per file** - easier to maintain
2. **Destructure props** - cleaner code
3. **Use semantic HTML** - `<header>`, `<main>`, `<nav>`, etc.
4. **Keep components small** - easier to understand and test
5. **Extract helper functions** - outside component if they don't need state/props
6. **Name event handlers** - `handleClick`, `handleSubmit`, etc.
7. **Use functional updates** - when new state depends on old state
8. **Always use keys** - when rendering lists
9. **Don't optimize prematurely** - make it work first, then optimize
10. **Comment complex logic** - help your future self

## File Organization

```
src/
  components/
    ComponentName/
      ComponentName.js
      ComponentName.css
      ComponentName.test.js
  hooks/
    useCustomHook.js
  utils/
    helpers.js
    constants.js
  App.js
  App.css
  index.js
```

## Quick Links

- [React Docs](https://react.dev)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [MDN Web Docs](https://developer.mozilla.org)
- [JavaScript.info](https://javascript.info)

---

Keep this reference handy as you build your projects! 🚀
