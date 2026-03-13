import Dialog from "./Dialog";
import StatsContent from "../stats/StatsContent";
import TrophyCaseTitle from "../stats/TrophyCaseTitle";

function StatsDialog({ isOpen, onClose, solvedPuzzles, numTotalPuzzles = 1 }) {
	const numEarnedTrophies = Object.keys(solvedPuzzles || {}).length;

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title={
				<>
					<TrophyCaseTitle
						numEarnedTrophies={numEarnedTrophies}
						numTotalTrophies={numTotalPuzzles}
						isDialogHeader={true}
					></TrophyCaseTitle>
				</>
			}
		>
			<StatsContent
				solvedPuzzles={solvedPuzzles}
				numTotalPuzzles={numTotalPuzzles}
				showTitle={false}
			></StatsContent>
		</Dialog>
	);
}

export default StatsDialog;
