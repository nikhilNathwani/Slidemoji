import TrophyCase from "../common/TrophyCase";
import GoogleSignInButton from "../common/GoogleSignInButton";
import { useAuth } from "../../hooks/useAuth";
import styles from "./StatsContent.module.css";
import { FontAwesomeIcon } from "../../utils/icons";

function StatsContent({ dailyEmoji, userData, totalPuzzles = 1, showTitle = false }) {
	const { user } = useAuth();

	// Extract earned puzzle IDs from userData
	const earnedPuzzleIds = new Set();
	if (userData?.stats?.completedPuzzles) {
		Object.keys(userData.stats.completedPuzzles).forEach((puzzleId) => {
			earnedPuzzleIds.add(parseInt(puzzleId));
		});
	}

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
						<FontAwesomeIcon icon="shield-alt" />
						<span>
							We respect your privacy. Your data is never sold or
							shared. We only use your email to save your
							progress.
						</span>
					</p>
				</div>
			) : (
				<>
					{showTitle && (
						<>
							<h3 className={styles.trophyCaseTitle}>
								<FontAwesomeIcon icon="trophy" /> Trophy Case
							</h3>
							<div className={styles.statsDivider}></div>
						</>
					)}

					{/* Trophy Case (signed-in only) */}
					<TrophyCase
						dailyEmoji={dailyEmoji}
						earnedPuzzleIds={earnedPuzzleIds}
						totalPuzzles={totalPuzzles}
						userData={userData}
						showTitle={!showTitle}
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
							<FontAwesomeIcon icon="unlock" />
							Unlock Archive
						</button>
					</div>
				</>
			)}
		</div>
	);
}

export default StatsContent;
