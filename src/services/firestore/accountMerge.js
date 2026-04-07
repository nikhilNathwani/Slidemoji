import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db, COLLECTIONS } from "../firebaseConfig";
import { chooseGridForMerge } from "../../utils/gridHelpers.js";
import { getLatestPuzzleId } from "../../utils/puzzleUtils";

// Merge any anonymous progress on today's puzzle into the Google account
export async function mergeAnonymousProgressToGoogle(
	anonymousUserId,
	anonymousGameState,
	googleUserId,
) {
	if (!anonymousUserId || !googleUserId) {
		throw new Error("Both user IDs are required for merge");
	}

	const puzzleId = getLatestPuzzleId().toString();

	// If no anonymous progress for today's puzzle, merge not necessary
	const anonymousProgress = anonymousGameState?.[puzzleId];
	if (!anonymousProgress) return;

	try {
		const googleDocRef = doc(db, COLLECTIONS.USERS, googleUserId);

		await runTransaction(db, async (transaction) => {
			// Fetch Google game data
			const googleDoc = await transaction.get(googleDocRef);
			const googleGameState = googleDoc.exists()
				? (googleDoc.data()?.gameState ?? {})
				: {};
			const googleProgress = googleGameState[puzzleId];

			// Merge anonymous progress with Google progress (if there is any)
			let mergedProgress;
			if (!googleProgress) {
				mergedProgress = { ...anonymousProgress };
			} else {
				// Start from Google's progress, then apply anonymous overrides
				mergedProgress = { ...googleProgress };
				if (anonymousProgress.currentDifficulty) {
					mergedProgress.currentDifficulty =
						anonymousProgress.currentDifficulty;
				}
				for (const difficulty of ["normal", "hard"]) {
					const grid = chooseGridForMerge(
						anonymousProgress[difficulty],
						googleProgress[difficulty],
					);
					if (grid) mergedProgress[difficulty] = grid;
				}
			}

			transaction.set(
				googleDocRef,
				{
					gameState: {
						...googleGameState, //retain history
						[puzzleId]: mergedProgress, //update today's puzzle
					},
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
