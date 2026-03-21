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
 *     totalAttempted: number,
 *     totalSolved: number,
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
				// High-level counters
				totalAttempted: 0,
				totalSolved: 0,
				// Trophy collection: one per puzzle ID (3x3 only)
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
 * 3. Increments totalAttempted (only first time trying this puzzle)
 *
 * @param {string} userId - Firebase Auth user ID
 * @param {number} puzzleId - Puzzle number (1-365)
 * @param {Array} initialGrid - Starting grid configuration from Firestore
 * @returns {Promise<Object>} Updated gameState and stats
 */
export async function saveGameStart(userId, puzzleId, initialGrid) {
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

		// Is this an archive puzzle (old puzzle) or today's daily?
		const fromArchive = puzzleId !== getLatestPuzzleId();
		let gameState = userData.gameState || {};
		// Ensure stats structure exists (in case user data was corrupted/deleted)
		let stats = userData.stats ? { ...userData.stats } : { totalAttempted: 0, totalSolved: 0, solvedPuzzles: {} };
		// Initialize game state for this puzzle (3x3 only)
		gameState[puzzleId] = {
			grid: firestoreGrid,
			fromArchive, // Track whether this is a daily or archive play
		};

		// Increment attempts counter (only if first time trying this puzzle)
		// If user already solved it, we still allow retry but don't re-count it
		if (!stats.solvedPuzzles?.[puzzleId]) {
			stats.totalAttempted++;
		}

		// Save to Firestore
		const userDocRef = doc(db, "users", userId);
		await updateDoc(userDocRef, {
			gameState,
			stats,
			updatedAt: serverTimestamp(),
		});

		return { gameState, stats };
	} catch (error) {
		console.error("Error starting puzzle:", error);
		throw error;
	}
}

/**
 * Save game state on every move (auto-save for resume)
 *
 * Called after each tile movement to persist progress.
 * Uses Firestore's dot notation to update nested fields efficiently.
 *
 * @param {string} userId - Firebase Auth user ID
 * @param {number} puzzleId - Puzzle number (1-365)
 * @param {Object} gameData - { grid: Array }
 */
export async function saveGameMove(userId, puzzleId, gameData) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		// Convert client format (null as gap) to Firestore format (0 as gap)
		const firestoreGrid = gameData.grid.map((v) => (v === null ? 0 : v));
		// Use dot notation to update only this specific nested field
		// This is more efficient than reading, modifying, and writing the entire document
		await updateDoc(userDocRef, {
			[`gameState.${puzzleId}.grid`]: firestoreGrid,

			updatedAt: serverTimestamp(),
		});
	} catch (error) {
		console.error("Error saving game state:", error);
		throw error;
	}
}

/**
 * Save completion when puzzle is won (trophy tracking)
 *
 * Called when user solves a puzzle.
 *
 * What it does:
 * 1. Saves trophy to solvedPuzzles[puzzleId][difficulty] with emoji data
 * 2. Increments totalSolved counter
 * 3. Clears the game from gameState (puzzle is done)
 *
 * Trophy System:
 * - Each puzzle has one solution (3x3 only)
 * - solvedPuzzles[1] contains the trophy data
 *
 * @param {string} userId - Firebase Auth user ID
 * @param {number} puzzleId - Puzzle number (1-365)
 * @param {Object} completionData - { emoji: string, emojiName: string }
 * @returns {Promise<Object>} Updated stats
 */
export async function saveGameCompletion(userId, puzzleId, completionData) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userData = await getUserData(userId);
		if (!userData) {
			throw new Error("User data not found");
		}

		let gameState = userData.gameState || {};
		let stats = { ...userData.stats };

		// Get the saved game state for this puzzle
		const game = gameState[puzzleId];
		if (!game) {
			throw new Error("Game state not found for this puzzle");
		}

		// Check if this was a daily puzzle or archive play
		const fromArchive = game.fromArchive;

		// Ensure trophy structure exists
		if (!stats.solvedPuzzles) {
			stats.solvedPuzzles = {};
		}

		// Save solve trophy with emoji data
		const completedAt = Timestamp.now();

		stats.solvedPuzzles[puzzleId] = {
			completedAt,
			fromArchive, // Preserve whether this was daily or archive
			emoji: completionData.emoji,
			emojiName: completionData.emojiName,
		};

		// Update totals (both daily and archive count here)
		stats.totalSolved++;

		// Clear this game from gameState (puzzle is complete!)
		// But keep other in-progress games (user might be playing multiple puzzles)
		delete gameState[puzzleId];

		// Save to Firestore
		const userDocRef = doc(db, "users", userId);
		await updateDoc(userDocRef, {
			gameState: Object.keys(gameState).length > 0 ? gameState : null,
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
