import Trophy from "../common/Trophy";
import StatsContent from "./StatsContent";
import styles from "./WinContent.module.css";
import { FontAwesomeIcon } from "../../utils/icons";

function WinContent({
	puzzleNumber,
	earnedEmoji,
	earnedEmojiName,
	gridSize,
	dailyEmoji,
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

	return (
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

			<StatsContent dailyEmoji={dailyEmoji} userData={userData} />
		</div>
	);
}

export default WinContent;
