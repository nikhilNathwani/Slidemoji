import {
	doc,
	updateDoc,
	serverTimestamp,
	runTransaction,
	deleteField,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { chooseGridForMerge } from "../../utils/gridHelpers";
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

export async function mergeAnonymousDataToGoogle(
	anonymousUserId,
	googleUserId,
	anonymousData,
) {
	if (!anonymousUserId || !googleUserId) {
		throw new Error("Both user IDs are required for merge");
	}

	console.log(
		`[Firestore] Merging anonymous data (${anonymousUserId}) into Google account (${googleUserId})`,
	);

	try {
		if (!anonymousData || !anonymousData.gameState) {
			console.log("[Firestore] No anonymous data to merge, skipping");
			return;
		}

		const googleDocRef = doc(db, "users", googleUserId);

		await runTransaction(db, async (transaction) => {
			const googleDoc = await transaction.get(googleDocRef);
			const googleData = googleDoc.exists() ? googleDoc.data() : null;
			const mergedGameState = { ...(googleData?.gameState || {}) };
			console.log("[Firestore][Merge] Initial state", {
				anonymousUserId,
				googleUserId,
				anonymousGameState: anonymousData.gameState,
				googleGameState: googleData?.gameState || null,
			});
			console.log("[Firestore] Merging puzzle data intelligently");

			for (const [puzzleId, anonymousPuzzleData] of Object.entries(
				anonymousData.gameState || {},
			)) {
				const puzzleDocRef = doc(db, "puzzles", puzzleId.toString());
				const puzzleDoc = await transaction.get(puzzleDocRef);
				const initialGrids = getPuzzleInitialGrids(
					puzzleDoc.exists() ? puzzleDoc.data() : null,
				);
				const anonymousPuzzle = anonymousPuzzleData || {};
				console.log("[Firestore][Merge] Puzzle start", {
					puzzleId,
					anonymousPuzzleData: anonymousPuzzle,
					googlePuzzleData: mergedGameState[puzzleId] || null,
				});

				if (!mergedGameState[puzzleId]) {
					mergedGameState[puzzleId] = {
						...anonymousPuzzle,
					};
					console.log(
						"[Firestore][Merge] Puzzle copied (missing on Google)",
						{
							puzzleId,
							resultPuzzleData: mergedGameState[puzzleId],
						},
					);
					continue;
				}

				const googlePuzzleData = mergedGameState[puzzleId] || {};

				for (const difficulty of ["normal", "hard"]) {
					const anonymousGrid = anonymousPuzzle[difficulty];
					const googleGrid = googlePuzzleData[difficulty];
					const initialGrid = initialGrids[difficulty];
					const mergedGrid = chooseGridForMerge(
						anonymousGrid,
						googleGrid,
						initialGrid,
					);
					console.log("[Firestore][Merge] Difficulty compare", {
						puzzleId,
						difficulty,
						anonymousGrid,
						googleGrid,
						initialGrid,
						mergedGrid,
					});

					if (mergedGrid) {
						googlePuzzleData[difficulty] = mergedGrid;
					}
				}

				if (anonymousPuzzle.currentDifficulty) {
					googlePuzzleData.currentDifficulty =
						anonymousPuzzle.currentDifficulty;
				}

				mergedGameState[puzzleId] = googlePuzzleData;
				console.log("[Firestore][Merge] Puzzle result", {
					puzzleId,
					resultPuzzleData: googlePuzzleData,
				});
			}

			console.log("[Firestore][Merge] Final merged gameState", {
				anonymousUserId,
				googleUserId,
				mergedGameState,
			});

			transaction.set(
				googleDocRef,
				{
					gameState: mergedGameState,
					updatedAt: serverTimestamp(),
				},
				{ merge: true },
			);
		});

		console.log(
			"[Firestore] Successfully merged anonymous data into Google account",
		);
	} catch (error) {
		console.error("[Firestore] Error merging anonymous data:", error);
		throw error;
	}
}

export async function cleanupAnonymousTrophies(userId, currentPuzzleId) {
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
