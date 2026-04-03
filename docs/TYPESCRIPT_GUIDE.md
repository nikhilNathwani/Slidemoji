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

| Step    | File                                | New Concepts                                                                 |
| ------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| ✅ Done | `puzzleUtils.ts`                    | Interfaces, required vs optional fields, multiple types for different layers |
| ✅ Done | `src/hooks/usePuzzle.ts`            | `useState<T>`, local interface types, async call site annotation             |
| ✅ Done | `src/firebase/firestore/puzzle.ts`  | `Promise<T>`, type assertions (`as`), `async` return types                   |
| ✅ Done | `src/components/dialogs/Dialog.tsx` | React prop interfaces, `React.ReactNode`, callback types `() => void`        |
| 5       | `src/hooks/useGameState.js`         | `Record<K, V>`, complex state shapes, `useCallback` types                    |
| 6       | `src/contexts/AuthProvider.jsx`     | Context types, `createContext<T>`, Provider value types                      |

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

## 12. Full Codebase Migration Inventory

**44 files remain.** This is the complete list of every `.js` / `.jsx` file in
`src/` that can be converted to TypeScript. Work through them in order — each tier
builds on the skills from the previous one. Check them off as you go.

> Mixed TS/JS is 100% industry-standard. Gradual migration via `allowJs: true` is
> the documented official approach. Even large companies have partially-migrated
> codebases years into the process. There is no "weird" about it.

**Time estimate:** 20–30 hours total, spread over many sessions. The first 10 files
will feel slow (15–30 min each). By file 25 you'll be down to 5–10 min per file.
The acceleration is real.

---

### Tier 1 — Constants & Config (trivial, ~5–10 min each)

No logic to reason about. Just add types to the exported values.

| Done | File                             | Lines | Notes                                                                             |
| ---- | -------------------------------- | ----: | --------------------------------------------------------------------------------- |
| ☐    | `src/contexts/AuthContext.js`    |     3 | Single `createContext(null)` call — just add `<AuthContextValue \| null>` generic |
| ☐    | `src/contexts/UserDocContext.js` |     3 | Same pattern as `AuthContext.js`                                                  |
| ☐    | `src/firebase/index.js`          |    26 | Re-exports only — likely needs zero changes to pass type-check                    |
| ☐    | `src/firebase/firebaseConfig.js` |    34 | Firebase SDK init. Firebase types come from `firebase/app` automatically          |
| ☐    | `src/constants.js`               |    44 | Exports primitives — TypeScript infers the types, no annotations required         |
| ☐    | `src/utils/icons.js`             |    59 | FontAwesome icon exports — TypeScript infers from the imported icon values        |

---

### Tier 2 — Simple Utilities (15–20 min each)

Pure functions with no React. Great for practicing function signatures.
New concept: typing DOM APIs (`AudioContext`, `HTMLAudioElement`).

| Done | File                                     | Lines | Notes                                                           |
| ---- | ---------------------------------------- | ----: | --------------------------------------------------------------- |
| ☐    | `src/utils/emoji.js`                     |    28 | String/array utilities. Add param/return types to each function |
| ☐    | `src/firebase/firestore/preference.js`   |    22 | Simple Firestore read/write. `Promise<void>` return types       |
| ☐    | `src/firebase/firestore/subscription.js` |    37 | Single Firestore read. Introduce your `UserDoc` interface here  |
| ☐    | `src/hooks/useAuth.js`                   |    10 | Tiny hook — just types the `useContext` return                  |
| ☐    | `src/hooks/useUserDoc.js`                |    10 | Same — one-liner hook, just types the `useContext` call         |
| ☐    | `src/hooks/useSubscription.js`           |    21 | Reads `isPremium`. `useState<boolean>`                          |

---

### Tier 3 — Firestore Modules (20–35 min each)

Introduces typing Firestore SDK calls (`DocumentData`, `QuerySnapshot`).
New concept: writing your shared `UserDoc` interface and sharing it across files.

