import SignInUpsell from "../../auth/SignInUpsell";
import {
	FontAwesomeIcon,
	faTrophy,
	faClockRotateLeft,
	faRedo,
} from "../../utils/icons";
import styles from "./Game.module.css";

/**
 * GameActionButton - Dynamic button shown below the game grid (3x3 only)
 *
 * Shows different actions based on game state:
 * - Sign in upsell (when solved while signed out)
 * - See Results + Play Another (when solved while signed in)
 * - Restart (when game is in progress)
 */
function GameActionButton({
	isSolved,
	isSignedIn,
	onShowResults,
	onOpenArchive,
	onRestart,
}) {
	// Signed out and solved - show sign-in upsell
	if (isSolved && !isSignedIn) {
		return (
			<>
				<div style={{ height: 0.5 + "rem" }}></div>
				<SignInUpsell isCondensed={true}></SignInUpsell>
			</>
		);
	}

	// Solved and signed in - show See Results + Play Another
	if (isSolved) {
		return (
			<div className={styles.solvedButtons}>
				<button
					className={`btn btn-outline ${styles.visible}`}
					onClick={onShowResults}
					title="See your results and share"
				>
					<FontAwesomeIcon icon={faTrophy} />
					See Results
				</button>
				<button
					className={`btn btn-outline ${styles.visible}`}
					onClick={onOpenArchive}
					title="Play another puzzle"
				>
					<FontAwesomeIcon
						icon={faClockRotateLeft}
						style={{ fontSize: "1.125em" }}
					/>
					Play Another
				</button>
			</div>
		);
	}

	// Not won yet - show Restart
	return (
		<button
			className="btn btn-outline"
			onClick={onRestart}
			title="Restart Puzzle"
		>
			Restart
		</button>
	);
}

export default GameActionButton;
