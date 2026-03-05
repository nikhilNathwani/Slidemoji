/**
 * Firestore Database Operations
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
import { db } from "./config";
import {
	getTodaysDate,
	getYesterdaysDate,
	getTodaysPuzzleNumber,
} from "../utils/dateUtils";

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
 *   },
 *   stats: {
 *     totalAttempted: number,
 *     totalCompleted: number,
 *     currentPlayStreak: number,
 *     maxPlayStreak: number,
 *     currentWinStreak: number,
 *     maxWinStreak: number,
 *     lastPlayedDate: string (YYYY-MM-DD),
 *     completedPuzzles: {
 *       [puzzleId]: {
 *         [difficulty]: {
 *           moves: number,
 *           completedAt: Timestamp,
 *           startedAt: Timestamp,
 *           timeSpent: number,
 *           fromArchive: boolean,
 *         }
 *       }
 *     }
 *   },
 *   gameState: {
 *     [puzzleId]: {
 *       [difficulty]: {
 *         moves: number,
 *         board: array,
 *         startedAt: Timestamp,
 *         fromArchive: boolean,
 *       }
 *     }
 *   } || null
 * }
 */

/**
 * Get user data from Firestore
 *
 * Retrieves the complete user document including:
 * - preferences (dark mode, etc.)
 * - stats (streaks, totals, completed puzzles)
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
		console.log("[FIRESTORE] Getting user data for:", userId);
		const userDocRef = doc(db, "users", userId);
		const userDoc = await getDoc(userDocRef);

		if (userDoc.exists()) {
			console.log("[FIRESTORE] User data found");
			return userDoc.data();
		}
		console.log("[FIRESTORE] User document does not exist, returning null");
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
			},
			stats: {
				// High-level counters
				totalAttempted: 0,
				totalCompleted: 0,
				// Play streak: consecutive days played (any attempt)
				currentPlayStreak: 0,
				maxPlayStreak: 0,
				// Win streak: consecutive days with at least one completion
				currentWinStreak: 0,
				maxWinStreak: 0,
				lastPlayedDate: null, // YYYY-MM-DD format
				// Trophy collection: nested by puzzle ID → difficulty
				completedPuzzles: {},
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
		await updateDoc(userDocRef, {
			preferences,
			updatedAt: serverTimestamp(),
		});
	} catch (error) {
		console.error("Error updating user preferences:", error);
		throw error;
	}
}

/**
 * Start a puzzle - creates game state and updates play streak
 *
 * Called when user starts a new puzzle or switches difficulty.
 *
 * What it does:
 * 1. Creates nested gameState entry: gameState[puzzleId][difficulty]
 * 2. Determines if this is a daily puzzle or archive play
 * 3. Increments totalAttempted (only first time trying this puzzle+difficulty)
 * 4. Updates play streak (Wordle-style, daily puzzles only)
 *
 * Play Streak Logic:
 * - If played yesterday → continue streak
 * - If first play today (but not yesterday) → reset to 1
 * - If already played today → no change
 * - Archive plays DON'T update streaks
 *
 * @param {string} userId - Firebase Auth user ID
 * @param {number} puzzleId - Puzzle number (1-365)
 * @param {number} difficulty - Grid size (3 or 4)
 * @param {Array} initialBoard - Starting board configuration from Firestore
 * @returns {Promise<Object>} Updated gameState and stats
 */
export async function startPuzzle(userId, puzzleId, difficulty, initialBoard) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userData = await getUserData(userId);
		if (!userData) {
			throw new Error("User data not found");
		}

		// Is this an archive puzzle (old puzzle) or today's daily?
		const fromArchive = puzzleId !== getTodaysPuzzleNumber();
		let gameState = userData.gameState || {};
		let stats = { ...userData.stats };

		// Create nested structure: gameState[puzzleId][difficulty]
		if (!gameState[puzzleId]) {
			gameState[puzzleId] = {};
		}

		// Convert client format (null as gap) to Firestore format (0 as gap)
		const firestoreBoard = initialBoard.map((v) => (v === null ? 0 : v));

		// Initialize game state for this specific puzzle+difficulty combo
		gameState[puzzleId][difficulty] = {
			moves: 0,
			board: firestoreBoard,
			startedAt: Timestamp.now(),
			fromArchive, // Track whether this is a daily or archive play
		};

		// Increment attempts counter (only if first time trying this puzzle+difficulty)
		// If user already completed this combo, we still allow retry but don't re-count it
		if (!stats.completedPuzzles?.[puzzleId]?.[difficulty]) {
			stats.totalAttempted++;
		}

		// Update play streak - ONLY for daily puzzles, not archive
		// This encourages daily engagement without penalizing casual archive play
		if (!fromArchive) {
			const today = getTodaysDate(); // e.g., "2026-03-03"
			const yesterday = getYesterdaysDate(); // e.g., "2026-03-02"

			if (stats.lastPlayedDate === yesterday) {
				// Continuing streak - played yesterday and now playing today
				stats.currentPlayStreak++;
				stats.maxPlayStreak = Math.max(
					stats.maxPlayStreak,
					stats.currentPlayStreak,
				);
			} else if (stats.lastPlayedDate !== today) {
				// First play today, but didn't play yesterday - streak broken, reset to 1
				stats.currentPlayStreak = 1;
			}
			// If lastPlayedDate === today, user already played today, don't update

			stats.lastPlayedDate = today;
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
 * Within free tier limits: ~400 daily active users can save every move!
 * (5k writes/day at 50 moves/user = plenty of capacity)
 *
 * @param {string} userId - Firebase Auth user ID
 * @param {number} puzzleId - Puzzle number (1-365)
 * @param {number} difficulty - Grid size (3 or 4)
 * @param {Object} gameData - { moves: number, board: Array }
 */
export async function saveGameState(userId, puzzleId, difficulty, gameData) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		// Convert client format (null as gap) to Firestore format (0 as gap)
		const firestoreBoard = gameData.board.map((v) => (v === null ? 0 : v));
		// Use dot notation to update only these specific nested fields
		// This is more efficient than reading, modifying, and writing the entire document
		await updateDoc(userDocRef, {
			[`gameState.${puzzleId}.${difficulty}.moves`]: gameData.moves,
			[`gameState.${puzzleId}.${difficulty}.board`]: firestoreBoard,
			updatedAt: serverTimestamp(),
		});
	} catch (error) {
		console.error("Error saving game state:", error);
		throw error;
	}
}

