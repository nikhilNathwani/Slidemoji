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
export async function getUserDataFromFirestore(userId) {
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
 * @param {Object} userData - User info from Google Auth (email, displayName)
 * @returns {Promise<Object>} The created user data
 */
export async function createUserDataInFirestore(userId, userData = {}) {
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
 * Update user preferences in Firestore
 *
 * @param {string} userId - Firebase Auth user ID (uid)
 * @param {Object} preferences - Preferences object { darkMode: boolean, etc }
 */
export async function updateUserPreferencesToFirestore(userId, preferences) {
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
export async function saveGameStateToFirestore(userId, puzzleId, gameData) {
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
