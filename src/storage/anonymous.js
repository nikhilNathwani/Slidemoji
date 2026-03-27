/**
 * Anonymous Storage - localStorage operations for signed-out users
 *
 * This module is the single source of truth for all localStorage operations.
 * Signed-in users use Firestore directly with automatic offline persistence (IndexedDB).
 *
 * Handles:
 * 1. Game state - puzzle progress for anonymous users
 * 2. Preferences - settings for anonymous users
 * 3. Cleanup - removing old puzzle data
 *
 * Game state schema matches Firestore format for consistency:
 * {
 *   normal: [grid array],     // 0 for gap
 *   hard: [grid array],        // 0 for gap
 *   currentDifficulty: 'normal' | 'hard',
 *   solved: { normal: boolean, hard: boolean }
 * }
 */

/**
 * Get game state from localStorage for anonymous users
 * @param {number} puzzleId - Puzzle ID
 * @returns {Object|null} Game state or null if not found
 */
export function getAnonymousGameState(puzzleId) {
	const key = `signedOutProgress_${puzzleId}`;
	const data = localStorage.getItem(key);
	if (!data) return null;

	try {
		return JSON.parse(data);
	} catch (error) {
		console.error("[localStorage] Error parsing game state:", error);
		return null;
	}
}

/**
 * Save game state to localStorage for anonymous users
 * @param {number} puzzleId - Puzzle ID
 * @param {string} difficulty - Difficulty level
 * @param {Array} grid - Grid array (null for gap - will be converted to 0)
 */
export function saveAnonymousGameState(puzzleId, difficulty, grid) {
	const existing = getAnonymousGameState(puzzleId) || {};

	// Convert null gaps to 0 to match Firestore schema
	const normalizedGrid = grid.map((cell) => (cell === null ? 0 : cell));

	const updated = {
		...existing,
		[difficulty]: normalizedGrid,
		currentDifficulty: difficulty,
	};

	// Check if puzzle is solved (import dynamically to avoid circular deps)
	import("../utils/gridHelpers.js").then(({ checkWin }) => {
		const isSolved = checkWin(grid);
		if (isSolved) {
			updated.solved = {
				...(existing.solved || {}),
				[difficulty]: true,
			};
			localStorage.setItem(
				`signedOutProgress_${puzzleId}`,
				JSON.stringify(updated),
			);
		} else {
			localStorage.setItem(
				`signedOutProgress_${puzzleId}`,
				JSON.stringify(updated),
			);
		}
	});
}

/**
 * Clear localStorage data for a puzzle (used after migration to Firestore)
 * @param {number} puzzleId - Puzzle ID
 */
export function clearAnonymousGameState(puzzleId) {
	localStorage.removeItem(`signedOutProgress_${puzzleId}`);
}

/**
 * Clean up old puzzle data from localStorage
 * Only keeps data for the current puzzle ID (today's puzzle)
 * Call this on app initialization
 * @param {number} currentPuzzleId - Current puzzle ID
 */
export function cleanupOldPuzzleData(currentPuzzleId) {
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
}

// ===== PREFERENCE OPERATIONS =====
// localStorage operations for user preferences (anonymous and signed-in fallback)

/**
 * Get preference value from localStorage
 * @param {string} key - Preference key (e.g., 'darkMode', 'soundEnabled', or 'soundEnabled_123' for context-scoped)
 * @param {*} defaultValue - Default value if preference not found
 * @returns {*} Preference value
 */
export function getAnonymousPreference(key, defaultValue) {
	const saved = localStorage.getItem(key);
	return saved !== null ? JSON.parse(saved) : defaultValue;
}

/**
 * Save preference value to localStorage
 * @param {string} key - Preference key
 * @param {*} value - Value to save
 */
export function setAnonymousPreference(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}
