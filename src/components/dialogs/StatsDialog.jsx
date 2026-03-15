import Dialog from "./Dialog";
import StatsContent from "../stats/StatsContent";
import TrophyCaseTitle from "../stats/TrophyCaseTitle";
import { useAuth } from "../../hooks/useAuth";
import { useUser } from "../../hooks/useUser";
import { getTodaysPuzzleNumber } from "../../utils/dateUtils";

function StatsDialog({ isOpen, onClose }) {
	const { user } = useAuth();
	const { data: userData } = useUser(user?.uid);
	const todaysPuzzleNumber = getTodaysPuzzleNumber();
	const solvedPuzzles = userData?.stats?.solvedPuzzles;
	const numTotalPuzzles = todaysPuzzleNumber;
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
			<StatsContent showTitle={false} />
		</Dialog>
	);
}

export default StatsDialog;
