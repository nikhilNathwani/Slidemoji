import {
	doc,
	updateDoc,
	serverTimestamp,
	deleteField,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export async function saveFirestoreGameState(userId, puzzleId, gameData = {}) {
	if (!userId) {
		throw new Error("User ID is required");
	}
	if (!gameData.currentDifficulty) {
		throw new Error("currentDifficulty is required");
	}

	try {
		const userDocRef = doc(db, "users", userId);

		const updateData = {
			[`gameState.${puzzleId}.currentDifficulty`]:
				gameData.currentDifficulty,
			updatedAt: serverTimestamp(),
		};

		for (const difficulty of ["normal", "hard"]) {
			const grid = gameData[difficulty];
			if (!Array.isArray(grid)) {
				continue;
			}

			updateData[`gameState.${puzzleId}.${difficulty}`] = grid;
		}

		await updateDoc(userDocRef, updateData);
	} catch (error) {
		console.error("[Firestore] Error saving game state:", error);
		throw error;
	}
}

// mergeAnonymousDataToGoogle has been moved to src/utils/accountMerge.js

export async function deleteAnonymousPastGameState(userId, currentPuzzleId, gameState) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		if (!gameState) {
			return;
		}

		const puzzleIds = Object.keys(gameState);
		const oldPuzzleIds = puzzleIds.filter(
			(id) => parseInt(id) !== currentPuzzleId,
		);

		if (oldPuzzleIds.length === 0) {
			return;
		}

		const userDocRef = doc(db, "users", userId);
		const updates = {
			updatedAt: serverTimestamp(),
		};

		for (const puzzleId of oldPuzzleIds) {
			updates[`gameState.${puzzleId}`] = deleteField();
		}

		await updateDoc(userDocRef, updates);
	} catch (error) {
		console.error(
			"[Firestore] Error cleaning up anonymous trophies:",
			error,
		);
	}
}
