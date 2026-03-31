import {
	doc,
	updateDoc,
	serverTimestamp,
	deleteField,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getFirestoreUserData } from "./user";

function getPuzzleInitialGrids(puzzleData) {
	return {
		normal: puzzleData?.normal || null,
		hard: puzzleData?.hard || null,
	};
}

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

export async function deleteAnonymousPastGameState(userId, currentPuzzleId) {
	if (!userId) {
		throw new Error("User ID is required");
	}

	try {
		const userData = await getFirestoreUserData(userId);
		if (!userData?.gameState || !userData.isAnonymous) {
			return;
		}

		const puzzleIds = Object.keys(userData.gameState);
		const oldPuzzleIds = puzzleIds.filter(
			(id) => parseInt(id) !== currentPuzzleId,
		);

		if (oldPuzzleIds.length === 0) {
			return;
		}

		console.log(
			`[Firestore] Cleaning up ${oldPuzzleIds.length} old puzzles for anonymous user`,
		);

		const userDocRef = doc(db, "users", userId);
		const updates = {
			updatedAt: serverTimestamp(),
		};

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
	}
}
