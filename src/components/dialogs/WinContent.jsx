import Trophy from "../common/Trophy";
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
				<button
					className="google-signin-btn"
					onClick={() => alert("Sign in coming soon!")}
				>
					<img
						src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
						alt="Google"
						className="google-icon"
					/>
					Sign in with Google
				</button>
			</div>
		</div>
	);
}

export default WinContent;
