import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import { chooseGridForMerge } from "./gridHelpers.js";

// Extracts the initial (unsolved) grids from a Firestore puzzle document.
function getPuzzleInitialGrids(puzzleData) {
	return {
		normal: puzzleData?.normal || null,
		hard: puzzleData?.hard || null,
	};
}

export async function mergeAnonymousDataToGoogle(
	anonymousUserId,
	googleUserId,
	anonymousData,
) {
	if (!anonymousUserId || !googleUserId) {
		throw new Error("Both user IDs are required for merge");
	}

	try {
		if (!anonymousData || !anonymousData.gameState) {
			return;
		}

		const googleDocRef = doc(db, "users", googleUserId);

		await runTransaction(db, async (transaction) => {
			const googleDoc = await transaction.get(googleDocRef);
			const googleData = googleDoc.exists() ? googleDoc.data() : null;
			const mergedGameState = { ...(googleData?.gameState || {}) };

			for (const [puzzleId, anonymousPuzzleData] of Object.entries(
				anonymousData.gameState || {},
			)) {
				const puzzleDocRef = doc(db, "puzzles", puzzleId.toString());
				const puzzleDoc = await transaction.get(puzzleDocRef);
				const initialGrids = getPuzzleInitialGrids(
					puzzleDoc.exists() ? puzzleDoc.data() : null,
				);
				const anonymousPuzzle = anonymousPuzzleData || {};

				if (!mergedGameState[puzzleId]) {
					mergedGameState[puzzleId] = { ...anonymousPuzzle };
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

export function mergeUserStats(anonStats, googleStats) {
	// Example: merge by taking max for each stat
	const merged = { ...googleStats };
	for (const key in anonStats) {
		if (
			typeof anonStats[key] === "number" &&
			typeof googleStats[key] === "number"
		) {
			merged[key] = Math.max(anonStats[key], googleStats[key]);
		} else if (
			Array.isArray(anonStats[key]) &&
			Array.isArray(googleStats[key])
		) {
			merged[key] = Array.from(
				new Set([...anonStats[key], ...googleStats[key]]),
			);
		} else if (!(key in googleStats)) {
			merged[key] = anonStats[key];
		}
	}
	return merged;
}

// Add more merge/migration helpers as needed
