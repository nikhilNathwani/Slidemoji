# Pre-Ship Testing Checklist for Slidemoji MVP

## Core Gameplay

### Puzzle Loading
- [ ] **Daily puzzle loads correctly** - Verify today's puzzle shows the correct emoji from calendar
- [ ] **Demo mode works** - Test `?demo=134` shows hamburger emoji (Puzzle 134)
- [ ] **Grid initializes properly** - Tiles scrambled correctly (not solved state)
- [ ] **Emoji renders** - SVG emoji displays without distortion

### Tile Movement
- [ ] **Click/tap tiles** - Adjacent tiles swap with gap correctly
- [ ] **Keyboard controls** - Arrow keys move tiles in correct direction
- [ ] **Multiple rapid clicks blocked** - Can't move multiple tiles simultaneously
- [ ] **Animation smooth** - Tile slides animate without jank
- [ ] **Sound plays** - Tile move sound plays when enabled (test on/off)

### Win Condition
- [ ] **Win detection** - Solving puzzle triggers win dialog
- [ ] **Win dialog shows** - Trophy and "You solved it!" message appears
- [ ] **Trophy saved** - Completion persists (check stats after refresh)
- [ ] **Time tracking** - Win dialog shows reasonable solve time

---

## Authentication & User State

### Sign-In Flow
- [ ] **Google sign-in works** - Sign-in button opens Google OAuth
- [ ] **First-time user** - New user gets initialized with default preferences
- [ ] **Returning user** - Existing user loads their preferences and trophies
- [ ] **Sign-in during game** - In-progress game resumes after sign-in
- [ ] **Trophy migration** - Signed-out trophies migrate to Firestore on sign-in

### Sign-Out Flow
- [ ] **Sign-out button works** - User can sign out successfully
- [ ] **Settings persist** - Dark mode, sound, numbers stay after sign-out (new behavior!)
- [ ] **Trophies hidden** - Trophy case shows sign-in prompt when signed out
- [ ] **Game state cleared** - In-progress moves don't persist after sign-out
- [ ] **Completed puzzles show trophy** - Signed-out completions still show trophy icon

---

## Settings & Preferences

### Dark Mode
- [ ] **Toggle works** - Clicking dark mode switch changes theme immediately
- [ ] **Syncs to Firestore** - Signed-in users: setting saves to cloud
- [ ] **Persists signed-out** - Signed-out users: setting saves to localStorage
- [ ] **Persists on refresh** - Theme persists after page reload
- [ ] **Syncs across devices** - Signed-in: Change on device A reflects on device B

### Show Numbers
- [ ] **Toggle works** - Numbers show/hide on tiles
- [ ] **Defaults to ON** - New puzzle starts with numbers shown
- [ ] **Persists during puzzle** - Manual toggle persists for current puzzle
- [ ] **Resets per puzzle** - New puzzle resets to ON (even if turned off previously)
- [ ] **Hidden when solved** - Numbers hidden after winning

### Sound Effects
- [ ] **Toggle works** - Sound on/off switch functions
- [ ] **Tile move sound** - Plays when enabled, silent when disabled
- [ ] **Persists signed-out** - Preference saves to localStorage
- [ ] **Syncs to Firestore** - Signed-in users: setting saves to cloud

---

## Data Persistence

### Signed-In Users (Firestore)
- [ ] **Moves save** - Each tile move saves to Firestore
- [ ] **Resume works** - Refresh page mid-game, puzzle resumes from last state
- [ ] **Completion saves** - Trophy and stats save to Firestore
- [ ] **Cross-device sync** - Start on device A, continue on device B
- [ ] **Restart clears state** - Restart button clears gameState, starts fresh

### Signed-Out Users (localStorage)
- [ ] **Moves don't persist** - Refresh clears in-progress game (incentive to sign in)
- [ ] **Completions save** - Trophy flag saves to localStorage
- [ ] **Trophy count accurate** - Stats show correct trophy count
- [ ] **Migration works** - Sign in after completing puzzle, trophy migrates to Firestore

---

## Stats & Trophy Case

### Stats Dialog
- [ ] **Opens correctly** - Clicking trophy icon opens stats
- [ ] **Trophy count accurate** - Shows correct number of puzzles solved
- [ ] **Trophy grid renders** - Completed puzzles show emoji trophies
- [ ] **Unsolved puzzles grayed** - Future/unsolved puzzles show locked state
- [ ] **Current puzzle highlighted** - Today's puzzle has visual indicator
- [ ] **Sign-in prompt shows** - Signed-out users see "Sign in to save" message

