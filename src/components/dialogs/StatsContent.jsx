import Trophy from "../common/Trophy";
import GoogleSignInButton from "../common/GoogleSignInButton";
import styles from "./StatsContent.module.css";

function StatsContent({ earnedEmojis, dailyEmoji }) {
	return (
		<div className={styles.statsContent}>
			<div className={styles.trophyCase}>
				<h3>
					<i className="fas fa-trophy"></i> Trophy Case
				</h3>
				<div className={styles.emojiGrid}>
					{earnedEmojis.map((emoji, index) => (
						<Trophy
							key={index}
							trophyNum={1}
							trophyEmoji={emoji}
							trophyName={dailyEmoji.name}
							isMini={true}
						/>
					))}
				</div>
			</div>
			<div className={styles.statsDivider}></div>
			<div className={styles.statsSignin}>
				<h3 className={styles.statsSigninTitle}>Sync Your Progress</h3>
				<p className={styles.statsDescription}>
					Sign in to save your trophies and compete on the
					leaderboard!
				</p>
				<GoogleSignInButton
					onClick={() => alert("Sign in coming soon!")}
				/>
				<p className={styles.privacyNote}>
					<i className="fas fa-shield-alt"></i>
					<span>
						We respect your privacy. Your data is never sold or
						shared. We only use your email to save your progress.
					</span>
				</p>
			</div>
		</div>
	);
}

export default StatsContent;
