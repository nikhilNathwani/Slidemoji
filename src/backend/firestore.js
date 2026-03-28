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
			console.log(
				"[Firestore] No anonymous data to merge, skipping",
			);
			return;
		}

		const googleDocRef = doc(db, "users", googleUserId);

		// Case 1: Google user has no Firestore document yet (first time signing in with this Google account)
		if (!googleData) {
			console.log(
				"[Firestore] Creating new Google account with anonymous data",
			);
			await setDoc(googleDocRef, {
				...anonymousData,
				uid: googleUserId, // Update to Google UID
				isAnonymous: false,
				updatedAt: serverTimestamp(),
			});
			return;
		}

		// Case 2: Google user has existing data - smart merge
		console.log("[Firestore] Merging puzzle data intelligently");

		// Merge gameState: Google's puzzles + anonymous's new puzzles
		const mergedGameState = { ...googleData.gameState }; // Start with Google's data

		// Add anonymous puzzles that Google doesn't have
		for (const [puzzleId, puzzleData] of Object.entries(
			anonymousData.gameState || {},
		)) {
			if (!mergedGameState[puzzleId]) {
				// Google doesn't have this puzzle - add anonymous's data
				mergedGameState[puzzleId] = puzzleData;
				console.log(
					`[Firestore] Added anonymous progress for puzzle ${puzzleId}`,
				);
			} else {
				// Both have this puzzle - keep Google's data
				console.log(
					`[Firestore] Kept Google's existing data for puzzle ${puzzleId}`,
				);
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
