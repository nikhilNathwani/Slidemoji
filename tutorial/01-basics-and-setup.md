# Phase 1: React Basics & Project Setup

## What is React?

React is a JavaScript library for building user interfaces. Think of it as a tool that helps you:

- Build reusable UI components (like LEGO blocks)
- Efficiently update the page when data changes
- Organize your code in a clean, maintainable way

### Key Concepts

**Component:** A reusable piece of UI. Everything in React is a component.
**JSX:** JavaScript XML - lets you write HTML-like syntax in JavaScript.
**Props:** Data passed from parent to child components.
**State:** Data that changes over time within a component.

## Setting Up Your Project

### Step 1: Create a React App

Open your terminal in the Slidemoji project directory and run:

```bash
npx create-react-app .
```

This creates a new React project with all the necessary tooling configured.

### Step 2: Clean Up the Template

After installation completes, clean up the starter files:

1. Delete these files from the `src` folder:
    - `App.test.js`
    - `logo.svg`
    - `reportWebVitals.js`
    - `setupTests.js`

2. Clear out `src/App.css` - we'll write our own styles

3. Replace `src/App.js` with a simple starting point (we'll guide you on this)

4. Simplify `src/index.js` by removing the reportWebVitals code

### Step 3: Start the Development Server

```bash
npm start
```

This opens your app in the browser at `http://localhost:3000`. Any changes you make will automatically refresh the page!

## Understanding JSX

JSX looks like HTML but it's actually JavaScript. Here's an example:

```javascript
const greeting = <h1>Hello, React!</h1>;
```

### JSX Rules

1. **Return a single parent element**

    ```javascript
    // ❌ Wrong - multiple root elements
    return (
      <h1>Title</h1>
      <p>Paragraph</p>
    );

    // ✅ Correct - wrapped in a parent div
    return (
      <div>
        <h1>Title</h1>
        <p>Paragraph</p>
      </div>
    );
    ```

2. **Use `className` instead of `class`**

    ```javascript
    <div className="container">Content</div>
    ```

3. **Close all tags**

    ```javascript
    <img src="photo.jpg" />
    <input type="text" />
    ```

4. **Use camelCase for attributes**

    ```javascript
    <button onClick={handleClick}>Click me</button>
    ```

5. **Embed JavaScript with curly braces**
    ```javascript
    const name = "Alice";
    return <h1>Hello, {name}!</h1>;
    ```

## Your First Component

A React component is a function that returns JSX.

### Example: A Simple Button

```javascript
function MyButton() {
	return <button>Click me</button>;
}
```

That's it! This is a valid React component.

### Using Your Component

To use a component, write it like an HTML tag:

```javascript
function App() {
	return (
		<div>
			<h1>My App</h1>
			<MyButton />
			<MyButton />
		</div>
	);
}
```

Notice:

- Component names **must** start with a capital letter
- Components can be reused multiple times
- Self-closing tags are fine if there's no content inside

### Component Files

Best practice: one component per file.

Create `src/components/MyButton.js`:

```javascript
function MyButton() {
	return <button>Click me</button>;
}

export default MyButton;
```

Then import it in `src/App.js`:

```javascript
import MyButton from "./components/MyButton";

function App() {
	return (
		<div>
			<MyButton />
		</div>
	);
}

export default App;
```

## 🛠️ BUILD: Your First Slidemoji Components

Now it's your turn! Here's what to build:

### Task 1: Clean Up App.js

1. Open `src/App.js`
2. Replace it with a simple component that renders a heading "Slidemoji" and a subtitle explaining the game
3. Use semantic HTML: `<header>`, `<main>`, etc.

### Task 2: Create a Tile Component

1. Create a new folder: `src/components`
2. Create `src/components/Tile.js`
3. Make a component that returns a `<div>` styled as a square tile
4. For now, just display the text "🎨" (or any emoji) inside
5. Add a `className` to use for styling

Example structure (don't look until you've tried!):

```javascript
function Tile() {
	return <div className="tile">🎨</div>;
}

export default Tile;
```

### Task 3: Create a Board Component

1. Create `src/components/Board.js`
2. This component should render a `<div>` that will contain all your tiles
3. Import and render 9 `<Tile />` components (for a 3x3 grid)
4. Add a `className="board"` for styling

### Task 4: Compose Your App

1. In `src/App.js`, import your `Board` component
2. Render it in your app's main section

### Task 5: Add Basic Styling

In `src/App.css`, add styles to make your board look like a grid:

```css
.board {
	display: grid;
	grid-template-columns: repeat(3, 100px);
	grid-template-rows: repeat(3, 100px);
	gap: 5px;
	/* Add styling to center it, add background, etc. */
}

.tile {
	/* Make it look like a tile: background, border, center the emoji */
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40px;
	/* Add your own creative touches! */
}
```

### Expected Result

You should see:

- A page with "Slidemoji" at the top
- A 3x3 grid below it
- Each square showing an emoji
- Clean, centered layout

### Checkpoint Questions

Before moving to Phase 2, make sure you understand:

- What is a component?
- What is JSX?
- How do you create and use a component?
- Why do component names start with a capital letter?
- What does `export default` do?

## Next Steps

Great job! You've created the visual foundation of your game. But right now, all tiles are identical. How do we make each tile different? That's what **props** are for!

Continue to `tutorial/02-props.md` →
