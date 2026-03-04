# Development & Testing Tools

This folder contains mock data and utilities for testing Slidemoji without a full Firestore database.

## Quick Start

### Enable Dev Mode

Add to `.env.local`:

```env
VITE_DEV_MODE=true
```

Or in browser console:

```javascript
localStorage.setItem("devMode", "true");
// Refresh page
```

### Test Different User States

In browser console:

```javascript
// Test new user (no trophies, no streaks)
localStorage.setItem("devUserScenario", "newUser");

// Test active player (7-day streak, 12 trophies)
localStorage.setItem("devUserScenario", "activePlayer");

// Test resume game (saved game in progress)
localStorage.setItem("devUserScenario", "resumePlayer");

// Test power user (30-day streak, 30 trophies)
localStorage.setItem("devUserScenario", "powerUser");

// Refresh page to apply
location.reload();
```

## Available User Scenarios

### `newUser`

- No trophies
- No streaks
- Clean slate for testing first-time experience

### `activePlayer`

- 7-day play streak
- 5-day win streak
- 12 completed puzzles (both 3x3 and 4x4)
- Dark mode enabled

### `resumePlayer`

- Has saved game in progress for today's puzzle
- 3-day streak
- Few trophies
- Good for testing resume functionality

### `powerUser`

- 30-day streak (both play and win)
- 30 completed puzzles
- Maxed out trophy case
- Good for testing UI with lots of data

## Customizing Mock Data

Edit `mockData.js` to:

- Add new user scenarios
- Modify trophy counts
- Change streak lengths
- Adjust completion stats

## Disabling Dev Mode

Remove from `.env.local` or in console:

```javascript
localStorage.removeItem("devMode");
localStorage.removeItem("devUserScenario");
```

## Production Safety

Dev mode automatically disables in production builds. The code checks:

- `import.meta.env.VITE_DEV_MODE === 'true'`
- Browser localStorage flags

Both are stripped/ignored in production.
