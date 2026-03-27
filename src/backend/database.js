/**
 * Database Operations
 *
 * This module handles all database operations for Slidemoji, including:
 * - User data management (preferences, stats, trophies)
 * - Game state persistence (resume games, track progress)
 * - Streak calculation (play streaks and win streaks)
 * - Archive puzzle support (past puzzles don't affect streaks)
 *
 * See FIRESTORE_SCHEMA.md for complete database schema documentation.
 */

import {
	doc,
	getDoc,
	setDoc,
	updateDoc,
	serverTimestamp,
	Timestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getLatestPuzzleId } from "../utils/puzzleUtils";
import { DIFFICULTY, DEFAULT_DIFFICULTY } from "../constants";

/**
 * User data structure (see FIRESTORE_SCHEMA.md for full documentation):
 * {
 *   uid: string,
 *   email: string,
 *   displayName: string,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 *   preferences: {
 *     darkMode: boolean,
 *     soundEnabled: boolean,
 *     showNumbers: boolean,
 *   },
 *   stats: {
 *     solvedPuzzles: {
 *       [puzzleId]: {
 *         moves: number,
 *         completedAt: Timestamp,
 *         startedAt: Timestamp,
 *         timeSpent: number,
 *         fromArchive: boolean,
 *         emoji: string,
 *         emojiName: string,
 *       }
 *     }
 *   },
 *   gameState: {
 *     [puzzleId]: {
 *       moves: number,
 *       grid: array,
 *       startedAt: Timestamp,
 *       fromArchive: boolean,
 *     }
 *   } || null
 * }
 */

/**
 * Get user data from Firestore
 *
 * Retrieves the complete user document including:
 * - preferences (dark mode, etc.)
 * - stats (streaks, totals, solved puzzles)
 * - gameState (in-progress games for resume)
 *
 * @param {string} userId - Firebase Auth user ID (uid)
 * @returns {Promise<Object|null>} User data object or null if not found
 */
export async function getUserData(userId) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		const userDoc = await getDoc(userDocRef);

		if (userDoc.exists()) {
			return userDoc.data();
		}
		return null;
	} catch (error) {
		console.error("[FIRESTORE] Error getting user data:", {
			message: error.message,
			code: error.code,
			name: error.name,
			stack: error.stack,
		});
		throw error;
	}
}

/**
 * Create initial user data in Firestore (first-time sign-in)
 *
 * Called automatically by auth.js when a new user signs in.
 * Sets up default preferences, initializes stats at 0, and creates empty game state.
 *
 * @param {string} userId - Firebase Auth user ID (uid)
 * @param {Object} userData - User info from Google Auth (email, displayName)
 * @returns {Promise<Object>} The created user data
 */
export async function createUserData(userId, userData = {}) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		const initialData = {
			uid: userId,
			email: userData.email || null,
			displayName: userData.displayName || null,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			preferences: {
				darkMode: false, // Default to light mode
				soundEnabled: true, // Default to sound on
			},
			stats: {
				// Trophy collection: track which puzzles are solved (3x3 only)
				// Just stores puzzleId: true (emoji/emojiName looked up from puzzles collection)
				solvedPuzzles: {},
			},
			// In-progress games (for resume functionality)
			gameState: null,
		};

		await setDoc(userDocRef, initialData);
		return initialData;
	} catch (error) {
		console.error("Error creating user data:", error);
		throw error;
	}
}

/**
 * Update user preferences (dark mode, etc.)
 *
 * @param {string} userId - Firebase Auth user ID (uid)
 * @param {Object} preferences - Preferences object { darkMode: boolean }
 */
export async function updateUserPreferences(userId, preferences) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		// Use dot notation to merge nested fields instead of replacing entire object
		// This prevents wiping out other preference fields when updating just one
		const updates = {
			updatedAt: serverTimestamp(),
		};
		// Convert { darkMode: true } to { "preferences.darkMode": true }
		for (const [key, value] of Object.entries(preferences)) {
			updates[`preferences.${key}`] = value;
		}
		await updateDoc(userDocRef, updates);
	} catch (error) {
		console.error("Error updating user preferences:", error);
		throw error;
	}
}

/**
 * Save puzzle start - creates game state
 *
 * Called when user starts a new puzzle.
 *
 * What it does:
 * 1. Creates gameState entry: gameState[puzzleId]
 * 2. Determines if this is a daily puzzle or archive play
 *
 * @param {string} userId - Firebase Auth user ID
 * @param {number} puzzleId - Puzzle number (1-365)
 * @param {Array} initialGrid - Starting grid configuration from Firestore
 * @param {string} difficulty - Difficulty level (DIFFICULTY.NORMAL or DIFFICULTY.HARD)
 * @returns {Promise<Object>} Updated gameState and stats
 */