### WinDialog
- [ ] **Appears on win** - Dialog shows immediately after solving
- [ ] **Trophy displays** - Emoji trophy renders correctly
- [ ] **View Trophies button** - Button opens stats dialog
- [ ] **Play Again button** - Restarts current puzzle (clears grid)
- [ ] **Signed-out users** - See sign-in prompt instead of trophy button

---

## Edge Cases & Bug Fixes

### Issues We Fixed
- [ ] **Demo mode emoji sync** - `?demo=134` shows correct emoji (not mismatched)
- [ ] **Calendar consistency** - Firestore puzzles match local emoji_calendar.json
- [ ] **Settings on sign-out** - Dark mode etc. don't revert to old signed-out values
- [ ] **No console logs** - Open DevTools, verify no debug console.logs in production
- [ ] **Input not blocked forever** - Tiles unblock after animation (no stuck state)
- [ ] **Grid doesn't corrupt** - Code simplified, no JSX corruption errors

### Browser Compatibility
- [ ] **Chrome/Edge** - Full functionality works
- [ ] **Safari** - Emoji SVG renders, animations smooth
- [ ] **Firefox** - Grid layout correct, interactions work
- [ ] **Mobile Safari** - Touch works, no layout issues
- [ ] **Mobile Chrome** - Responsive, playable on phone

### Network Scenarios
- [ ] **Offline mode** - App loads, uses localStorage fallback
- [ ] **Slow network** - Loading states show, no crashes
- [ ] **Firestore error** - Graceful fallback, error logged
- [ ] **Auth error** - Sign-in failure doesn't break app

---

## Performance & Polish

### UI/UX
- [ ] **Responsive design** - Works on mobile, tablet, desktop
- [ ] **Grid scales** - Emoji/tiles size correctly for screen
- [ ] **No layout shift** - Content doesn't jump when loading
- [ ] **Smooth animations** - 60fps tile slides, no jank
- [ ] **Clear feedback** - Buttons respond to hover/click

### Code Quality
- [ ] **No errors in console** - Check DevTools for JS errors
- [ ] **No warnings** - React warnings resolved
- [ ] **Fast loads** - Initial page load < 3 seconds
- [ ] **No memory leaks** - Play multiple puzzles, check memory usage

---

## Critical Path Testing (High Priority)

**Must work perfectly before shipping:**

1. **New user journey**
   - [ ] Visit site → see landing page → click "Play"
   - [ ] Play puzzle → solve → see win dialog
   - [ ] Open stats → see 1 trophy
   - [ ] Sign in → trophy migrates → still shows 1 trophy

2. **Returning user journey**  
   - [ ] Visit site (signed out) → play puzzle
   - [ ] Sign in → preferences/trophies load
   - [ ] Solve puzzle → trophy saves
   - [ ] Refresh → game state persists

3. **Settings persistence**
   - [ ] Signed out → toggle dark mode ON
   - [ ] Sign in → dark mode stays ON (not reset)
   - [ ] Sign out → dark mode stays ON (new behavior!)
   - [ ] Refresh → dark mode still ON

---

## Known Limitations (Document, Don't Fix Now)

- No 4x4 difficulty (3x3 only for MVP)
- No archive puzzle selection (daily only + demo mode)
- No win/play streaks displayed (data tracked, UI not built)
- No share/social features
- Desktop-first design (mobile works but not optimized)

---

## Ship Checklist

- [ ] All critical path tests pass
- [ ] Zero console errors in production build
- [ ] Settings persistence works correctly
- [ ] Firebase env variables set correctly
- [ ] Demo mode works for screenshots
- [ ] README updated with current features
- [ ] Git committed and pushed
- [ ] Deployed to production URL
- [ ] Verify production build works (not just local dev)

---

## Testing Notes

**Browser DevTools Tips:**
- **Network tab**: Throttle to "Slow 3G" to test loading states
- **Application tab**: Check localStorage for signed-out progress  
- **Firestore console**: Verify gameState/preferences save correctly
- **Responsive mode**: Test mobile viewport (375x667 iPhone SE)

**Test Accounts:**
- Use 2 different Google accounts to test cross-device sync
- Use incognito mode to test signed-out experience
- Clear localStorage between tests: `localStorage.clear()`

**Demo Mode Puzzles for Screenshots:**
- Puzzle 134: 🍔 Hamburger
- Puzzle 50: 🥭 Mango  
- Puzzle 78: 😂 Face with Tears of Joy
- Test with: `?demo=134` etc.
