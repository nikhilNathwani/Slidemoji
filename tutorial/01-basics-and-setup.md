# Phase 1: React Basics & Project Setup

## What is React?

[React](https://react.dev) is a JavaScript library for building user interfaces. Think of it as a tool that helps you:

- Build reusable UI components (like LEGO blocks)
- Efficiently update the page when data changes
- Organize your code in a clean, maintainable way

📚 **Learn more:** [React Quick Start](https://react.dev/learn)

### Key Concepts

**Component:** A reusable piece of UI. Everything in React is a component.
**JSX:** JavaScript XML - lets you write HTML-like syntax in JavaScript.
**Props:** Data passed from parent to child components.
**State:** Data that changes over time within a component.

## Setting Up Your Project

### Step 0: Check Your Node.js Version

**Important:** Vite requires Node.js version **20.19+** or **22.12+**.

Check your version:

```bash
node --version
```

If your version is below 20.19, upgrade Node.js:

- **Download latest:** [nodejs.org](https://nodejs.org/) (choose LTS version)
- **Or use nvm (recommended):**
    ```bash
    nvm install --lts
    nvm use --lts
    ```

After upgrading, verify:

```bash
node --version  # Should show v20.x.x or v22.x.x
```

### Step 1: Create a React App with Vite

**Note:** `create-react-app` is now deprecated. We'll use [Vite](https://vitejs.dev/), which is faster and the recommended way to start React projects in 2026.

Open your terminal in the Slidemoji project directory and run:

```bash
npm create vite@latest . -- --template react
```

When prompted:

- **"Current directory is not empty. Remove existing files and continue?"** → Type `y` (yes)
- This creates a new React project with Vite

Then install dependencies:

```bash
npm install
```

📚 **Learn more:** [Vite - Getting Started](https://vitejs.dev/guide/)

### Step 2: Clean Up the Template

After installation completes, clean up the starter files:

1. Delete these files from the `src` folder:
    - `App.css` (we'll recreate it)
    - `index.css` (we'll recreate it)
    - `assets/react.svg`

2. Create an empty `src/App.css` file - we'll write our own styles

3. Replace `src/App.jsx` with a simple starting point (we'll guide you on this)

4. Simplify `src/main.jsx` - it should look like this:

    ```javascript
    import React from "react";
    import ReactDOM from "react-dom/client";
    import App from "./App.jsx";
    import "./App.css";

    ReactDOM.createRoot(document.getElementById("root")).render(
    	<React.StrictMode>
    		<App />
    	</React.StrictMode>,
    );
    ```

**Note:** Vite uses `.jsx` file extensions instead of `.js` for files containing JSX. This is a best practice that makes it clear which files contain JSX syntax.

### Step 3: Start the Development Server

```bash
npm run dev
```

This opens your app in the browser at `http://localhost:5173`. Any changes you make will automatically refresh the page!

**Vite is faster than create-react-app** - you'll notice instant hot module replacement (changes appear in milliseconds)!

## Understanding JSX

[JSX](https://react.dev/learn/writing-markup-with-jsx) looks like HTML but it's actually JavaScript. Here's an example:

```javascript
const greeting = <h1>Hello, React!</h1>;
```

**Why JSX?** It lets you describe UI in a way that's easy to read and write, while still having the full power of JavaScript.

📚 **Learn more:** [Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx)

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

### Why Capital Letters?

React uses the capitalization to distinguish between HTML tags and custom components:

- `<button>` is a regular HTML button
- `<Button>` is your custom Button component

If you write `<myButton />` with lowercase, React will look for an HTML tag called "mybutton" instead of your component, and it won't work!

📚 **Learn more:** [Components Must Be Capitalized](https://react.dev/learn/your-first-component#components-must-be-capitalized)

### Component Files

Best practice: one component per file.

Create `src/components/MyButton.jsx`:

```javascript
function MyButton() {
	return <button>Click me</button>;
}

export default MyButton;
```

**Note:** Use `.jsx` extension for files containing JSX. This makes it clear which files have React components.

### What Does `export default` Do?

`export default` makes your component available to other files. It means:

- **"export"**: Make this available outside this file
- **"default"**: This is the main thing this file exports

When you write `import MyButton from './components/MyButton'`, you're importing that default export. You can only have one `default` export per file, but it makes imports cleaner.

📚 **Learn more:** [Importing and Exporting Components](https://react.dev/learn/importing-and-exporting-components)

Then import it in `src/App.jsx`:

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

**About the parentheses:** The `( )` in `return ( ... )` aren't strictly required, but they're a convention when your JSX spans multiple lines. They make it clear where the return statement starts and ends. Without them, you'd need the JSX to start on the same line as `return`.

## 🛠️ BUILD: Your First Slidemoji Components

Now it's your turn! Here's what to build:

### Task 1: Clean Up App.jsx

1. Open `src/App.jsx`
2. Replace it with a simple component that renders a heading "Slidemoji" and a subtitle explaining the game
3. Use semantic HTML: `<header>`, `<main>`, etc.

Example to get you started:

```javascript
function App() {
	return (
		<div className="app">
			<header>
				<h1>Slidemoji</h1>
				<p>Click tiles to slide them into the empty space!</p>
			</header>
			<main>{/* Your Board component will go here */}</main>
		</div>
	);
}

export default App;
```

**Note on `className="app"`:** In React/JSX, we use `className` (not `class`) to apply CSS classes. This is a CSS **class**, not an **id**. Use classes for styling (can be reused), use ids when you need a unique identifier for JavaScript access. For this app, a class is perfect!

### Task 2: Create a Tile Component

1. Create a new folder: `src/components`
2. Create `src/components/Tile.jsx`
3. Make a component that returns a `<div>` styled as a square tile
4. For now, just display the text "🎨" (or any emoji) inside
5. Add a `className` to use for styling

Example structure (don't look until you've tried!):

````javascript
function Tile() {
	return <div className="tile">🎨</div>;
}

export default Tile;
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.app {
  text-align: center;
  color: white;
}

header {
  margin-bottom: 2rem;
}

h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  grid-template-rows: repeat(3, 100px);
  gap: 5px;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 12px;
  margin: 0 auto;
}

.tile {
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.tile:hover {
  transform: scale(1.05);

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
````

### Expected Result

You should see:

- A page with "Slidemoji" at the top
- A 3x3 grid below it
- Each square showing an emoji
- Clean, centered layout

### Checkpoint Questions

Before moving to Phase 2, make sure you understand:

- **What is a component?** A reusable function that returns JSX, describing a piece of UI.
- **What is JSX?** JavaScript XML - syntax that looks like HTML but is actually JavaScript, letting you write UI markup in your code.
- **How do you create and use a component?** Create: write a function that returns JSX. Use: include it in JSX like an HTML tag with PascalCase: `<MyComponent />`
- **Why do component names start with a capital letter?** So React can distinguish between HTML tags (lowercase) and custom components (PascalCase).
- **What does `export default` do?** Makes your component available to import in other files. It's the main thing that file exports.

## Next Steps

Great job! You've created the visual foundation of your game. But right now, all tiles are identical. How do we make each tile different? That's what **props** are for!

Continue to `tutorial/02-props.md` →
