import SignInUpsell from "../common/SignInUpsell";
import { FontAwesomeIcon, faTrophy, faRedo } from "../../utils/icons";
import styles from "./Game.module.css";

/**
 * GameActionButton - Dynamic button shown below the game grid (3x3 only)
 *
 * Shows different actions based on game state:
 * - Sign in upsell (when solved while signed out)
 * - View Trophies (when solved while signed in)
 * - Restart (when game is in progress)
 */
function GameActionButton({ isSolved, isSignedIn, onOpenStats, onRestart }) {
	// Signed out and solved - show sign-in upsell
	if (isSolved && !isSignedIn) {
		return (
			<>
				<div style={{ height: 0.5 + "rem" }}></div>
				<SignInUpsell isCondensed={true}></SignInUpsell>
			</>
		);
	}

	// Solved and signed in - show View Trophies
	if (isSolved) {
		return (
			<button
				className={`${styles.restartButton} ${styles.visible}`}
				onClick={onOpenStats}
				title="View your trophy collection"
			>
				<FontAwesomeIcon icon={faTrophy} />
				View Trophies
			</button>
		);
	}

	// Not won yet - show Restart
	return (
		<button
			className={`${styles.restartButton} ${styles.visible}`}
			onClick={onRestart}
			title="Restart Puzzle"
		>
			<FontAwesomeIcon icon={faRedo} />
			Restart
		</button>
	);
}

export default GameActionButton;
