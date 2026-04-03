import Dialog from "./Dialog";
import StatsContent from "../stats/StatsContent";
import TrophyCaseTitle from "../stats/TrophyCaseTitle";
import { getLatestPuzzleId } from "../../utils/puzzleUtils";

function StatsDialog({ isOpen, onClose, solvedPuzzles, onUnlockArchiveClick }) {
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
			/>
		</Dialog>
	);
}

export default StatsDialog;
