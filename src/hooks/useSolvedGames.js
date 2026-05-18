import { useMemo } from "react";
import { useUserDoc } from "./useUserDoc";
import { DIFFICULTY } from "../constants";
import { checkWin } from "../utils/gridHelpers";

export function useSolvedGames() {
	const { userDoc, isLoading, error } = useUserDoc();

	const solvedGames = useMemo(() => {
		if (!userDoc?.savedGames) return {};

		return Object.entries(userDoc.savedGames).reduce(
			(acc, [puzzleId, puzzleData]) => {
				const solved = {
					[DIFFICULTY.NORMAL]:
						checkWin(puzzleData?.[DIFFICULTY.NORMAL]) ||
						!!puzzleData?.normalSolved,
					[DIFFICULTY.HARD]:
						checkWin(puzzleData?.[DIFFICULTY.HARD]) ||
						!!puzzleData?.hardSolved,
				};

				if (solved[DIFFICULTY.NORMAL] || solved[DIFFICULTY.HARD]) {
					acc[puzzleId] = solved;
				}
				return acc;
			},
			{},
		);
	}, [userDoc]);

	return { solvedGames, isLoading, error };
}
