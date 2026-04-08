import { useMemo } from "react";
import { useUserDoc } from "./useUserDoc";
import { DIFFICULTY } from "../constants";
import { checkWin } from "../utils/gridHelpers";

export function useSolvedPuzzles() {
	const { userDoc, isLoading, error } = useUserDoc();

	const solvedPuzzles = useMemo(() => {
		if (!userDoc?.savedGames) return {};

		return Object.entries(userDoc.savedGames).reduce(
			(acc, [puzzleId, puzzleData]) => {
				const solved = {
					[DIFFICULTY.NORMAL]: checkWin(
						puzzleData?.[DIFFICULTY.NORMAL],
					),
					[DIFFICULTY.HARD]: checkWin(puzzleData?.[DIFFICULTY.HARD]),
				};

				if (solved[DIFFICULTY.NORMAL] || solved[DIFFICULTY.HARD]) {
					acc[puzzleId] = solved;
				}
				return acc;
			},
			{},
		);
	}, [userDoc]);

	return { solvedPuzzles, isLoading, error };
}