export async function saveGameStart(
	userId,
	puzzleId,
	initialGrid,
	difficulty = DEFAULT_DIFFICULTY,
) {
	if (!userId) {
		throw new Error("User ID is required");
	}
	if (!initialGrid || !Array.isArray(initialGrid)) {
		throw new Error("Initial grid is required and must be an array");
	}

	try {
		const userData = await getUserData(userId);
		if (!userData) {
			throw new Error("User data not found");
		}

		let gameState = userData.gameState || {};
		// Ensure stats structure exists (in case user data was corrupted/deleted)
		let stats = userData.stats
			? { ...userData.stats }
			: { solvedPuzzles: {} };
		if (!stats.solvedPuzzles) {
			stats.solvedPuzzles = {};
		}

		// Convert client format (null as gap) to Firestore format (0 as gap)
		const firestoreGrid = initialGrid.map((v) => (v === null ? 0 : v));

		// Initialize game state for this puzzle at this difficulty
		// Structure: gameState[puzzleId][difficulty] = Array (grid directly)
		// Also track currentDifficulty to determine which difficulty to show on next load
		if (!gameState[puzzleId]) {
			gameState[puzzleId] = {};
		}
		gameState[puzzleId][difficulty] = firestoreGrid;
		gameState[puzzleId].currentDifficulty = difficulty;

		// Save to Firestore
		const userDocRef = doc(db, "users", userId);
		await updateDoc(userDocRef, {
			gameState,
			updatedAt: serverTimestamp(),
		});

		return { gameState };
	} catch (error) {
		console.error("Error starting puzzle:", error);
		throw error;
	}
}

/**
 * Save game state (in-progress or restart)
 *
 * Stores the current grid state in Firestore when:
 * 1. User makes a move (in-progress game)
 * 2. User restarts puzzle (resets to initial state)
 *
 * @param {string} userId - Firebase Auth user ID
 * @param {number} puzzleId - Puzzle number (1-365)
 * @param {Object} gameData - { grid: Array, difficulty: string }
 */
export async function saveGameState(userId, puzzleId, gameData) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		// Convert client format (null as gap) to Firestore format (0 as gap)
		const firestoreGrid = gameData.grid.map((v) => (v === null ? 0 : v));
		// Use dot notation to update only this specific nested field
		// This is more efficient than reading, modifying, and writing the entire document
		// Structure: gameState[puzzleId][difficulty] = Array (grid directly)
		// Also update currentDifficulty to track which difficulty to show on next load
		const updateData = {
			[`gameState.${puzzleId}.${gameData.difficulty}`]: firestoreGrid,
			[`gameState.${puzzleId}.currentDifficulty`]: gameData.difficulty,
			updatedAt: serverTimestamp(),
		};
		await updateDoc(userDocRef, updateData);
	} catch (error) {
		console.error("Error saving game state:", error);
		throw error;
	}
}

/**
 * Save solved puzzle (trophy tracking)
 *
 * Called when user solves a puzzle.
 *
 * What it does:
 * - Marks puzzle as solved in solvedPuzzles[puzzleId][difficulty] = true
 * - Does NOT clear gameState (grid is kept for display/history)
 *
 * Trophy System:
 * - Each puzzle completion tracks both difficulties separately: { DIFFICULTY.NORMAL: true, DIFFICULTY.HARD: true }
 * - Trophy case shows the MAX difficulty achieved (DIFFICULTY.HARD > DIFFICULTY.NORMAL)
 * - During gameplay, trophy shows if you've beaten the CURRENT difficulty
 * - Emoji/emojiName are fetched from puzzles collection (not duplicated here)
 *
 * @param {string} userId - Firebase Auth user ID
 * @param {number} puzzleId - Puzzle number (1-365)
 * @param {string} difficulty - Difficulty level (DIFFICULTY.NORMAL or DIFFICULTY.HARD)
 * @returns {Promise<Object>} Updated stats
 */
export async function saveSolvedPuzzle(userId, puzzleId, difficulty) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userData = await getUserData(userId);
		if (!userData) {
			throw new Error("User data not found");
		}

		let stats = userData.stats
			? { ...userData.stats }
			: { solvedPuzzles: {} };

		// Ensure trophy structure exists
		if (!stats.solvedPuzzles) {
			stats.solvedPuzzles = {};
		}

		// Initialize puzzle entry if it doesn't exist
		if (!stats.solvedPuzzles[puzzleId]) {
			stats.solvedPuzzles[puzzleId] = {};
		}

		// Mark this specific difficulty as completed
		stats.solvedPuzzles[puzzleId][difficulty] = true;

		// Save to Firestore (keep gameState intact - no need to delete solved grids)
		const userDocRef = doc(db, "users", userId);
		await updateDoc(userDocRef, {
			stats,
			updatedAt: serverTimestamp(),
		});

		return { stats };
	} catch (error) {
		console.error("Error saving completion:", error);
		throw error;
	}
}

/**
 * Clean up abandoned games from gameState
 *
 * Removes in-progress games for puzzles more than 7 days old.
 * This keeps the user document size manageable and removes stale data.
 *
 * Called periodically (e.g., on app load or when starting new puzzle).
 *
 * @param {string} userId - Firebase Auth user ID
 */
export async function cleanupOldGames(userId) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userData = await getUserData(userId);
		if (!userData || !userData.gameState) {
			return;
		}

		const gameState = { ...userData.gameState };
		const cutoffPuzzleId = getLatestPuzzleId() - 7;

		Object.keys(gameState).forEach((puzzleId) => {
			if (parseInt(puzzleId) < cutoffPuzzleId) {
				delete gameState[puzzleId];
			}
		});

		const userDocRef = doc(db, "users", userId);
		await updateDoc(userDocRef, {
			gameState: Object.keys(gameState).length > 0 ? gameState : null,
			updatedAt: serverTimestamp(),
		});
	} catch (error) {
		console.error("Error cleaning up old games:", error);
		throw error;
	}
}
