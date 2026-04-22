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
import styles from "./StatsContent.module.css";

function StatsContent({
	showTitle = false,
	showArchiveSection = true,
	showPremiumArchiveHint = true,
	puzzleId = null,
	onUnlockArchiveClick,
	devIsPremium,
}) {
	const { user } = useAuth();
	const { isPremium: firestoreIsPremium } = useSubscription();
	const { solvedGames } = useSolvedGames();
	const isPremium = devIsPremium ?? firestoreIsPremium;

	return (
		<div className={styles.statsContent}>
			{/* Anonymous users: Show sign-in upsell */}
			{user?.isAnonymous !== false ? (
				<SignInUpsell />
			) : (
				<>
					{showTitle && <TrophyCaseTitle isDialogHeader={false} />}

					{/* Trophy Case */}
					<TrophyCase
						solvedGames={solvedGames}
						highlightPuzzleId={puzzleId}
					/>

					{/* Archive section */}
					{/* <div className={styles.statsDivider}></div> */}
					{showArchiveSection && (isPremium ? (
						showPremiumArchiveHint && (
						<div className={styles.archiveSection}>
							<p className={styles.archiveDescription}>
								Use the{" "}
								<strong>
									Puzzle Archive{" "}
									<FontAwesomeIcon icon={faClockRotateLeft} />
								</strong>{" "}
								button in the header to play past puzzles and
								add to your trophy collection.
							</p>
						</div>
						)
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
					))}
				</>
			)}
		</div>
	);
}

export default StatsContent;
