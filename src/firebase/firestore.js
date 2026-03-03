import {
	doc,
	getDoc,
	setDoc,
	updateDoc,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

/**
 * User data structure:
 * {
 *   uid: string,
 *   email: string,
 *   displayName: string,
 *   preferences: {
 *     // Add user preferences here (theme, settings, etc.)
 *   },
 *   stats: {
 *     totalGamesPlayed: number,
 *     totalWins: number,
 *     currentStreak: number,
 *     maxStreak: number,
 *     trophies: {
 *       [puzzleId]: {
 *         won: boolean,
 *         moves: number,
 *         completedAt: timestamp,
 *       }
 *     }
 *   },
 *   gameState: {
 *     currentPuzzleId: string,
 *     board: array,
 *     moves: number,
 *     // Other game state as needed
 *   },
 *   createdAt: timestamp,
 *   updatedAt: timestamp,
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
			preferences: {},
			stats: {
				totalGamesPlayed: 0,
				totalWins: 0,
				currentStreak: 0,
				maxStreak: 0,
				trophies: {},
			},
			gameState: null,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
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
 * Save game state
 */
export async function saveGameState(userId, gameState) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		await updateDoc(userDocRef, {
			gameState,
			updatedAt: serverTimestamp(),
		});
	} catch (error) {
		console.error("Error saving game state:", error);
		throw error;
	}
}

/**
 * Save trophy (when puzzle is completed)
 */
export async function saveTrophy(userId, puzzleId, trophyData) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		const userData = await getUserData(userId);

		if (!userData) {
			throw new Error("User data not found");
		}

		const trophies = userData.stats?.trophies || {};
		const isNewTrophy = !trophies[puzzleId]?.won;

		// Update trophy
		trophies[puzzleId] = {
			won: true,
			moves: trophyData.moves,
			completedAt: serverTimestamp(),
		};

		// Update stats
		const stats = {
			...userData.stats,
			trophies,
			totalGamesPlayed: (userData.stats?.totalGamesPlayed || 0) + 1,
			totalWins: (userData.stats?.totalWins || 0) + (isNewTrophy ? 1 : 0),
		};

		// You can add streak logic here if needed

		await updateDoc(userDocRef, {
			stats,
			updatedAt: serverTimestamp(),
		});

		return { isNewTrophy, stats };
	} catch (error) {
		console.error("Error saving trophy:", error);
		throw error;
	}
}

/**
 * Get all trophies for a user
 */
export async function getUserTrophies(userId) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userData = await getUserData(userId);
		return userData?.stats?.trophies || {};
	} catch (error) {
		console.error("Error getting user trophies:", error);
		throw error;
	}
}

/**
 * Clear game state
 */
export async function clearGameState(userId) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);
		await updateDoc(userDocRef, {
			gameState: null,
			updatedAt: serverTimestamp(),
		});
	} catch (error) {
		console.error("Error clearing game state:", error);
		throw error;
	}
}