| Done | File                                  | Lines | Notes                                                                            |
| ---- | ------------------------------------- | ----: | -------------------------------------------------------------------------------- |
| ☐    | `src/firebase/firestore/user.js`      |   104 | Firestore user CRUD. Define `UserDoc` interface here (or in a `types.ts` file)   |
| ☐    | `src/firebase/firestore/gameState.js` |    81 | Game state CRUD. Introduces `GameState` interface with `Record<Difficulty, ...>` |

---

### Tier 4 — Hooks (20–40 min each)

Back on familiar hook territory, but with state that has real shape.
New concept: `Record<K, V>` for grids keyed by difficulty.

| Done | File                            | Lines | Notes                                                                                   |
| ---- | ------------------------------- | ----: | --------------------------------------------------------------------------------------- |
| ☐    | `src/hooks/useSolvedPuzzles.js` |    31 | `useState<number[]>`. Reads solved puzzle IDs from Firestore                            |
| ☐    | `src/hooks/useCheckout.js`      |    60 | `fetch` call to Stripe API. `Promise<void>`, `useState<boolean>` for loading            |
| ☐    | `src/hooks/usePreference.js`    |    74 | `PREFERENCE_DEFAULTS` map — good candidate for `Record<string, unknown>`                |
| ☐    | `src/hooks/useGameState.js`     |   184 | **Next in sequence.** Introduces `Record<Difficulty, number[] \| null>`. See Section 10 |

---

### Tier 5 — Complex Utilities (30–50 min each)

Real payoff tier. These files teach you how to type irregular, branchy logic.
New concept: union types in complex conditionals, `HTMLAudioElement`.

| Done | File                        | Lines | Notes                                                                                    |
| ---- | --------------------------- | ----: | ---------------------------------------------------------------------------------------- |
| ☐    | `src/utils/sound.js`        |   125 | DOM Audio APIs (`AudioContext`, `GainNode`). Nullable refs (`HTMLAudioElement \| null`)  |
| ☐    | `src/utils/accountMerge.js` |   112 | Complex merge logic. Good practice for `Promise<void>` chains and error union types      |
| ☐    | `src/utils/gridHelpers.js`  |   291 | Largest utility file. Grid math — `number[][]`, `[row: number, col: number]` tuple types |
| ☐    | `src/firebase/auth.js`      |   144 | Auth functions: `signInWithGoogle`, `signOut`, etc. Firebase `User` type from SDK        |

---

### Tier 6 — Context Providers (45–60 min each)

The hardest conceptual leap: typing React Context generics.
New concept: `createContext<T>`, context value interfaces, Provider `value` prop types.

| Done | File                               | Lines | Notes                                                                       |
| ---- | ---------------------------------- | ----: | --------------------------------------------------------------------------- |
| ☐    | `src/contexts/UserDocProvider.jsx` |    59 | Simpler provider — good entry point for context typing                      |
| ☐    | `src/contexts/AuthProvider.jsx`    |   190 | Complex auth flow (anonymous → Google merge). Multiple state pieces to type |

---

### Tier 7 — Simple Components (15–30 min each)

Pure presentational components. Mostly just adding prop interfaces.
Pattern: `interface ComponentProps { ... }` + destructure in the function signature.

| Done | File                                              | Lines | Notes                                                  |
| ---- | ------------------------------------------------- | ----: | ------------------------------------------------------ |
| ☐    | `src/components/stats/TrophyCaseTitle.jsx`        |    23 | Almost no props — simplest component in the codebase   |
| ☐    | `src/components/dialogs/ConfirmRestartDialog.jsx` |    31 | One or two callback props (`onConfirm`, `onCancel`)    |
| ☐    | `src/components/dialogs/StatsDialog.jsx`          |    30 | Wraps `StatsContent` — straightforward prop forwarding |
| ☐    | `src/components/common/SignInUpsell.jsx`          |    43 | Small UI component with a couple icon/text props       |
| ☐    | `src/components/game/GameActionButton.jsx`        |    51 | Button with `onClick`, `label`, maybe `disabled`       |
| ☐    | `src/components/landing/LandingPage.jsx`          |    64 | Intro screen — static layout, minimal props            |

