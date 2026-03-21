# Simplification Plan: Remove 4x4 Difficulty (3x3 Only MVP)

## Branch Strategy

- **Feature branch**: `feature/4x4-difficulty` - Preserves current dual-difficulty implementation
- **Main branch**: Simplified to 3x3 only

## Changes Needed to Simplify to 3x3 Only

### 1. Remove Grid Size Preference Management

- ❌ Remove `gridSize` from usePreference in App.jsx
- ❌ Remove `gridSize` state and setter
- ✅ Hardcode gridSize to 3 throughout

### 2. Database Schema Simplification

- **Current**: `solvedPuzzles: { [puzzleId]: { 3: {...}, 4: {...} } }`
- **Simplified**: `solvedPuzzles: { [puzzleId]: {...} }` (flat object)
- Update: `database.js`, `mockData.js`

### 3. localStorage Simplification

- **Current**: `signedOutProgress_${puzzleId}_${gridSize}`
- **Simplified**: `signedOutProgress_${puzzleId}` (no gridSize suffix)
- Update: `localStorage.js`

### 4. Hooks Simplification

- **useLoadGame**: Remove gridSize param, always use 3
- **useSaveGame**: Remove gridSize param
- **usePreference**: Remove gridSize preference entirely
- **useUser**: Simplified query (no gridSize needed)

### 5. Components Simplification

- **App.jsx**: Remove gridSize state, pass hardcoded 3, use `isSolved` boolean instead of `maxGridSizeSolved`
- **Game.jsx**: Remove gridSize prop, use constant, pass `isSolved` to Trophy
- **SettingsDialog**: Remove difficulty toggle UI
- **GameActionButton**: Remove "Try Hard mode?" button logic
- **Trophy**: Remove teal variant (only gold/grey), use `isSolved` prop instead of `maxGridSizeSolved`
- **StatsHelpers**: Remove `getMaxGridSizeSolved` function (moot with single grid size)
- **localStorage**: Replace `getSignedOutMaxSolved` with `isSignedOutPuzzleSolved` boolean

### 6. Constants

- Keep DIFFICULTIES but note only 3x3 is used
- Or remove entirely if not needed

### 7. Firestore Rules

- Simplify validation rules (no nested gridSize checks)

## Files to Modify

1. `src/App.jsx` - Remove gridSize preference, hardcode 3
2. `src/components/game/Game.jsx` - Remove gridSize prop
3. `src/components/game/GameActionButton.jsx` - Remove difficulty logic
4. `src/components/dialogs/SettingsDialog.jsx` - Remove difficulty toggle
5. `src/components/common/Trophy.jsx` - Remove teal variant
6. `src/hooks/useLoadGame.js` - Always use gridSize=3
7. `src/hooks/useSaveGame.js` - Remove gridSize param
8. `src/hooks/usePreference.js` - No changes needed (just not used for gridSize)
9. `src/backend/database.js` - Flatten solvedPuzzles structure
10. `src/utils/localStorage.js` - Remove gridSize from keys
11. `src/utils/statsHelpers.js` - Simplify trophy logic
12. `src/dev/mockData.js` - Flatten mock data
13. `src/constants.js` - Document 3x3 only

## How to Bring 4x4 Back Later

When ready to restore dual difficulty:

1. **Merge strategy**:

    ```bash
    git checkout main
    git merge feature/4x4-difficulty
    ```

2. **Expect conflicts in**:
    - Database schema changes (manual merge needed)
    - State management (preference handling)
    - Component props
3. **Testing checklist**:
    - [ ] Sign-in/sign-out with both difficulties
    - [ ] Trophy colors (gold/teal/grey)
    - [ ] localStorage migration
    - [ ] Firestore data migration for existing users
4. **Migration plan for users**:
    - Add migration logic to convert flat `solvedPuzzles` to nested structure
    - Run migration on first app load after update

## Benefits of Simplification

✅ Fewer state permutations to test
✅ Clearer data model
✅ Easier to implement archive feature
✅ Faster to debug sign-in/sign-out flows
✅ Better MVP focus - polish one difficulty first
✅ Can always bring 4x4 back with confident merge

## Timeline Estimate

- Simplification: 30-45 minutes
- Testing: 15-20 minutes
- Total: ~1 hour to simplified MVP