/**
 * Save completion when puzzle is won (trophy + win streak logic)
 *
 * Called when user completes a puzzle. This is the most complex persistence function!
 *
 * What it does:
 * 1. Saves trophy to completedPuzzles[puzzleId][difficulty] with moves/time stats
 * 2. Calculates time spent (completedAt - startedAt)
 * 3. Increments totalCompleted counter
 * 4. Updates win streak (daily puzzles only, first win of the day)
 * 5. Clears the game from gameState (puzzle is done)
 *
 * Win Streak Logic:
 * - Only daily puzzles update win streak (archive plays tracked but don't affect streaks)
 * - Only counts first WIN of the day (can play multiple difficulties, only first counts)
 * - If won yesterday or today → continue streak
 * - If won today but not yesterday → reset to 1
 *
 * Trophy System:
 * - User can complete same puzzle on multiple difficulties
 * - Each completion saved separately: completedPuzzles[1][3] and completedPuzzles[1][4]
 * - UI shows highest difficulty trophy (4x4 > 3x3)
 *
 * @param {string} userId - Firebase Auth user ID
 * @param {number} puzzleId - Puzzle number (1-365)
 * @param {number} difficulty - Grid size (3 or 4)
 * @param {Object} completionData - { moves: number }
 * @returns {Promise<Object>} Updated stats
 */
export async function saveCompletion(
	userId,
	puzzleId,
	difficulty,
	completionData,
) {
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

		// Get the saved game state for this puzzle+difficulty
		const game = gameState[puzzleId]?.[difficulty];
		if (!game) {
			throw new Error("Game state not found for this puzzle+difficulty");
		}

		// Check if this was a daily puzzle or archive play
		const fromArchive = game.fromArchive;

		// Ensure nested trophy structure exists
		if (!stats.completedPuzzles) {
			stats.completedPuzzles = {};
		}
		if (!stats.completedPuzzles[puzzleId]) {
			stats.completedPuzzles[puzzleId] = {};
		}

		// Save completion trophy with all the details
		const completedAt = Timestamp.now();
		const timeSpent = Math.floor(
			(completedAt.toMillis() - game.startedAt.toMillis()) / 1000,
		);

		stats.completedPuzzles[puzzleId][difficulty] = {
			moves: completionData.moves,
			completedAt,
			startedAt: game.startedAt,
			timeSpent, // In seconds
			fromArchive, // Preserve whether this was daily or archive
		};

		// Update totals (both daily and archive count here)
		stats.totalCompleted++;

		// Update win streak - ONLY for daily puzzles, not archive
		// Win streak = consecutive days with at least ONE completion
		if (!fromArchive) {
			const today = getTodaysDate();
			const yesterday = getYesterdaysDate();

			// Check if this is their FIRST WIN today (not just first play)
			// User might complete both 3x3 and 4x4 - only first counts for streak
			const hasWonToday = Object.entries(stats.completedPuzzles).some(
				([pId, difficulties]) =>
					Object.values(difficulties).some((comp) => {
						// Filter to daily completions (not archive) from today
						if (!comp.fromArchive && comp.completedAt) {
							const compDate = comp.completedAt.toDate();
							return (
								compDate.toDateString() ===
								new Date().toDateString()
							);
						}
						return false;
					}),
			);

			if (!hasWonToday) {
				// This is their first win today!
				if (
					stats.lastPlayedDate === yesterday ||
					stats.lastPlayedDate === today
				) {
					// Continuing win streak (won yesterday or today)
					stats.currentWinStreak++;
					stats.maxWinStreak = Math.max(
						stats.maxWinStreak,
						stats.currentWinStreak,
					);
				} else {
					// Won today but didn't win yesterday - streak broken, reset to 1
					stats.currentWinStreak = 1;
				}
			}
			// If hasWonToday is true, this is a second win today (e.g., switching difficulty)
			// Don't update streak again
		}

		// Clear this game from gameState (puzzle is complete!)
		// But keep other in-progress games (user might be playing multiple puzzles)
		delete gameState[puzzleId][difficulty];
		if (Object.keys(gameState[puzzleId]).length === 0) {
			delete gameState[puzzleId]; // Clean up empty puzzle object
		}

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
		const cutoffPuzzleId = getTodaysPuzzleNumber() - 7;

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
