import TrophyCase from "../stats/TrophyCase";
import TrophyCaseTitle from "../stats/TrophyCaseTitle";
import GoogleSignInButton from "../common/GoogleSignInButton";
import { useAuth } from "../../hooks/useAuth";
import { getLatestPuzzleId } from "../../utils/puzzleUtils";
import styles from "./StatsContent.module.css";
import { FontAwesomeIcon } from "../../utils/icons";

function StatsContent({
	showTitle = false,
	solvedPuzzles,
	currentPuzzleId,
	onSelectPuzzle,
}) {
	const { user } = useAuth();

	const numTotalPuzzles = getLatestPuzzleId();
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
						<FontAwesomeIcon
							icon="shield-alt"
							style={{ position: "relative", top: "0.275em" }}
						/>
						<span>
							Your email is only used to save your progress. Your
							data is never sold or shared.
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
						puzzleId={currentPuzzleId || getLatestPuzzleId()}
						onSelectPuzzle={onSelectPuzzle}
					/>

					{/* Archive Coming Soon (signed-in only) */}
					<div className={styles.statsDivider}></div>
					<div className={styles.archiveSection}>
						<h3 className={styles.archiveTitle}>Coming Soon</h3>
						<p className={styles.archiveDescription}>
							Play past puzzles from the archive to earn missed
							trophies and complete your collection!
						</p>
					</div>
				</>
			)}
		</div>
	);
}

export default StatsContent;
