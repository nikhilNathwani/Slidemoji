import Dialog from "./Dialog";
import StatsContent from "../stats/StatsContent";
import TrophyCaseTitle from "../stats/TrophyCaseTitle";

function StatsDialog({ isOpen, onClose, userData, numTotalPuzzles = 1 }) {
	// Extract earned puzzle IDs from userData
	const earnedPuzzleIds = new Set();
	if (userData?.stats?.completedPuzzles) {
		Object.keys(userData.stats.completedPuzzles).forEach((puzzleId) => {
			earnedPuzzleIds.add(parseInt(puzzleId));
		});
	}

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title={
				<>
					<TrophyCaseTitle
						numEarnedTrophies={earnedPuzzleIds.size}
						numTotalTrophies={numTotalPuzzles}
						isDialogHeader={true}
					></TrophyCaseTitle>
				</>
			}
		>
			<StatsContent
				userData={userData}
				earnedPuzzleIds={earnedPuzzleIds}
				numTotalPuzzles={numTotalPuzzles}
				showTitle={false}
			></StatsContent>
		</Dialog>
	);
}

export default StatsDialog;
