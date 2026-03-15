import TrophyCase from "../stats/TrophyCase";
import TrophyCaseTitle from "../stats/TrophyCaseTitle";
import GoogleSignInButton from "../common/GoogleSignInButton";
import { useAuth } from "../../hooks/useAuth";
import { useUser } from "../../hooks/useUser";
import { getTodaysPuzzleNumber } from "../../utils/dateUtils";
import styles from "./StatsContent.module.css";
import { FontAwesomeIcon } from "../../utils/icons";

function StatsContent({ showTitle = false }) {
	const { user } = useAuth();
	const { data: userData } = useUser(user?.uid);
	const todaysPuzzleNumber = getTodaysPuzzleNumber();

	const solvedPuzzles = userData?.stats?.solvedPuzzles;
	const numTotalPuzzles = todaysPuzzleNumber;
	const numEarnedTrophies = Object.keys(solvedPuzzles || {}).length;

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
							<TrophyCaseTitle
								numEarnedTrophies={numEarnedTrophies}
								numTotalTrophies={numTotalPuzzles}
								isDialogHeader={false}
							></TrophyCaseTitle>
						</>
					)}

					{/* Trophy Case (signed-in only) */}
					<TrophyCase
						totalPuzzles={numTotalPuzzles}
						solvedPuzzles={solvedPuzzles}
						showTitle={false}
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
