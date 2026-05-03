import Dialog from "./Dialog";
import StatsContent from "../stats/StatsContent";
import TrophyCaseTitle from "../stats/TrophyCaseTitle";

function StatsDialog({ isOpen, onClose, onUnlockArchiveClick }) {
	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title={<TrophyCaseTitle isDialogHeader={true} />}
		>
			<StatsContent
				showTitle={false}
				onUnlockArchiveClick={onUnlockArchiveClick}
			/>
		</Dialog>
	);
}

export default StatsDialog;
