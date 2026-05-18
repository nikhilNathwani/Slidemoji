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

	const hasGridUpdate =
		Array.isArray(gameData.normal) || Array.isArray(gameData.hard);
	if (
		(hasGridUpdate || gameData.currentDifficulty) &&
		!gameData.currentDifficulty
	) {
		throw new Error("currentDifficulty is required for grid updates");
	}

	try {
		const userDocRef = doc(db, COLLECTIONS.USERS, userId);

		const updateData = {
			updatedAt: serverTimestamp(),
		};

		if (gameData.currentDifficulty) {
			updateData[`savedGames.${puzzleId}.currentDifficulty`] =
				gameData.currentDifficulty;
		}

		for (const difficulty of ["normal", "hard"]) {
			const grid = gameData[difficulty];
			if (Array.isArray(grid)) {
				updateData[`savedGames.${puzzleId}.${difficulty}`] = grid;
			}
		}

		for (const field of ["normalSolved", "hardSolved"]) {
			if (gameData[field] === true) {
				updateData[`savedGames.${puzzleId}.${field}`] = true;
			}
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
