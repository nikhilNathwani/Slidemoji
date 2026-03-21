/**
 * localStorage utilities for signed-out user progress and preferences
 *
 * Two types of data:
 * 1. Game completions (trophies) - signedOutProgress_${puzzleId}
 * 2. User preferences - direct keys like 'darkMode', 'soundEnabled', etc.
 *
 * Signed-out users have limited persistence:
 * - Completions (trophies) persist until sign-in (then migrated to Firestore)
 * - Preferences persist locally (signed-in users sync to Firestore)
 * - In-progress work is ephemeral (lost on refresh) to incentivize sign-in
 *
 * 3x3 only - no difficulty variations
 */

// ===== Game Completion Storage =====

// Get localStorage key for signed-out progress (3x3 only)
export const getLocalStorageKey = (puzzleId) => `signedOutProgress_${puzzleId}`;

// Read signed-out completion from localStorage
export const getLocalCompletion = (puzzleId) => {
	const key = getLocalStorageKey(puzzleId);
	const data = localStorage.getItem(key);
	return data ? JSON.parse(data) : null;
};

// Save signed-out completion to localStorage (just a flag, no grid state)
export const saveLocalCompletion = (puzzleId) => {
	localStorage.setItem(
		getLocalStorageKey(puzzleId),
		JSON.stringify({ isCompleted: true }),
	);
};

// Clear localStorage after migration
export const clearLocalProgress = (puzzleId) => {
	localStorage.removeItem(getLocalStorageKey(puzzleId));
};

// Check if signed-out user completed this puzzle
export const isSignedOutPuzzleSolved = (puzzleId) => {
	const completion = getLocalCompletion(puzzleId);
	return !!completion?.isCompleted;
};

// ===== Preference Storage =====

/**
 * Get preference from localStorage
 * @param {string} key - Preference key (e.g., 'darkMode', 'soundEnabled')
 * @param {*} defaultValue - Default if not found
 * @returns {*} Parsed value or default
 */
export const getLocalPreference = (key, defaultValue) => {
	const saved = localStorage.getItem(key);
	return saved !== null ? JSON.parse(saved) : defaultValue;
};

/**
 * Save preference to localStorage
 * @param {string} key - Preference key
 * @param {*} value - Value to save (will be JSON stringified)
 */
export const saveLocalPreference = (key, value) => {
	localStorage.setItem(key, JSON.stringify(value));
};
