/**
 * Firestore database operations for signed-in users
 * Direct access to Firebase Firestore for user data persistence
 */

import {
	doc,
	getDoc,
	setDoc,
	updateDoc,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../backend/firebaseConfig";

/**
 * Get user data from Firestore
 *
 * @param {string} userId - Firebase Auth user ID (uid)
 * @returns {Promise<Object|null>} User data object or null if not found
 */
export async function getFirestoreUserData(userId) {
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
		console.error("[Firestore] Error getting user data:", error);
		throw error;
	}
}

/**
 * Create initial user data in Firestore (first-time sign-in)
 *
 * @param {string} userId - Firebase Auth user ID (uid)
 * @param {Object} userData - User info from Google Auth (email, displayName, isAnonymous, photoURL)
 * @returns {Promise<Object>} The created user data
 */
export async function createFirestoreUserData(userId, userData = {}) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		const initialData = {
			uid: userId,
			email: userData.email || null,
			displayName: userData.displayName || null,
			photoURL: userData.photoURL || null,
			isAnonymous:
				userData.isAnonymous !== undefined
					? userData.isAnonymous
					: false,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			preferences: {
				darkMode: false,
				soundEnabled: true,
			},
			gameState: null,
		};

		await setDoc(userDocRef, initialData);
		return initialData;
	} catch (error) {
		console.error("[Firestore] Error creating user data:", error);
		throw error;
	}
}

/**
 * Update user profile in Firestore (when upgrading anonymous to Google)
 *
 * @param {string} userId - Firebase Auth user ID (uid)
 * @param {Object} profileData - Profile info { email, displayName, photoURL, isAnonymous }
 */
export async function updateFirestoreUserProfile(userId, profileData) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		await updateDoc(userDocRef, {
			...profileData,
			updatedAt: serverTimestamp(),
		});
	} catch (error) {
		console.error("[Firestore] Error updating user profile:", error);
		throw error;
	}
}

/**
 * Update user preferences in Firestore
 *
 * @param {string} userId - Firebase Auth user ID (uid)
 * @param {Object} preferences - Preferences object { darkMode: boolean, etc }
 */
export async function updateFirestorePreferences(userId, preferences) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		const updates = {
			updatedAt: serverTimestamp(),
		};
		// Convert { darkMode: true } to { "preferences.darkMode": true }
		for (const [key, value] of Object.entries(preferences)) {
			updates[`preferences.${key}`] = value;
		}
		await updateDoc(userDocRef, updates);
	} catch (error) {
		console.error("[Firestore] Error updating preferences:", error);
		throw error;
	}
}

/**
 * Save game state to Firestore
 * Automatically detects solves and updates gameState.solved field
 *
 * Schema:
 * gameState: {
 *   [puzzleId]: {
 *     normal: [grid array],  // In-progress or solved grid for normal mode
 *     hard: [grid array],    // In-progress or solved grid for hard mode
 *     currentDifficulty: 'normal' | 'hard',  // Last active difficulty
 *     solved: { normal: true, hard: true }   // Trophy status
 *   }
 * }
 *
 * @param {string} userId - User ID
 * @param {number} puzzleId - Puzzle ID
 * @param {Object} gameData - { grid: Array<number|null>, difficulty: string }
 */
export async function saveFirestoreGameState(userId, puzzleId, gameData) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		// Import to check if puzzle is solved
		const { checkWin } = await import("../utils/gridHelpers.js");

		const userDocRef = doc(db, "users", userId);
		// Convert client format (null as gap) to Firestore format (0 as gap)
		const firestoreGrid = gameData.grid.map((v) => (v === null ? 0 : v));

		// Check if puzzle is solved
		const isSolved = checkWin(gameData.grid);

		// Prepare update object - always save grid
		const updateData = {
			[`gameState.${puzzleId}.${gameData.difficulty}`]: firestoreGrid,
			[`gameState.${puzzleId}.currentDifficulty`]: gameData.difficulty,
			updatedAt: serverTimestamp(),
		};

		// If solved, also update solved field
		if (isSolved) {
			updateData[`gameState.${puzzleId}.solved.${gameData.difficulty}`] =
				true;
		}

		await updateDoc(userDocRef, updateData);
	} catch (error) {
		console.error("[Firestore] Error saving game state:", error);
		throw error;
	}
}

/**
 * Merge anonymous user's data into Google user's account
 * Smart merge: Don't overwrite Google's existing puzzle data, only add new puzzles
 *
 * Strategy:
 * - Keep all of Google user's existing puzzle progress (puzzles 1-86)
 * - Add anonymous user's progress for puzzles Google doesn't have (puzzle 87)
 * - If both have data for same puzzle: Keep Google's data (signed-in takes precedence)
 * - Merge preferences: Keep Google's preferences (signed-in takes precedence)
 *
 * @param {string} anonymousUserId - UID of anonymous user (data source)
 * @param {string} googleUserId - UID of Google user (merge destination)
 */
