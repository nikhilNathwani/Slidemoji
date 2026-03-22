# Slidemoji Pre-Ship Testing Guide

**Goal**: Test all critical functionality in 4 end-to-end scenarios. Takes ~15 minutes.

---

## 🧪 Scenario 1: Brand New User (5 min)

**What you're testing**: First-time experience, gameplay basics, signed-out persistence

### Steps:

1. **Open in incognito window** (to simulate new user)
   - Go to: `http://localhost:5173` (or your dev URL)
   - ✅ Landing page appears with "Play" button

2. **Start playing**
   - Click "Play" button
   - ✅ Grid loads with scrambled emoji tiles
   - ✅ Numbers shown by default on tiles

3. **Test gameplay**
   - Click a tile next to the gap → ✅ Tile slides smoothly
   - Press arrow keys → ✅ Keyboard controls work
   - Try clicking multiple tiles rapidly → ✅ Only one moves at a time (blocking works)
   - ✅ No errors in DevTools console (F12 → Console tab)

4. **Change settings**
   - Open Settings (gear icon)
   - Toggle: Dark mode ON, Sound ON, Show numbers OFF
   - ✅ Theme changes immediately, tiles update

5. **Refresh mid-game**
   - Refresh the page (Cmd+R / Ctrl+R)
   - ✅ Puzzle resets (no progress saved - meant to encourage sign-in)
   - ✅ Settings still: Dark mode ON, Sound ON, Numbers OFF

6. **Solve a puzzle**
   - Solve the puzzle completely
   - ✅ Win dialog appears with trophy emoji
   - ✅ Numbers hide when solved
   - Click "View Trophies"
   - ✅ Stats dialog opens showing 1 trophy earned
   - ✅ Sign-in prompt displays: "Sign in to save your trophies across devices and complete your collection!"

**What to look for:**
- Smooth animations (no jank)
- Sound plays when enabled (toggle to hear difference)
- Settings persist across refresh
- In-progress game does NOT persist (signed-out users get ephemeral experience)
- Completed puzzle DOES persist (trophy saved to localStorage)

---

## 🔐 Scenario 2: Sign-In & Migration (4 min)

**What you're testing**: Authentication, trophy migration, Firestore sync

### Setup: Continue from Scenario 1 (you have 1 trophy in localStorage)

### Steps:

1. **Sign in with Google**
   - Click "Sign in with Google" from stats dialog
   - ✅ Google OAuth popup opens
   - Complete sign-in
   - ✅ Dialog closes, you're signed in (see your name in header)

2. **Verify trophy migrated**
   - Open stats dialog (trophy icon)
   - ✅ Still shows 1 trophy (migrated from localStorage to Firestore)
   - Check Firestore console → users/{yourUid}/stats/solvedPuzzles
   - ✅ Puzzle appears in Firestore

3. **Verify settings migrated**
   - ✅ Still: Dark mode ON, Sound ON, Numbers OFF (from Scenario 1)

4. **Test in-progress save**
   - Restart the puzzle (Play Again button)
   - Make 3-4 moves
   - Refresh the page
   - ✅ Puzzle resumes from where you left off (moves saved to Firestore)

5. **Change a setting while signed in**
   - Open Settings → Toggle Sound OFF
   - Check Firestore console → users/{yourUid}/preferences/soundEnabled
   - ✅ Updates to `false` in Firestore

