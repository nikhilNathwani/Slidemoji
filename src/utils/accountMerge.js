import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
// getPuzzleInitialGrids is needed for merge logic
function getPuzzleInitialGrids(puzzleData) {
	return {
		normal: puzzleData?.normal || null,
		hard: puzzleData?.hard || null,
	};
}

// Main merge function moved from gameState.js
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
						() => false, // TODO: pass actual checkWin if needed
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
/**
 * Account Merge Utilities
 *
 * Contains logic for merging/migrating user data (e.g., grids, stats) when upgrading
 * from anonymous to Google accounts in Firebase.
 */

/**
 * Choose which grid to keep when merging anonymous and Google accounts.
 * @param {Array} anonymousGrid
 * @param {Array} googleGrid
 * @param {Array} initialGrid
 * @param {Function} checkWin - function to check if a grid is solved
 * @returns {Array} The grid to keep
 */
export function chooseGridForMerge(
	anonymousGrid,
	googleGrid,
	initialGrid,
	checkWin,
) {
	// Validate inputs upfront
	const hasAnonymousGrid = Array.isArray(anonymousGrid);
	const hasGoogleGrid = Array.isArray(googleGrid);
	const hasInitialGrid = Array.isArray(initialGrid);

	// Case 1: Anonymous is solved → use anonymous (best progress)
	if (hasAnonymousGrid && checkWin(anonymousGrid)) {
		return anonymousGrid;
	}
	// Case 2: Anonymous is initial (untouched) → use google
	if (
		hasAnonymousGrid &&
		hasInitialGrid &&
		JSON.stringify(anonymousGrid) === JSON.stringify(initialGrid) &&
		hasGoogleGrid
	) {
		return googleGrid;
	}
	// Case 3: Google is solved → use google
	if (hasGoogleGrid && checkWin(googleGrid)) {
		return googleGrid;
	}
	// Default: prefer google if exists, else anonymous
	if (hasGoogleGrid) return googleGrid;
	if (hasAnonymousGrid) return anonymousGrid;
	return initialGrid;
}

/**
 * Merge user stats from anonymous and Google accounts.
 * Example: keep the higher score, merge arrays, etc.
 * @param {Object} anonStats
 * @param {Object} googleStats
 * @returns {Object} merged stats
 */
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
