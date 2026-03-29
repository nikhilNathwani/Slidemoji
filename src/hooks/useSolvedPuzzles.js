import { useMemo } from "react";
import { useUserDoc } from "../contexts/userDoc";
import { DIFFICULTY } from "../constants";
import { checkWin } from "../utils/gridHelpers";

export function useSolvedPuzzles() {
	const { userData, loading, error } = useUserDoc();

	const solvedPuzzles = useMemo(() => {
		if (!userData?.gameState) return {};

		return Object.entries(userData.gameState).reduce(
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
	}, [userData]);

	return { solvedPuzzles, loading, error };
}
