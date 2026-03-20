import Dialog from "./Dialog";
import StatsContent from "../stats/StatsContent";
import TrophyCaseTitle from "../stats/TrophyCaseTitle";
import { getLatestPuzzleId } from "../../utils/puzzleUtils";

function StatsDialog({ isOpen, onClose, userData }) {
	const solvedPuzzles = userData?.stats?.solvedPuzzles;
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
			<StatsContent showTitle={false} userData={userData} />
		</Dialog>
	);
}

export default StatsDialog;
