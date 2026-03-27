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
 * Format: { [DIFFICULTY.NORMAL]: boolean, [DIFFICULTY.HARD]: boolean, currentDifficulty: string }
 */

import { DIFFICULTY } from "../constants";

/**
 * Clean up old puzzle data from localStorage
 * Only keeps data for the current puzzle ID (today's puzzle)
 * Call this on app initialization
 */
export const cleanupOldPuzzleData = (currentPuzzleId) => {
	const keysToRemove = [];

	// Scan all localStorage keys
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key && key.startsWith("signedOutProgress_")) {
			const puzzleId = parseInt(key.replace("signedOutProgress_", ""));
			// Remove if not current puzzle
			if (puzzleId !== currentPuzzleId) {
				keysToRemove.push(key);
			}
		}
	}

	// Remove old entries
	keysToRemove.forEach((key) => localStorage.removeItem(key));

	if (keysToRemove.length > 0) {
		console.log(
			`[localStorage] Cleaned up ${keysToRemove.length} old puzzle entries`,
		);
	}
};

// ===== Game Completion Storage =====

// Get localStorage key for signed-out progress
export const getLocalStorageKey = (puzzleId) => `signedOutProgress_${puzzleId}`;

// Read signed-out completion from localStorage
export const getLocalCompletion = (puzzleId) => {
	const key = getLocalStorageKey(puzzleId);
	const data = localStorage.getItem(key);
	if (!data) return null;

	const parsed = JSON.parse(data);
	// Handle legacy formats:
	// 1. { isCompleted: true } -> { [DIFFICULTY.NORMAL]: true }
	// 2. { maxDifficulty: 'normal' | 'hard' } -> { [DIFFICULTY.NORMAL]: true } or { [DIFFICULTY.NORMAL]: true, [DIFFICULTY.HARD]: true }
	if (
		parsed.isCompleted &&
		!parsed[DIFFICULTY.NORMAL] &&
		!parsed[DIFFICULTY.HARD]
	) {
		return { [DIFFICULTY.NORMAL]: true };
	}
	if (
		parsed.maxDifficulty &&
		!parsed[DIFFICULTY.NORMAL] &&
		!parsed[DIFFICULTY.HARD]
	) {
		return {
			[DIFFICULTY.NORMAL]: true,
			[DIFFICULTY.HARD]: parsed.maxDifficulty === DIFFICULTY.HARD,
		};
	}
	return parsed;
};

// Save signed-out solved puzzle to localStorage
// Tracks both difficulties separately and remembers current difficulty
export const saveLocalSolvedPuzzle = (puzzleId, difficulty) => {
	const existing = getLocalCompletion(puzzleId);

	localStorage.setItem(
		getLocalStorageKey(puzzleId),
		JSON.stringify({
			...existing,
			[difficulty]: true,
			currentDifficulty: difficulty,
		}),
	);
};

// Clear localStorage after migration
export const clearLocalProgress = (puzzleId) => {
	localStorage.removeItem(getLocalStorageKey(puzzleId));
};

// Check if signed-out user completed this puzzle at this difficulty
export const isSignedOutPuzzleSolved = (puzzleId, difficulty) => {
	const completion = getLocalCompletion(puzzleId);
	return !!completion?.[difficulty];
};

// Get the current difficulty for a signed-out user
export const getLocalCurrentDifficulty = (puzzleId) => {
	const completion = getLocalCompletion(puzzleId);
	return completion?.currentDifficulty || null;
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
