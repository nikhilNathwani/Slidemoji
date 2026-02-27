import Trophy from "../common/Trophy";
import StatsContent from "./StatsContent";
import styles from "./WinContent.module.css";

function WinContent({
	earnedEmoji,
	earnedEmojiName,
	signedIn,
	onSignIn,
	gridSize,
	dailyEmoji,
	earnedPuzzleIds = new Set([1]),
	totalPuzzles = 12,
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
				trophyNum={1}
				trophyEmoji={earnedEmoji}
				trophyName={earnedEmojiName}
				isEarned={true}
				difficulty={gridSize}
			/>
			<h3>You completed today's emoji!</h3>

			<button className={styles.shareButton} onClick={handleShare}>
				<i className="fas fa-share-nodes"></i>
				Share
			</button>

			<div className={styles.winDivider}></div>

			<StatsContent
				dailyEmoji={dailyEmoji}
				signedIn={signedIn}
				onSignIn={onSignIn}
				earnedPuzzleIds={earnedPuzzleIds}
				totalPuzzles={totalPuzzles}
			/>
		</div>
	);
}

export default WinContent;
