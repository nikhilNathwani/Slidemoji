import TrophyCase from "../stats/TrophyCase";
import TrophyCaseTitle from "../stats/TrophyCaseTitle";
import SignInUpsell from "../../auth/SignInUpsell";
import {
	FontAwesomeIcon,
	faClockRotateLeft,
	faUnlock,
} from "../../utils/icons";
import { useAuth } from "../../auth/useAuth";
import { useSubscription } from "../../payment/useSubscription";
import { useSolvedGames } from "../../hooks/useSolvedGames";
import { getLatestPuzzleId } from "../../utils/puzzleUtils";
import styles from "./StatsContent.module.css";

function StatsContent({
	showTitle = false,
	onUnlockArchiveClick,
	devIsPremium,
}) {
	const { user } = useAuth();
	const { isPremium: firestoreIsPremium } = useSubscription();
	const { solvedGames } = useSolvedGames();
	const isPremium = devIsPremium ?? firestoreIsPremium;

	const numTotalPuzzles = getLatestPuzzleId();
	const numEarnedTrophies = Object.keys(solvedGames || {}).length;

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

					{/* Trophy Case */}
					<TrophyCase solvedGames={solvedGames} />

					{/* Archive section */}
					<div className={styles.statsDivider}></div>
					{isPremium ? (
						<div className={styles.archiveSection}>
							<p className={styles.archiveDescription}>
								Archive unlocked! Use the{" "}
								<strong>
									Puzzle Archive{" "}
									<FontAwesomeIcon icon={faClockRotateLeft} />
								</strong>{" "}
								button in the header to play past puzzles and
								complete your trophy collection.
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
								className="btn btn-solid"
								onClick={onUnlockArchiveClick}
							>
								<FontAwesomeIcon icon={faUnlock} />
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
