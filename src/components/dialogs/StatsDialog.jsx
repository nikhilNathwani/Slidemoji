import Dialog from "./Dialog";
import StatsContent from "../stats/StatsContent";
import TrophyCaseTitle from "../stats/TrophyCaseTitle";
import { useSolvedGames } from "../../hooks/useSolvedGames";
import { getLatestPuzzleId } from "../../utils/puzzleUtils";

function StatsDialog({ isOpen, onClose, onUnlockArchiveClick, devIsPremium }) {
	const { solvedPuzzles } = useSolvedGames();
	const numEarnedTrophies = Object.keys(solvedPuzzles || {}).length;

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title={
				<TrophyCaseTitle
					numEarnedTrophies={numEarnedTrophies}
					numTotalTrophies={getLatestPuzzleId()}
					isDialogHeader={true}
				/>
			}
		>
			<StatsContent
				showTitle={false}
				solvedPuzzles={solvedPuzzles}
				onUnlockArchiveClick={onUnlockArchiveClick}
				devIsPremium={devIsPremium}
			/>
		</Dialog>
	);
}

export default StatsDialog;
