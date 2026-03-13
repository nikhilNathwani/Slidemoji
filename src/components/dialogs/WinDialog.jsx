import Dialog from "./Dialog";
import Trophy from "../common/Trophy";
import StatsContent from "../stats/StatsContent";
import styles from "./WinDialog.module.css";
import { FontAwesomeIcon } from "../../utils/icons";

function WinDialog({
	isOpen,
	onClose,
	puzzleNumber,
	puzzleEmoji,
	puzzleEmojiName,
	gridSize,
	completedPuzzles,
}) {
	const handleShare = () => {
		const shareText = `Slidemoji #001 ${puzzleEmoji}

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

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Congratulations!">
			<div className={styles.winDialogContent}>
				<Trophy
					trophyNum={puzzleNumber}
					trophyEmoji={puzzleEmoji}
					trophyName={puzzleEmojiName}
					difficulty={gridSize}
				/>
				<h3>You earned today's emoji!</h3>

				<button className={styles.shareButton} onClick={handleShare}>
					<FontAwesomeIcon icon="share-nodes" />
					Share
				</button>

				<div className={styles.winDivider}></div>

				<StatsContent
					completedPuzzles={completedPuzzles}
					numTotalPuzzles={puzzleNumber}
					showTitle={true}
				/>
			</div>
		</Dialog>
	);
}

export default WinDialog;
