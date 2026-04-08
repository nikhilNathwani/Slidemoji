import {
	doc,
	updateDoc,
	serverTimestamp,
	deleteField,
} from "firebase/firestore";
import { db, COLLECTIONS } from "../firebaseConfig";

export async function saveFirestoreGameState(userId, puzzleId, gameData = {}) {
	if (!userId) {
		throw new Error("User ID is required");
	}
	if (!gameData.currentDifficulty) {
		throw new Error("currentDifficulty is required");
	}

	try {
		const userDocRef = doc(db, COLLECTIONS.USERS, userId);

		const updateData = {
			[`savedGames.${puzzleId}.currentDifficulty`]:
				gameData.currentDifficulty,
			updatedAt: serverTimestamp(),
		};

		for (const difficulty of ["normal", "hard"]) {
			const grid = gameData[difficulty];
			if (!Array.isArray(grid)) {
				continue;
			}

			updateData[`savedGames.${puzzleId}.${difficulty}`] = grid;
		}

		await updateDoc(userDocRef, updateData);
	} catch (error) {
		console.error("[Firestore] Error saving game state:", error);
		throw error;
	}
}

export async function trimGameHistory(userId, currentPuzzleId, savedGames) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		if (!savedGames) {
			return;
		}

		const puzzleIds = Object.keys(savedGames);
		const oldPuzzleIds = puzzleIds.filter(
			(id) => parseInt(id) !== currentPuzzleId,
		);

		if (oldPuzzleIds.length === 0) {
			return;
		}

		const userDocRef = doc(db, COLLECTIONS.USERS, userId);
		const updates = {
			updatedAt: serverTimestamp(),
		};

		for (const puzzleId of oldPuzzleIds) {
			updates[`savedGames.${puzzleId}`] = deleteField();
		}

		await updateDoc(userDocRef, updates);
	} catch (error) {
		console.error(
			"[Firestore] Error cleaning up anonymous trophies:",
			error,
		);
	}
}
