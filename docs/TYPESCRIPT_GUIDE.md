# TypeScript Onramp — Slidemoji Codebase Edition

This guide uses your existing code as the primary examples. Each section introduces
a concept, shows it in the wild in your codebase, and gives you a hands-on target
to practice on. By the end you'll have the depth to put TypeScript on your resume.

---

## 0. Mental Model First

TypeScript is JavaScript with a layer on top. At build time (or type-check time),
TypeScript validates that your values are what you say they are. At runtime, it's
plain JavaScript — all the type annotations are erased.

```
Your .ts/.tsx files  →  tsc (type-check only, no emit)  →  error or ✓
                     →  Vite (transpile, strip types)     →  .js for the browser
```

In this project, `tsconfig.json` has `"noEmit": true`, which means TypeScript's job
is to catch mistakes, not produce output. Vite handles the actual build.

---

## 1. You Already Know This — Basic Annotations

You've been writing JSDoc for months:

```js
// JSDoc (JavaScript)
/**
 * @param {number} puzzleId
 * @param {{ includeHash?: boolean }} options
 * @returns {string}
 */
export function formatPuzzleId(puzzleId, { includeHash = true } = {}) { ... }
```

TypeScript is the same idea, but inline:

```ts
// TypeScript (your actual puzzleUtils.ts)
export function formatPuzzleId(
	puzzleId: number,
	{ includeHash = true }: { includeHash?: boolean } = {},
): string {
	const padded = String(puzzleId).padStart(3, "0");
	return includeHash ? `#${padded}` : padded;
}
```

The annotation `puzzleId: number` is the type. `): string` is the return type.
The `?` in `includeHash?` means the property is optional (may be undefined).

**What you get from this:** If you call `formatPuzzleId("abc")`, TypeScript errors
immediately instead of producing `"#NaN"` silently at runtime.

---

## 2. Interfaces — Your First Real Type (`puzzleUtils.ts`)

An `interface` names a shape. You have two in `puzzleUtils.ts`:

```ts
// src/utils/puzzleUtils.ts

// What a puzzle document looks like in Firestore
export interface FirestorePuzzle {
	emoji: string;
	emojiName: string;
	normal: number[]; // 3×3 grid tiles (0 = gap)
	hard: number[]; // 4×4 grid tiles (0 = gap)
}

// What usePuzzle returns to the rest of the app
export interface PuzzleData {
	id: number;
	emoji: string;
	emojiName: string;
	initialGrids: {
		normal: number[];
		hard: number[];
	};
}
```

Notice both are all-required (no `?`). This is intentional — every puzzle document
in the dataset has all four fields, and `usePuzzle` only returns a full object or
`null`. There is no in-between state.

**Two interfaces instead of one** — the old approach had a single `PuzzleMetadata`
interface with everything optional and an `[key: string]: unknown` index signature
("the I-give-up of TypeScript"). That was needed to allow runtime-added aliases
(`initialGrid`, `grid3x3`, `grid4x4`) that an old conversion function used to attach.
Those aliases are gone now. `usePuzzle` reads `puzzleData.normal` and `puzzleData.hard`
directly — the only fields that actually live in Firestore.

**The `export` question:** Export an interface when another file needs to annotate
variables or parameters with that type. Keep it unexported when it's only used within
the same file. When in doubt, export it.

**Hands-on:** Open `usePuzzle.ts` and hover over `state.data`. VS Code will show you
`PuzzleData | null`. Then try adding a line `state.data.emoji` — TypeScript will
underline it and tell you "Object is possibly 'null'". Add `if (!state.data) return;`
above it and the error disappears. That's narrowing (Section 6).

---

## 3. Union Types — Handling Multiple Valid Values

You've already seen `number[] | null`. Union types (`A | B`) say "this value is
either A or B." They appear everywhere in React:

```ts
// A prop that accepts string or null
type UserId = string | null;

// A state that has three possible shapes
type LoadingState = "idle" | "loading" | "error" | "success";
```

**In your code:** `usePreference.js` returns `[preference, setPreference]`.
In TypeScript, the return type of a generic preference hook would use union types to
describe keys that can be `boolean | string | number`.

---

## 4. Generics — The Big Unlock (`useState<T>`)

Generics let you write code that works with any type while still being type-safe.
The `<T>` is a placeholder for "whatever type you give me."

You use generics every time you call `useState`:

```ts
// Without TypeScript, React infers the type from the initial value:
const [count, setCount] = useState(0); // TypeScript infers: number
const [name, setName] = useState(""); // TypeScript infers: string
const [data, setData] = useState(null); // TypeScript infers: null ← PROBLEM
```

The last one is a problem because TypeScript will refuse to let you set `data` to
anything other than `null` later. Fix it with an explicit generic:

```ts
import type { PuzzleData } from "../utils/puzzleUtils";