---

### Tier 8 — Medium Components (30–50 min each)

Components with internal state and/or hooks. Introduce `React.MouseEvent`,
`React.ChangeEvent`, and event handler typing in context.

| Done | File                                           | Lines | Notes                                                                         |
| ---- | ---------------------------------------------- | ----: | ----------------------------------------------------------------------------- |
| ☐    | `src/components/dialogs/WinDialog.jsx`         |    64 | Uses puzzle data — type the `PuzzleData` prop you already defined             |
| ☐    | `src/components/common/Trophy.jsx`             |    59 | Fetches puzzle with `usePuzzle` — already typed, propagates cleanly           |
| ☐    | `src/components/game/Tile.jsx`                 |    67 | Grid tile — `number` value prop, `onClick` with position args                 |
| ☐    | `src/components/stats/StatsContent.jsx`        |    82 | Displays stats. `Record<Difficulty, number>` likely for per-difficulty counts |
| ☐    | `src/components/landing/AnimatedTileGrid.jsx`  |    75 | Framer Motion types: `Variants`, `AnimationControls` from `framer-motion`     |
| ☐    | `src/components/common/GoogleSignInButton.jsx` |   100 | Handles sign-in flow — `Promise`-returning onClick, loading state             |

---

### Tier 9 — Complex Components (45–75 min each)

Full-feature components with many hooks, branchy render logic, and sub-components.
Save these for when Tier 1–8 feel comfortable.

| Done | File                                        | Lines | Notes                                                                                |
| ---- | ------------------------------------------- | ----: | ------------------------------------------------------------------------------------ |
| ☐    | `src/components/stats/TrophyCase.jsx`       |   143 | Complex puzzle grid display. Array mapping with typed callbacks                      |
| ☐    | `src/components/game/Grid.jsx`              |   144 | Core game grid. Tile position math, move handlers — rich typing opportunity          |
| ☐    | `src/components/Header.jsx`                 |   114 | Navigation + dialog trigger buttons. Multiple callback props                         |
| ☐    | `src/components/dialogs/SettingsDialog.jsx` |   170 | Settings + dev tools. Union types for preference keys                                |
| ☐    | `src/components/dialogs/ArchiveDialog.jsx`  |   228 | Largest component. Paywall state, archive list, embedded `PaywallView` sub-component |
| ☐    | `src/components/game/Game.jsx`              |   109 | Core game loop — uses `useGameState`, grid helpers, many props                       |
| ☐    | `src/App.jsx`                               |   179 | Top-level layout, dialog orchestration, all state lifted here                        |
| ☐    | `src/main.jsx`                              |    43 | Entry point + `Root` component. Dark mode + provider wrapping                        |

---

### Summary

| Tier                   |  Files | Estimated Time |
| ---------------------- | -----: | -------------- |
| 1 — Constants & Config |      6 | ~45 min        |
| 2 — Simple Utilities   |      6 | ~2 hrs         |
| 3 — Firestore Modules  |      2 | ~1 hr          |
| 4 — Hooks              |      4 | ~2.5 hrs       |
| 5 — Complex Utilities  |      4 | ~3 hrs         |
| 6 — Context Providers  |      2 | ~2 hrs         |
| 7 — Simple Components  |      6 | ~2.5 hrs       |
| 8 — Medium Components  |      6 | ~4 hrs         |
| 9 — Complex Components |      8 | ~6 hrs         |
| **Total**              | **44** | **~24 hrs**    |

After the 4 already completed (`puzzleUtils.ts`, `usePuzzle.ts`, `puzzle.ts`,
`Dialog.tsx`), you have 44 to go. At 2–3 files per session that's 15–20 sessions.

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
