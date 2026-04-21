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
import { useSolvedPuzzles } from "../../hooks/useSolvedPuzzles";
import { getLatestPuzzleId } from "../../utils/puzzleUtils";
import { usePuzzles } from "../../hooks/usePuzzle";
import styles from "./StatsContent.module.css";

function StatsContent({
	showTitle = false,
	onUnlockArchiveClick,
	devIsPremium,
}) {
	const { user } = useAuth();
	const { isPremium: firestoreIsPremium } = useSubscription();
	const { solvedPuzzles, isLoading: isSolvedPuzzlesLoading } =
		useSolvedPuzzles();
	const isPremium = devIsPremium ?? firestoreIsPremium;

	const numTotalPuzzles = getLatestPuzzleId();
	const numEarnedTrophies = Object.keys(solvedPuzzles || {}).length;

	// usePuzzles gates TrophyCase on last page being cache-warm (fast fallback if
	// App's background prefetch hasn't completed yet when the dialog opens).
	const TROPHIES_PER_PAGE = 12;
	const initialPage = Math.ceil(numTotalPuzzles / TROPHIES_PER_PAGE);
	const lastPageStart = (initialPage - 1) * TROPHIES_PER_PAGE + 1;
	const lastPageEnd = initialPage * TROPHIES_PER_PAGE;
	const allEarnedIds = Object.keys(solvedPuzzles || {}).map(Number);
	const lastPageEarnedIds = allEarnedIds.filter(
		(id) => id >= lastPageStart && id <= lastPageEnd,
	);

	const { isLoading: isLastPageLoading } = usePuzzles(lastPageEarnedIds);

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

					{/* Trophy Case — skeleton shown while data loads, then pops in fully */}
					<TrophyCase
						totalPuzzles={numTotalPuzzles}
						solvedPuzzles={solvedPuzzles}
						showTitle={false}
						isLoading={isSolvedPuzzlesLoading || isLastPageLoading}
					/>

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
