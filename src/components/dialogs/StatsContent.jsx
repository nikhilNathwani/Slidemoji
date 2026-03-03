import TrophyCase from "../common/TrophyCase";
import GoogleSignInButton from "../common/GoogleSignInButton";
import { useAuth } from "../../hooks/useAuth";
import styles from "./StatsContent.module.css";

function StatsContent({ dailyEmoji, userData, totalPuzzles = 365 }) {
	const { user } = useAuth();

	// Extract earned puzzle IDs from userData
	const earnedPuzzleIds = new Set();
	if (userData?.stats?.completedPuzzles) {
		Object.keys(userData.stats.completedPuzzles).forEach((puzzleId) => {
			earnedPuzzleIds.add(parseInt(puzzleId));
		});
	}

	const stats = userData?.stats || {};

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
							shared. We only use your email to save your progress.
						</span>
					</p>
				</div>
			) : (
				<>
					{/* Streaks (signed-in only) */}
					{userData && (
						<div className={styles.streaksSection}>
							<div className={styles.statRow}>
								<span className={styles.statLabel}>
									<i className="fas fa-fire"></i> Play Streak
								</span>
								<span className={styles.statValue}>
									{stats.currentPlayStreak || 0} days
								</span>
							</div>
							<div className={styles.statRow}>
								<span className={styles.statLabel}>
									<i className="fas fa-trophy"></i> Win Streak
								</span>
								<span className={styles.statValue}>
									{stats.currentWinStreak || 0} days
								</span>
							</div>
							<div className={styles.statRow}>
								<span className={styles.statLabel}>
									Puzzles Completed
								</span>
								<span className={styles.statValue}>
									{stats.totalCompleted || 0}
								</span>
							</div>
							<div className={styles.statsDivider}></div>
						</div>
					)}

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
