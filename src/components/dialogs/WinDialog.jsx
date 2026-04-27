import { useState, useEffect, useRef } from "react";
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
	devIsPremium,
	onUnlockArchiveClick,
}) {
	const [copied, setCopied] = useState(false);

	// DEMO RECORDING: auto-scroll to bottom 2s after open, then back to top 2s later.
	// Remove this block after recording.
	useEffect(() => {
		if (!isOpen) return;
		let interval = null;
		const scrollDown = setTimeout(() => {
			interval = setInterval(() => {
				const el = document.getElementById("dialog-container");
				if (!el) return;
				el.scrollTop += 4;
				if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
					clearInterval(interval);
					interval = null;
				}
			}, 12);
		}, 1800);
		return () => {
			clearTimeout(scrollDown);
			if (interval) clearInterval(interval);
		};
	}, [isOpen]);

	const handleShare = () => {
		const shareText = `Slidemoji ${formatPuzzleId(puzzleId)} 

I unscrambled today's emoji! ${emoji}

Play at https://slidemoji.com`;

		// Copy to clipboard
		navigator.clipboard
			.writeText(shareText)
			.then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 1200);
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
					isEarned={true}
					difficulty={difficulty}
				/>
				<h3>You earned today's emoji!</h3>

				<button className="btn btn-solid" onClick={handleShare}>
					<FontAwesomeIcon icon={copied ? faCheck : faShareNodes} />
					{copied ? "Copied!" : "Share"}
				</button>

				<div className={styles.winDivider}></div>

				<StatsContent
					showTitle={true}
					showPremiumArchiveHint={false}
					puzzleId={puzzleId}
					devIsPremium={devIsPremium}
					onUnlockArchiveClick={onUnlockArchiveClick}
				/>
			</div>
		</Dialog>
	);
}

export default WinDialog;
