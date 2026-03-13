import Dialog from "./Dialog";
import StatsContent from "../stats/StatsContent";
import TrophyCaseTitle from "../stats/TrophyCaseTitle";

function StatsDialog({
	isOpen,
	onClose,
	completedPuzzles,
	numTotalPuzzles = 1,
}) {
	const numEarnedTrophies = Object.keys(completedPuzzles || {}).length;

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
				completedPuzzles={completedPuzzles}
				numTotalPuzzles={numTotalPuzzles}
				showTitle={false}
			></StatsContent>
		</Dialog>
	);
}

export default StatsDialog;
