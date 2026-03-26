import Dialog from "./Dialog";
import Trophy from "../common/Trophy";
import StatsContent from "../stats/StatsContent";
import styles from "./WinDialog.module.css";
import { FontAwesomeIcon } from "../../utils/icons";

function WinDialog({ isOpen, onClose, puzzleMetadata, difficulty }) {
	const handleShare = () => {
		const paddedId = String(puzzleMetadata?.id).padStart(3, "0");
		const shareText = `Slidemoji #${paddedId} 

I unscrambled today's emoji! ${puzzleMetadata?.emoji}

Play at slidemoji.vercel.app`;

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
					trophyNum={puzzleMetadata?.id}
					trophyEmoji={puzzleMetadata?.emoji}
					trophyName={puzzleMetadata?.emojiName}
					solvedDifficulty={difficulty}
				/>
				<h3>You earned today's emoji!</h3>

				<button className={styles.shareButton} onClick={handleShare}>
					<FontAwesomeIcon icon="share-nodes" />
					Share
				</button>

				<div className={styles.winDivider}></div>

				<StatsContent showTitle={true} />
			</div>
		</Dialog>
	);
}

export default WinDialog;
