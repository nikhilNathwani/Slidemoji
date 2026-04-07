import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db, COLLECTIONS } from "../firebaseConfig";
import { chooseGridForMerge } from "../../utils/gridHelpers.js";
import { getLatestPuzzleId } from "../../utils/puzzleUtils";

export async function mergeAnonymousDataToGoogle(
	anonymousUserId,
	anonymousGameState,
	googleUserId,
) {
	if (!anonymousUserId || !googleUserId) {
		throw new Error("Both user IDs are required for merge");
	}

	if (!anonymousGameState) {
		return;
	}

	try {
		const puzzleId = getLatestPuzzleId().toString();
		const anonymousProgress = anonymousGameState[puzzleId] || {};

		const googleDocRef = doc(db, COLLECTIONS.USERS, googleUserId);

		await runTransaction(db, async (transaction) => {
			const googleDoc = await transaction.get(googleDocRef);
			const googleData = googleDoc.exists() ? googleDoc.data() : null;
			const updatedGameState = { ...(googleData?.gameState || {}) };

			if (!updatedGameState[puzzleId]) {
				updatedGameState[puzzleId] = { ...anonymousProgress };
			} else {
				const googleProgress = updatedGameState[puzzleId];

				for (const difficulty of ["normal", "hard"]) {
					// We don't detect the edge case where googleProgress happens to equal
					// the puzzle's initial grid (i.e. the user made moves that returned
					// to the start), which would cause us to incorrectly prefer it over
					// real anonymous progress. The complexity of fetching initial grids
					// to detect this wasn't worth the value-add for such a rare scenario.
					// See commit 7d44169 for an implementation that handled it.
					const mergedGrid = chooseGridForMerge(
						anonymousProgress[difficulty],
						googleProgress[difficulty],
					);

					if (mergedGrid) {
						googleProgress[difficulty] = mergedGrid;
					}
				}

				if (anonymousProgress.currentDifficulty) {
					googleProgress.currentDifficulty =
						anonymousProgress.currentDifficulty;
				}

				updatedGameState[puzzleId] = googleProgress;
			}

			transaction.set(
				googleDocRef,
				{
					gameState: updatedGameState,
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
