import {
	doc,
	getDoc,
	setDoc,
	updateDoc,
	serverTimestamp,
	Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import { getTodaysDate, getYesterdaysDate, getTodaysPuzzleNumber } from "../utils/dateUtils";

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
		console.error("Error getting user data:", error);
		throw error;
	}
}

/**
 * Create initial user data
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
				darkMode: false,
			},
			stats: {
				totalAttempted: 0,
				totalCompleted: 0,
				currentPlayStreak: 0,
				maxPlayStreak: 0,
				currentWinStreak: 0,
				maxWinStreak: 0,
				lastPlayedDate: null,
				completedPuzzles: {},
			},
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
 * Update user preferences
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

		const fromArchive = puzzleId !== getTodaysPuzzleNumber();
		let gameState = userData.gameState || {};
		let stats = { ...userData.stats };

		// Ensure nested structure exists
		if (!gameState[puzzleId]) {
			gameState[puzzleId] = {};
		}

		// Save progress for this puzzle+difficulty combo
		gameState[puzzleId][difficulty] = {
			moves: 0,
			board: initialBoard,
			startedAt: Timestamp.now(),
			fromArchive,
		};

		// Increment attempts counter (only if first time trying this puzzle+difficulty)
		if (!stats.completedPuzzles?.[puzzleId]?.[difficulty]) {
			stats.totalAttempted++;
		}

		// Update play streak (only for daily puzzles, not archive)
		if (!fromArchive) {
			const today = getTodaysDate();
			const yesterday = getYesterdaysDate();

			if (stats.lastPlayedDate === yesterday) {
				// Continuing streak
				stats.currentPlayStreak++;
				stats.maxPlayStreak = Math.max(
					stats.maxPlayStreak,
					stats.currentPlayStreak,
				);
			} else if (stats.lastPlayedDate !== today) {
				// First play today, but broke streak
				stats.currentPlayStreak = 1;
			}
			// If lastPlayedDate === today, already played today, don't update

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
 * Save game state (on every move)
 */
export async function saveGameState(userId, puzzleId, difficulty, gameData) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		await updateDoc(userDocRef, {
			[`gameState.${puzzleId}.${difficulty}.moves`]: gameData.moves,
			[`gameState.${puzzleId}.${difficulty}.board`]: gameData.board,
			updatedAt: serverTimestamp(),
		});
	} catch (error) {
		console.error("Error saving game state:", error);
		throw error;
	}
}

/**
 * Save completion (when puzzle is won)
 */
export async function saveCompletion(userId, puzzleId, difficulty, completionData) {
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

		// Get the game state for this puzzle+difficulty
		const game = gameState[puzzleId]?.[difficulty];
		if (!game) {
			throw new Error("Game state not found for this puzzle+difficulty");
		}

		const fromArchive = game.fromArchive;

		// Ensure nested structure exists
		if (!stats.completedPuzzles) {
			stats.completedPuzzles = {};
		}
		if (!stats.completedPuzzles[puzzleId]) {
			stats.completedPuzzles[puzzleId] = {};
		}

		// Save completion for this difficulty
		const completedAt = Timestamp.now();
		const timeSpent = Math.floor(
			(completedAt.toMillis() - game.startedAt.toMillis()) / 1000,
		);

		stats.completedPuzzles[puzzleId][difficulty] = {
			moves: completionData.moves,
			completedAt,
			startedAt: game.startedAt,
			timeSpent,
			fromArchive,
		};

		// Update totals
		stats.totalCompleted++;

		// Update win streak (only for daily puzzles, not archive)
		if (!fromArchive) {
			const today = getTodaysDate();
			const yesterday = getYesterdaysDate();

			// Check if this is their first WIN today (not just first play)
			const hasWonToday = Object.entries(stats.completedPuzzles).some(
				([pId, difficulties]) =>
					Object.values(difficulties).some((comp) => {
						if (!comp.fromArchive && comp.completedAt) {
							const compDate = comp.completedAt.toDate();
							return compDate.toDateString() === new Date().toDateString();
						}
						return false;
					}),
			);

			if (!hasWonToday) {
				// First win today
				if (stats.lastPlayedDate === yesterday || stats.lastPlayedDate === today) {
					// Continuing win streak
					stats.currentWinStreak++;
					stats.maxWinStreak = Math.max(
						stats.maxWinStreak,
						stats.currentWinStreak,
					);
				} else {
					// Won today but broke win streak
					stats.currentWinStreak = 1;
				}
			}
		}

		// Clear THIS game state (but keep other in-progress games)
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
 * Clean up old abandoned games (puzzles > 7 days ago)
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
