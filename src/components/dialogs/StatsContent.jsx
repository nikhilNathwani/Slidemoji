import TrophyCase from "../common/TrophyCase";
import GoogleSignInButton from "../common/GoogleSignInButton";
import { useAuth } from "../../hooks/useAuth";
import styles from "./StatsContent.module.css";

function StatsContent({
	dailyEmoji,
	earnedPuzzleIds = new Set([1, 3, 5]),
	totalPuzzles = 12,
}) {
	const { user } = useAuth();

	return (
		<div className={styles.statsContent}>
			{/* Not signed in: Show sign-in upsell only */}
			{!user ? (
				<div className={styles.statsSignin}>
					<h3 className={styles.statsSigninTitle}>
						Save Your Trophies
					</h3>
					<p className={styles.statsDescription}>
						Sign in to save your trophies across devices and track
						your progress over time.
					</p>
					<GoogleSignInButton />
					<p className={styles.privacyNote}>
						<i className="fas fa-shield-alt"></i>
						<span>
							We respect your privacy. Your data is never sold or
							shared. We only use your email to save your
							progress.
						</span>
					</p>
				</div>
			) : (
				<>
					{/* Trophy Case (signed-in only) */}
					<TrophyCase
						dailyEmoji={dailyEmoji}
						earnedPuzzleIds={earnedPuzzleIds}
						totalPuzzles={totalPuzzles}
					/>

					{/* Archive upsell (signed-in only) */}
					<div className={styles.statsDivider}></div>
					<div className={styles.archiveSection}>
						<h3 className={styles.archiveTitle}>
							Catch Up on Past Puzzles
						</h3>
						<p className={styles.archiveDescription}>
							Unlock the Slidemoji Archive to play past puzzles
							and complete your trophy case!
						</p>
						<button
							className={styles.unlockArchiveButton}
							onClick={() =>
								alert("Archive unlock feature coming soon!")
							}
						>
							<i className="fas fa-unlock"></i>
							Unlock Archive
						</button>
					</div>
				</>
			)}
		</div>
	);
}

export default StatsContent;
