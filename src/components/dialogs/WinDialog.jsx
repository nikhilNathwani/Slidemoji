import { useState } from "react";
import Dialog from "./Dialog";
import Trophy from "../common/Trophy";
import StatsContent from "../stats/StatsContent";
import styles from "./WinDialog.module.css";
import { FontAwesomeIcon, faCheck, faShareNodes } from "../../utils/icons";
import { formatPuzzleId } from "../../utils/puzzleUtils";

function WinDialog({
	isOpen,
	onClose,
	puzzleId,
	emoji,
	emojiName,
	difficulty,
}) {
	const [copied, setCopied] = useState(false);

	const handleShare = () => {
		const shareText = `Slidemoji ${formatPuzzleId(puzzleId)} 

I unscrambled today's emoji! ${emoji}

Play at slidemoji.vercel.app`;

		// Copy to clipboard
		navigator.clipboard
			.writeText(shareText)
			.then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			})
			.catch((err) => {
				console.error("Failed to copy:", err);
			});
	};

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Congratulations!">
			<div className={styles.winDialogContent}>
				<Trophy
					trophyNum={puzzleId}
					trophyEmoji={emoji}
					trophyName={emojiName}
					isSolved={true}
					difficulty={difficulty}
				/>
				<h3>You earned today's emoji!</h3>

				<button
					className={`btn btn-primary ${styles.shareButton}`}
					onClick={handleShare}
				>
					<FontAwesomeIcon icon={copied ? faCheck : faShareNodes} />
					{copied ? "Copied!" : "Share"}
				</button>

				<div className={styles.winDivider}></div>

				<StatsContent showTitle={true} />
			</div>
		</Dialog>
	);
}

export default WinDialog;
