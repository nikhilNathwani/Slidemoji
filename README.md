# Slidemoji

Daily emoji sliding puzzle game with account progression, stats tracking, and premium unlock flow.

## Overview

Slidemoji is a React + Vite game where players solve a daily puzzle by sliding emoji tiles into the correct arrangement. The project combines game logic, Firebase-backed user progression, and Stripe-based premium access.

## Highlights

- Daily puzzle model with archive/history access
- Firebase Auth with anonymous-to-Google account upgrade path
- Firestore-backed user data and progression
- Stripe checkout and webhook flow for premium unlock
- Clear feature boundaries using vertical slices (`auth`, `payment`)

## Tech Stack

- React 19 + Vite
- Firebase (Auth, Firestore)
- Stripe (Vercel serverless functions in `api/`)
- CSS Modules + shared style tokens
- Vitest + ESLint

## Project Structure

```text
src/
  auth/              # Auth context, providers, account merge, sign-in UI
  payment/           # Checkout hooks, paywall view, subscription state
  components/        # Game UI, dialogs, landing, stats
  contexts/          # Shared user document context
  hooks/             # App/game-specific hooks
  services/          # Firebase config + Firestore service layer
  utils/             # Pure helpers (emoji/grid/puzzle/sound)
  styles/            # Shared global style tokens

api/
  create-checkout-session.js
  stripe-webhook.js
  dev-grant-premium.js

data/                # Puzzle data sources
scripts/             # One-off migration/maintenance utilities
```

## Environment Variables

### Frontend (`VITE_`)

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Serverless (`api/`)

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the app locally

```bash
npm run dev
```

Vite runs at http://localhost:5173.

### 3. Run API + Stripe webhook locally (optional, payments)

```bash
npm run dev:payments
```

## Scripts

```bash
npm run dev            # Frontend only
npm run dev:api        # Vercel serverless local runtime
npm run dev:stripe     # Stripe webhook forwarding
npm run dev:payments   # API + Stripe in parallel
npm run build
npm run test
npm run lint
```

## Why This Project

Slidemoji demonstrates end-to-end product engineering: game-state architecture, authentication lifecycle handling, secure payment integration, and production-minded service boundaries in a modern frontend stack.
