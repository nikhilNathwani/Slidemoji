# Slidemoji - React Learning Tutorial

Welcome to your React learning journey! This tutorial series will teach you React by building a sliding puzzle game from scratch.

## What You'll Build

A sliding puzzle game where:

- You have a grid of tiles (typically 3x3 or 4x4)
- One tile is missing (the "gap")
- Tiles display emojis or images
- Clicked tiles slide into the gap if adjacent
- The goal is to unscramble the puzzle

## What You'll Learn

Through building this game, you'll master these core React concepts:

1. **Components & JSX** - The building blocks of React
2. **Props** - Passing data between components
3. **State** - Managing dynamic data
4. **Events** - Handling user interactions
5. **Hooks** - useState, useEffect, and more
6. **Conditional Rendering** - Showing different content based on state
7. **Lists & Keys** - Rendering multiple items efficiently
8. **Thinking in React** - Component composition and data flow

## Tutorial Structure

This tutorial is divided into 6 phases. Each phase introduces new React concepts with explanations and examples, then guides you to implement them in your game.

### Phase 1: React Basics & Project Setup

**File:** `tutorial/01-basics-and-setup.md`

- What is React?
- Setting up your development environment
- JSX syntax
- Creating your first component
- **Build:** Basic project structure and a simple tile component

### Phase 2: Props - Component Communication

**File:** `tutorial/02-props.md`

- Understanding props
- Passing data down the component tree
- Props are read-only
- **Build:** Game board with tiles, passing tile data via props

### Phase 3: State - Making Things Dynamic

**File:** `tutorial/03-state.md`

- What is state?
- The useState hook
- State vs Props
- Updating state correctly
- **Build:** Interactive tiles and tracking the game board state

### Phase 4: Events & Game Logic

**File:** `tutorial/04-events-and-logic.md`

- Event handling in React
- Working with click events
- Implementing game logic
- **Build:** Tile sliding mechanics and move validation

### Phase 5: Effects & Advanced Features

**File:** `tutorial/05-effects.md`

- The useEffect hook
- Side effects in React
- Component lifecycle
- **Build:** Puzzle scrambling, win detection, and timer

### Phase 6: Polish & Best Practices

**File:** `tutorial/06-polish.md`

- Styling in React
- Performance optimization
- Custom hooks
- **Build:** Animations, move counter, difficulty levels, reset functionality

## How to Use This Tutorial

1. **Read each phase document in order** - The concepts build on each other
2. **Type the code yourself** - Don't copy-paste; muscle memory helps learning
3. **Experiment** - Try modifying the code to see what happens
4. **Check the React docs** - When curious, explore the [official React documentation](https://react.dev/learn) (links are provided throughout the tutorials!)
5. **Have fun!** - Building games is a great way to learn

## Prerequisites

- Basic JavaScript knowledge (variables, functions, arrays, objects)
- Familiarity with ES6+ features (arrow functions, destructuring, spread operator)
- HTML/CSS basics
- A code editor (VS Code recommended)
- **Node.js installed (version 20.19+ or 22.12+)** - [Download from nodejs.org](https://nodejs.org/)

## Getting Help

- **React Official Docs:** https://react.dev
- **When stuck:** Try console.log() to inspect your data
- **Common issue:** State not updating? Remember state updates are asynchronous
- **Styling tip:** Start simple, add polish later

Ready to start? Open `tutorial/01-basics-and-setup.md` and begin your journey!
