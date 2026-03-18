import Dialog from "./Dialog";
import StatsContent from "../stats/StatsContent";
import TrophyCaseTitle from "../stats/TrophyCaseTitle";
import { useAuth } from "../../hooks/useAuth";
import { useUser } from "../../hooks/useUser";
import { getCurrentPuzzleId } from "../../utils/dateUtils";

function StatsDialog({ isOpen, onClose }) {
	const { user } = useAuth();
	const { data: userData, isLoading } = useUser(user?.uid);
	const puzzleId = getCurrentPuzzleId();
	const solvedPuzzles = userData?.stats?.solvedPuzzles;
	const numTotalPuzzles = puzzleId;
	const numEarnedTrophies = Object.keys(solvedPuzzles || {}).length;

	// Use a simplified title when data is loading to prevent rendering issues
	const dialogTitle =
		user && isLoading ? (
			"Trophy Case"
		) : (
			<TrophyCaseTitle
				numEarnedTrophies={numEarnedTrophies}
				numTotalTrophies={numTotalPuzzles}
				isDialogHeader={true}
			/>
		);

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title={dialogTitle}>
			<StatsContent showTitle={false} />
		</Dialog>
	);
}

export default StatsDialog;