**What to look for:**
- Signed-out trophy migrates seamlessly (user doesn't notice)
- In-progress game now persists (Firestore saves every move)
- Settings sync to Firestore in real-time

---

## 🔄 Scenario 3: Settings Persistence Across Sign-Out (3 min)

**What you're testing**: The new behavior - settings don't reset when signing out

### Setup: Continue from Scenario 2 (signed in with Sound OFF)

### Steps:

1. **Change settings while signed in**
   - Open Settings
   - Current state: Dark mode ON, Sound OFF, Numbers OFF
   - Change to: Dark mode OFF, Sound ON, Numbers ON
   - ✅ Theme switches to light, sound turns on

2. **Sign out**
   - Click your profile/name → Sign out
   - ✅ Successfully signed out

3. **Verify settings kept from signed-in state**
   - ✅ Still: Dark mode OFF (light theme), Sound ON, Numbers ON
   - **This is the new behavior!** Old behavior would have reverted to old signed-out values

4. **Refresh to confirm**
   - Refresh page
   - ✅ Still: Dark mode OFF, Sound ON, Numbers ON

5. **Change settings while signed out**  
   - Toggle: Dark mode ON, Sound OFF
   - Refresh page
   - ✅ New settings persist: Dark mode ON, Sound OFF

**What to look for:**
- Settings from signed-in state carry over to signed-out state
- localStorage gets overwritten with Firestore values on sign-in
- This matches behavior of sites like Wordle (respects user's choice even signed out)

---

## 📱 Scenario 4: Cross-Device Sync (3 min)

**What you're testing**: Firestore cloud sync, settings/progress across devices

### Setup: Requires 2 browser windows or 2 devices

### Steps:

1. **Device A: Sign in**
   - Open app in normal browser window
   - Sign in with Google Account #1
   - Current settings: Dark mode ON, Sound OFF, Numbers ON (from Scenario 3)

2. **Device A: Change settings**
   - Toggle: Dark mode OFF, Sound ON
   - Solve the current puzzle if not already solved
   - Note the trophy count (should be 1 from earlier)

3. **Device B: Sign in with same account**
   - Open app in incognito window (or different browser/device)
   - Sign in with same Google Account #1
   - ✅ Settings sync: Dark mode OFF, Sound ON
   - ✅ Trophy count matches Device A (1 trophy)

4. **Device B: Start the puzzle**
   - If puzzle not solved, make 3-4 moves
   - Leave it in-progress

5. **Device A: Refresh**
   - Refresh Device A
   - ✅ Puzzle resumes with moves from Device B (Firestore sync works)

6. **Device A: Solve puzzle**
   - Complete the puzzle
   - ✅ Win dialog appears, trophy count becomes 2

7. **Device B: Refresh**
   - Refresh Device B
   - ✅ Trophy count becomes 2 (synced from Device A)

**What to look for:**
- Settings sync between devices when signed in
- In-progress puzzle syncs in real-time
- Trophy collection syncs across devices
- This is the core value prop of signing in!

---

## ✅ Quick Browser Compatibility Check

**Test in 3 browsers (2 min each):**

1. **Chrome** (primary)
   - Run Scenario 1 (5 min)
   - ✅ Everything works

2. **Safari**
   - Open app → solve puzzle
   - ✅ Emoji SVG renders correctly
   - ✅ Animations smooth
   - ✅ Touch/click works

3. **Mobile (Chrome or Safari)**
   - Visit on phone
   - ✅ Grid scales correctly
   - ✅ Touch controls responsive
   - ✅ Readable on small screen

---

## 🚨 Red Flags to Watch For

**Stop and fix before shipping if you see:**

- ❌ Console errors in DevTools
- ❌ Tiles can move simultaneously (blocking broken)
- ❌ Settings reset when signing out (useEffect broken)
- ❌ Completed puzzle doesn't show trophy
- ❌ Refresh loses in-progress game when signed in
- ❌ Emoji doesn't render (shows blank/broken image)
- ❌ Grid corrupts or shows JSX errors

---

## 📊 Quick Firestore Verification

**After running scenarios, check Firebase Console:**

1. **Authentication tab**
   - ✅ Your test account appears

2. **Firestore Database → users/{yourUid}**
   - ✅ `preferences`: `{ darkMode: boolean, soundEnabled: boolean, showNumbers: boolean }`
   - ✅ `stats.solvedPuzzles`: Contains 2 puzzles (Puzzle IDs with metadata)
   - ✅ `gameState`: Either null (if solved) or contains current grid state

---

## 🎯 Final Ship Checklist

Before deploying:

- [ ] All 4 scenarios completed successfully
- [ ] Zero console errors
- [ ] Settings persist after sign-out (Scenario 3 passed)
- [ ] Cross-device sync works (Scenario 4 passed)
- [ ] Firestore data looks correct
- [ ] No console.log statements visible
- [ ] README.md updated
- [ ] Git committed and pushed
- [ ] Test production build (not just dev): `npm run build && npm run preview`

**Total Testing Time: ~15 minutes**