export async function mergeAnonymousDataToGoogle(
	anonymousUserId,
	googleUserId,
) {
	if (!anonymousUserId || !googleUserId) {
		throw new Error("Both user IDs are required for merge");
	}

	console.log(
		`[Firestore] Merging anonymous data (${anonymousUserId}) into Google account (${googleUserId})`,
	);

	try {
		// Get both users' data
		const anonymousData = await getFirestoreUserData(anonymousUserId);
		const googleData = await getFirestoreUserData(googleUserId);

		// If no anonymous data, nothing to merge
		if (!anonymousData || !anonymousData.gameState) {
			console.log("[Firestore] No anonymous data to merge, skipping");
			return;
		}

		const googleDocRef = doc(db, "users", googleUserId);

		// Note: First-time Google sign-in (no Firestore doc) is handled in auth.js try block.
		// This function is ONLY called when linkWithCredential fails (credential-already-in-use).
		// That means Google account already exists with data.
		if (!googleData || !googleData.gameState) {
			console.log(
				"[Firestore] Google user has no gameState, copying all anonymous data",
			);
			// Google user exists but has no game data - copy everything from anonymous
			await updateDoc(googleDocRef, {
				gameState: anonymousData.gameState,
				updatedAt: serverTimestamp(),
			});
			return;
		}

		// Google user has existing game data - smart merge (don't overwrite)
		console.log("[Firestore] Merging puzzle data intelligently");

		// Merge gameState: Google's puzzles + anonymous's new puzzles
		const mergedGameState = { ...googleData.gameState }; // Start with Google's data

		// Merge anonymous puzzles at the DIFFICULTY level (not puzzle level)
		for (const [puzzleId, anonymousPuzzleData] of Object.entries(
			anonymousData.gameState || {},
		)) {
			if (!mergedGameState[puzzleId]) {
				// Google doesn't have this puzzle at all - add anonymous's data
				mergedGameState[puzzleId] = anonymousPuzzleData;
				console.log(
					`[Firestore] Added anonymous puzzle ${puzzleId} (new puzzle)`,
				);
			} else {
				// Both have this puzzle - merge at difficulty level
				const googlePuzzleData = mergedGameState[puzzleId];

				// Merge normal difficulty
				if (anonymousPuzzleData.normal && !googlePuzzleData.normal) {
					mergedGameState[puzzleId].normal =
						anonymousPuzzleData.normal;
					console.log(
						`[Firestore] Added anonymous normal difficulty for puzzle ${puzzleId}`,
					);
				}

				// Merge hard difficulty
				if (anonymousPuzzleData.hard && !googlePuzzleData.hard) {
					mergedGameState[puzzleId].hard = anonymousPuzzleData.hard;
					console.log(
						`[Firestore] Added anonymous hard difficulty for puzzle ${puzzleId}`,
					);
				}

				// Merge solved status at difficulty level
				if (anonymousPuzzleData.solved) {
					if (!googlePuzzleData.solved) {
						mergedGameState[puzzleId].solved = {};
					}
					if (
						anonymousPuzzleData.solved.normal &&
						!googlePuzzleData.solved?.normal
					) {
						mergedGameState[puzzleId].solved.normal = true;
						console.log(
							`[Firestore] Added anonymous normal trophy for puzzle ${puzzleId}`,
						);
					}
					if (
						anonymousPuzzleData.solved.hard &&
						!googlePuzzleData.solved?.hard
					) {
						mergedGameState[puzzleId].solved.hard = true;
						console.log(
							`[Firestore] Added anonymous hard trophy for puzzle ${puzzleId}`,
						);
					}
				}

				// Update currentDifficulty if anonymous has progress and Google doesn't
				if (
					anonymousPuzzleData.currentDifficulty &&
					!googlePuzzleData.currentDifficulty
				) {
					mergedGameState[puzzleId].currentDifficulty =
						anonymousPuzzleData.currentDifficulty;
				}
			}
		}

		// Update Google user's document with merged data
		// Keep Google's preferences (signed-in takes precedence)
		await updateDoc(googleDocRef, {
			gameState: mergedGameState,
			updatedAt: serverTimestamp(),
		});

		console.log(
			"[Firestore] Successfully merged anonymous data into Google account",
		);
	} catch (error) {
		console.error("[Firestore] Error merging anonymous data:", error);
		throw error;
	}
}

/**
 * Clean up old trophies for anonymous users (only keep today's puzzle)
 * This motivates users to sign in to save their trophies permanently.
 *
 * Call this after saving anonymous user's game state.
 *
 * @param {string} userId - Anonymous user ID
 * @param {number} currentPuzzleId - Today's puzzle ID
 */
export async function cleanupAnonymousTrophies(userId, currentPuzzleId) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userData = await getFirestoreUserData(userId);
		if (!userData?.gameState || !userData.isAnonymous) {
			// Not anonymous or no data - skip cleanup
			return;
		}

		// Check if there are any old puzzles to clean up
		const puzzleIds = Object.keys(userData.gameState);
		const oldPuzzleIds = puzzleIds.filter(
			(id) => parseInt(id) !== currentPuzzleId,
		);

		if (oldPuzzleIds.length === 0) {
			// No old puzzles to clean up
			return;
		}

		console.log(
			`[Firestore] Cleaning up ${oldPuzzleIds.length} old puzzles for anonymous user`,
		);

		// Remove old puzzle data
		const userDocRef = doc(db, "users", userId);
		const updates = {
			updatedAt: serverTimestamp(),
		};

		// Delete old puzzle fields
		const { deleteField } = await import("firebase/firestore");
		for (const puzzleId of oldPuzzleIds) {
			updates[`gameState.${puzzleId}`] = deleteField();
		}

		await updateDoc(userDocRef, updates);
		console.log(
			`[Firestore] Cleaned up old puzzles: ${oldPuzzleIds.join(", ")}`,
		);
	} catch (error) {
		console.error(
			"[Firestore] Error cleaning up anonymous trophies:",
			error,
		);
		// Don't throw - cleanup is not critical
	}
}
