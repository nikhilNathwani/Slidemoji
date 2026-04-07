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

	try {
		if (!anonymousGameState) {
			return;
		}

		const puzzleId = getLatestPuzzleId().toString();
		const anonymousProgress = anonymousGameState[puzzleId] || {};

		const googleDocRef = doc(db, COLLECTIONS.USERS, googleUserId);

		await runTransaction(db, async (transaction) => {
			const googleDoc = await transaction.get(googleDocRef);
			const googleData = googleDoc.exists() ? googleDoc.data() : null;
			const mergedGameState = { ...(googleData?.gameState || {}) };

			if (!mergedGameState[puzzleId]) {
				mergedGameState[puzzleId] = { ...anonymousProgress };
			} else {
				const googleProgress = mergedGameState[puzzleId];

				for (const difficulty of ["normal", "hard"]) {
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

				mergedGameState[puzzleId] = googleProgress;
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
