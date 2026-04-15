# Slidemoji

A daily emoji puzzle game. Swap emoji tiles on a grid to match a hidden target arrangement.

## Tech Stack

- **React + Vite** — component framework and dev server
- **Firebase** — Auth (Anonymous + Google), Firestore (user data, puzzles), Hosting
- **Stripe** — premium subscription via Checkout Sessions (Vercel serverless functions in `api/`)
- **CSS Modules** + a shared `src/styles/buttons.css` design system

## Project Structure

```
src/
  auth/           # Vertical slice — all authentication concerns
  │   AuthContext.ts        — React context type + createContext
  │   AuthProvider.tsx      — state machine, Google sign-in, anonymous upgrade
  │   useAuth.ts            — hook to consume AuthContext
  │   auth.js               — Firebase Auth service (signIn, signOut, onAuthChange)
  │   accountMerge.js       — Firestore transaction merging anonymous → Google progress
  │   GoogleSignInButton.jsx — sign-in / sign-out button component
  │   SignInUpsell.jsx       — "sign in to save trophies" prompt
  │
  payment/        # Vertical slice — all subscription / paywall concerns
  │   useCheckout.js        — initiates Stripe Checkout session
  │   useSubscription.js    — reads isPremium from Firestore userDoc
  │   PaywallView.jsx        — paywall UI with feature list and unlock button
  │
  components/     # Horizontal — UI components grouped by type
  │   Header.jsx / Header.module.css
  │   common/     Trophy, (auth UI lives in src/auth/)
  │   dialogs/    SettingsDialog, StatsDialog, ArchiveDialog, ConfirmRestartDialog, ...
  │   game/       Game, Grid, Tile, GameActionButton
  │   landing/    LandingPage, AnimatedTileGrid
  │   stats/      StatsContent, TrophyCase, ...
  │
  contexts/       # UserDocContext + UserDocProvider (shared, not auth-specific)
  hooks/          # useGameState, usePuzzle, usePreference, useTheme, useUserDoc, ...
  services/       # firebaseConfig.js + firestore/ sub-services
  utils/          # pure helpers: emoji, grid, puzzle, icons, sound
  styles/         # buttons.css global design tokens

api/              # Vercel serverless functions (Stripe webhook, checkout session)
data/             # emoji_calendar.json, exclusion lists
scripts/          # one-off data migration / upload scripts
```

### Codebase conventions

- **Vertical slices** for domains with multiple layers and clear boundaries (`src/auth/`, `src/payment/`). Everything a feature needs — service, state, context, hooks, UI — lives together.
- **Horizontal grouping** for shared infrastructure (`hooks/`, `components/`, `utils/`) that has no single owner.
- **Global button classes** (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-cancel`, `.btn-google`) in `src/styles/buttons.css`. Module CSS overrides use `:global(.btn).moduleClass` to stay one specificity level above the base.

## Development

```bash
npm install
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # Production build to dist/
```

Firebase emulators (optional):

```bash
firebase emulators:start
```