const [data, setData] = useState<PuzzleData | null>(null);
// Now setData(fetchedPuzzle) works fine; TypeScript knows the full shape.
```

**Your codebase — `usePuzzle.ts` (already converted).** It uses a state object with
three fields. Here's the actual code:

```ts
interface PuzzleState {
	puzzleId: number | null;
	data: PuzzleData | null;
	error: Error | null;
}

const [state, setState] = useState<PuzzleState>({
	puzzleId: null,
	data: null,
	error: null,
});
```

`puzzleId` lives alongside `data` in state specifically so we can detect staleness:
`state.puzzleId !== puzzleId` means the effect hasn't re-run yet → return
`isLoading: true`. If we only stored `data | null`, we couldn't tell "loading" from
"puzzle not found".

TypeScript now catches `state.data.emoji` without a null check at the call site —
exactly the kind of protection that was missing when `usePuzzle` was a `.js` file.

---

## 5. Async Functions and Return Types

Every async function returns a `Promise`. TypeScript lets you annotate what the promise
resolves to:

```ts
// Async function that returns a FirestorePuzzle or null:
async function getFirestorePuzzleById(
	id: number,
): Promise<FirestorePuzzle | null> {
	const docSnap = await getDoc(doc(db, "puzzles", id.toString()));
	if (!docSnap.exists()) return null;
	return docSnap.data() as FirestorePuzzle;
}
```

The `as FirestorePuzzle` is a **type assertion** — you're telling TypeScript "trust me,
this data matches this shape." It's fine to use at system boundaries (like a Firestore
read) where TypeScript can't verify the shape at compile time. Note that `docSnap.data()`
only runs after `docSnap.exists()` passes, so it can't be `undefined` here. Don't use
`as` to silence errors in your own logic.

**In your codebase:** `src/firebase/firestore/puzzle.js` (`getFirestorePuzzleById`)
is the natural next conversion target. The call site in `usePuzzle.ts` already
annotates the result as `FirestorePuzzle | null`.

---

## 6. Type Narrowing — Making TypeScript Smart

TypeScript tracks what you've checked. After an `if` guard, it narrows the type:

```ts
function processData(data: PuzzleData | null) {
	// Here: data is PuzzleData | null

	if (!data) return;

	// Here: TypeScript KNOWS data is PuzzleData (null was ruled out above)
	console.log(data.emoji); // ✓ — TypeScript is happy
}
```

This is called **control flow narrowing** and it's one of TypeScript's most useful
features. You're already doing this in JavaScript — TypeScript just makes it explicit:

```ts
// From your usePreference.js (annotated):
const preferenceValue = userData?.preferences?.[storageKey];
//    ^ This is `unknown` until we narrow it

const preference =
	userId && preferenceValue !== undefined
		? preferenceValue // narrowed: not undefined
		: defaultValue;
```

---

## 7. Type vs Interface — When to Use Each

| `type`                                           | `interface`                               |
| ------------------------------------------------ | ----------------------------------------- |
| Union types: `type Status = "idle" \| "loading"` | Object shapes you'll extend               |
| Utility types: `type Partial<T>`                 | Public API types (exported from a module) |
| Simple aliases: `type UserId = string`           | Classes that implement a contract         |

**Rule of thumb:** Use `interface` for objects/shapes. Use `type` for everything else.
In practice, most of the time `interface` works fine.

---

## 8. Utility Types — TypeScript's Built-In Tools

TypeScript ships built-in "helper types" you'll use constantly:

```ts
interface FirestorePuzzle {
	emoji: string;
	emojiName: string;
	normal: number[];
	hard: number[];
}

// Partial<T> — makes all fields optional
type PartialPuzzle = Partial<FirestorePuzzle>;
// { emoji?: string; emojiName?: string; normal?: number[]; hard?: number[] }

// Required<T> — makes all fields required (already is, but useful when you have optionals)
type FullPuzzle = Required<FirestorePuzzle>;

// Pick<T, K> — keep only specific fields
type PuzzleDisplay = Pick<FirestorePuzzle, "emoji">;
// { emoji: string }

// Omit<T, K> — drop specific fields
type PuzzleWithoutGrids = Omit<FirestorePuzzle, "normal" | "hard">;
// { emoji: string; emojiName: string }

