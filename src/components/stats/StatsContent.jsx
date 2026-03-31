import TrophyCase from "../stats/TrophyCase";
import TrophyCaseTitle from "../stats/TrophyCaseTitle";
import SignInUpsell from "../common/SignInUpsell";
import { useAuth } from "../../hooks/useAuth";
import { getLatestPuzzleId } from "../../utils/puzzleUtils";
import styles from "./StatsContent.module.css";

function StatsContent({ showTitle = false, solvedPuzzles, currentPuzzleId }) {
	const { user } = useAuth();

	const numTotalPuzzles = getLatestPuzzleId();
	const numEarnedTrophies = Object.keys(solvedPuzzles || {}).length;

	return (
		<div className={styles.statsContent}>
			{/* Anonymous users: Show sign-in upsell */}
			{user?.isAnonymous !== false ? (
				<SignInUpsell />
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
