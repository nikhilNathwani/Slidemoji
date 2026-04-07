import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db, COLLECTIONS } from "../firebaseConfig";
import { chooseGridForMerge } from "../../utils/gridHelpers.js";

export async function mergeAnonymousDataToGoogle(
	anonymousUserId,
	puzzleId,
	anonymousPuzzle,
	googleUserId,
) {
	if (!anonymousUserId || !googleUserId) {
		throw new Error("Both user IDs are required for merge");
	}

	try {
		if (!anonymousPuzzle) {
			return;
		}

		const googleDocRef = doc(db, COLLECTIONS.USERS, googleUserId);

		await runTransaction(db, async (transaction) => {
			const googleDoc = await transaction.get(googleDocRef);
			const googleData = googleDoc.exists() ? googleDoc.data() : null;
			const mergedGameState = { ...(googleData?.gameState || {}) };

			if (!mergedGameState[puzzleId]) {
				mergedGameState[puzzleId] = { ...anonymousPuzzle };
			} else {
				const googlePuzzleData = mergedGameState[puzzleId];

				for (const difficulty of ["normal", "hard"]) {
					const mergedGrid = chooseGridForMerge(
						anonymousPuzzle[difficulty],
						googlePuzzleData[difficulty],
					);

					if (mergedGrid) {
						googlePuzzleData[difficulty] = mergedGrid;
					}
				}

				if (anonymousPuzzle.currentDifficulty) {
					googlePuzzleData.currentDifficulty =
						anonymousPuzzle.currentDifficulty;
				}

				mergedGameState[puzzleId] = googlePuzzleData;
			}

			transaction.set(
				googleDocRef,
				{
					gameState: mergedGameState,
					updatedAt: serverTimestamp(),
				},
				{ merge: true },
			);
		});
	} catch (error) {
		console.error("[Firestore] Error merging anonymous data:", error);
		throw error;
	}
}
