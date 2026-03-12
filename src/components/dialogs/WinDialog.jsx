import Dialog from "./Dialog";
import Trophy from "../common/Trophy";
import StatsContent from "../stats/StatsContent";
import styles from "./WinDialog.module.css";
import { FontAwesomeIcon } from "../../utils/icons";

function WinDialog({
	isOpen,
	onClose,
	puzzleNumber,
	earnedEmoji,
	earnedEmojiName,
	gridSize,
	userData,
}) {
	const handleShare = () => {
		const shareText = `Slidemoji #001 ${earnedEmoji}

I completed today's emoji! 🎉

Play at slidemoji.com`;

		// Copy to clipboard
		navigator.clipboard
			.writeText(shareText)
			.then(() => {
				alert("Results copied to clipboard!");
			})
			.catch((err) => {
				console.error("Failed to copy:", err);
			});
	};

	const earnedPuzzleIds = new Set();
	if (userData?.stats?.completedPuzzles) {
		Object.keys(userData.stats.completedPuzzles).forEach((puzzleId) => {
			earnedPuzzleIds.add(parseInt(puzzleId));
		});
	}

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Congratulations!">
			<div className={styles.winDialogContent}>
				<Trophy
					trophyNum={puzzleNumber}
					trophyEmoji={earnedEmoji}
					trophyName={earnedEmojiName}
					isEarned={true}
					difficulty={gridSize}
				/>
				<h3>You earned today's emoji!</h3>

				<button className={styles.shareButton} onClick={handleShare}>
					<FontAwesomeIcon icon="share-nodes" />
					Share
				</button>

				<div className={styles.winDivider}></div>

				<StatsContent
					userData={userData}
					earnedPuzzleIds={earnedPuzzleIds}
					numTotalPuzzles={puzzleNumber}
					showTitle={true}
				/>
			</div>
		</Dialog>
	);
}

export default WinDialog;
