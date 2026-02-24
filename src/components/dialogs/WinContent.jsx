import Trophy from "../common/Trophy";
import GoogleSignInButton from "../common/GoogleSignInButton";
import styles from "./WinContent.module.css";

function WinContent({ earnedEmoji, earnedEmojiName }) {
	const handleShare = () => {
		const shareText = `Slidemoji #001 ${earnedEmoji}

I earned today's emoji! 🎉

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
			/>
			<h3>You earned today's emoji!</h3>

			<button className={styles.shareButton} onClick={handleShare}>
				<i className="fas fa-share-nodes"></i>
				Share
			</button>

			<div className={styles.winSigninPrompt}>
				<p className={styles.signinMessage}>
					Sign in to save your trophy and compete for tomorrow's
					emoji!
				</p>
				<GoogleSignInButton
					onClick={() => alert("Sign in coming soon!")}
				/>
			</div>
		</div>
	);
}

export default WinContent;
