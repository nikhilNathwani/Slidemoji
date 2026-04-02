import TrophyCase from "../stats/TrophyCase";
import TrophyCaseTitle from "../stats/TrophyCaseTitle";
import SignInUpsell from "../common/SignInUpsell";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { getLatestPuzzleId } from "../../utils/puzzleUtils";
import styles from "./StatsContent.module.css";

function StatsContent({
	showTitle = false,
	solvedPuzzles,
	currentPuzzleId,
	onUnlockArchiveClick,
}) {
	const { user } = useAuth();
	const { isPremium } = useSubscription();

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

					{/* Archive section */}
					<div className={styles.statsDivider}></div>
					{isPremium ? (
						<div className={styles.archiveSection}>
							<p className={styles.archiveDescription}>
								✅ Archive unlocked! Use the{" "}
								<strong>clock button</strong> in the header to
								browse past puzzles.
							</p>
						</div>
					) : (
						<div className={styles.archiveSection}>
							<h3 className={styles.archiveTitle}>
								Puzzle Archive
							</h3>
							<p className={styles.archiveDescription}>
								Play past puzzles to earn missed trophies and
								complete your collection.
							</p>
							<button
								className={styles.unlockButton}
								onClick={onUnlockArchiveClick}
							>
								Unlock Archive
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}

export default StatsContent;
