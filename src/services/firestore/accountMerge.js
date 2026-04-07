import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db, COLLECTIONS } from "../firebaseConfig";
import { chooseGridForMerge } from "../../utils/gridHelpers.js";

export async function mergeAnonymousDataToGoogle(
	anonymousUserId,
	anonymousData,
	googleUserId,
) {
	if (!anonymousUserId || !googleUserId) {
		throw new Error("Both user IDs are required for merge");
	}

	try {
		if (!anonymousData || !anonymousData.gameState) {
			return;
		}

		const googleDocRef = doc(db, COLLECTIONS.USERS, googleUserId);

		await runTransaction(db, async (transaction) => {
			const googleDoc = await transaction.get(googleDocRef);
			const googleData = googleDoc.exists() ? googleDoc.data() : null;
			const mergedGameState = { ...(googleData?.gameState || {}) };

			// Anonymous users can only play today's puzzle, and trimGameHistory
			// runs before merge, so this always iterates over a single entry.
			for (const [puzzleId, anonymousPuzzleData] of Object.entries(
				anonymousData.gameState,
			)) {
				const anonymousPuzzle = anonymousPuzzleData || {};

				if (!mergedGameState[puzzleId]) {
					mergedGameState[puzzleId] = { ...anonymousPuzzle };
					continue;
				}

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