// Record<K, V> — object with keys of type K and values of type V
type ScoresByDifficulty = Record<"normal" | "hard", number>;
// { normal: number; hard: number }
```

**In your codebase:** `useGameState.js` returns `{ normal, hard, currentDifficulty }`.
The Record utility would cleanly express grids keyed by difficulty:

```ts
type Difficulty = "normal" | "hard";
type GridsByDifficulty = Record<Difficulty, number[] | null>;
```

---

## 9. React-Specific TypeScript

### Props

```tsx
// JavaScript:
function Trophy({ puzzleId, isLocked }) { ... }

// TypeScript:
interface TrophyProps {
  puzzleId: number | null;
  isLocked: boolean;
}

function Trophy({ puzzleId, isLocked }: TrophyProps) { ... }
```

### Event Handlers

```tsx
// onClick — event is React.MouseEvent
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
	e.stopPropagation();
}

// onChange on an input — event is React.ChangeEvent
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
	setValue(e.target.value);
}
```

### Children

```tsx
interface DialogProps {
	isOpen: boolean;
	onClose: () => void; // function with no args, returns nothing
	title: string;
	children: React.ReactNode; // anything React can render
}
```

**In your codebase:** `src/components/dialogs/Dialog.tsx` — completed. See notes below.

### CSS Module Imports

TypeScript doesn't know about `.css` files by default. The fix is `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

This one line pulls in Vite's built-in declarations: CSS modules, `import.meta.env`,
asset imports, etc. Every Vite+TypeScript project needs this file.

### Native DOM vs React Synthetic Events

The guide's event handler examples use `React.KeyboardEvent` — but only for **JSX props**:

```tsx
// JSX prop → React synthetic event
function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) { ... }
<input onKeyDown={handleKeyDown} />

// document.addEventListener → native DOM event
function handleKeyDown(e: KeyboardEvent) { ... }
document.addEventListener("keydown", handleKeyDown);
```

The rule: if you're attaching via a JSX attribute (`onKeyDown`, `onClick`), use
`React.SomeEvent`. If you're calling a DOM API directly (`addEventListener`,
`window.on...`), use the native `SomeEvent` without the `React.` prefix.

---

## 10. Practical Conversion Sequence for This Codebase

Here is the recommended order — each file introduces the next concept naturally:

| Step    | File                                   | New Concepts                                                                 |
| ------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| ✅ Done | `puzzleUtils.ts`                       | Interfaces, required vs optional fields, multiple types for different layers |
| ✅ Done | `src/hooks/usePuzzle.ts`               | `useState<T>`, local interface types, async call site annotation             |
| ✅ Done | `src/firebase/firestore/puzzle.ts`     | `Promise<T>`, type assertions (`as`), `async` return types                   |
| ✅ Done | `src/components/dialogs/Dialog.tsx`    | React prop interfaces, `React.ReactNode`, callback types `() => void`        |
| 5       | `src/hooks/useGameState.js`            | `Record<K, V>`, complex state shapes, `useCallback` types                    |
| 6       | `src/contexts/AuthProvider.jsx`        | Context types, `createContext<T>`, Provider value types                      |

---

## 11. When TypeScript Goes on Your Resume

**You've hit the threshold.** Steps 1–4 are done. You can justify listing TypeScript
under Frontend because you can:

- Write interfaces and understand when to export them
- Use `useState<T>`, `useEffect`, and `useCallback` with proper types in hooks
- Type React component props and event handlers
- Handle async/Promise return types at Firestore boundaries
- Read and understand TypeScript errors rather than just dismissing them

**What makes it resume-strong (not just checkbox)** is pairing it with something
concrete: "Migrated core utilities and data-fetching hooks to TypeScript; defined
`FirestorePuzzle` and `PuzzleData` interfaces at the Firestore boundary to enforce
data shape across the app." That specificity is what a technical interviewer will
follow up on — they'll ask what `FirestorePuzzle` describes, and you have a real
answer.

---

## Quick Reference

```ts
// Variable annotations
const id: number = 1;
const name: string = "Turtle";
const flag: boolean = true;
const data: number[] = [1, 2, 3];
const maybe: string | null = null;

// Function
function greet(name: string): string {
  return `Hello, ${name}`;
}

// Arrow function
const double = (x: number): number => x * 2;

// Async
async function fetchPuzzle(id: number): Promise<FirestorePuzzle | null> { ... }

// Interface
interface User {
  uid: string;
  email?: string;       // optional
  isAnonymous: boolean;
}

// Generic function
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// React props
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}
function Button({ label, onClick, disabled = false }: ButtonProps) { ... }
```
