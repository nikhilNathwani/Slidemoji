import { FontAwesomeIcon } from "../../utils/icons";
import styles from "./Game.module.css";

/**
 * GameActionButton - Dynamic button shown below the game grid
 *
 * Shows different actions based on game state:
 * - Sign in upsell (when won while signed out)
 * - View Trophies (when won both difficulties or just 4x4)
 * - Try Hard mode (when won 3x3 but not 4x4 yet)
 * - Restart (when game is in progress)
 */
function GameActionButton({
	isCompleted,
	user,
	gridSize,
	maxGridSizeSolved,
	onSignIn,
	onOpenStats,
	onGridSizeChange,
	onRestart,
}) {
	// Signed out and won - show sign-in upsell
	if (isCompleted && !user) {
		return (
			<button
				className={`${styles.restartButton} ${styles.visible}`}
				onClick={onSignIn}
				title="Sign in to save your trophy"
			>
				<FontAwesomeIcon icon="user" />
				Sign in to save
			</button>
		);
	}

	// Won 4x4 - show View Trophies
	if (isCompleted && gridSize === 4) {
		return (
			<button
				className={`${styles.restartButton} ${styles.visible}`}
				onClick={onOpenStats}
				title="View your trophy collection"
			>
				<FontAwesomeIcon icon="trophy" />
				View Trophies
			</button>
		);
	}

	// Won 3x3 but not 4x4 - show Try Hard mode
	if (isCompleted && gridSize === 3 && maxGridSizeSolved < 4) {
		return (
			<button
				className={`${styles.restartButton} ${styles.visible}`}
				onClick={() => onGridSizeChange(4)}
				title="Try the harder 4x4 puzzle"
			>
				<FontAwesomeIcon icon="arrow-up" />
				Try Hard mode?
			</button>
		);
	}

	// Won both 3x3 and 4x4 - show View Trophies
	if (isCompleted && gridSize === 3 && maxGridSizeSolved >= 4) {
		return (
			<button
				className={`${styles.restartButton} ${styles.visible}`}
				onClick={onOpenStats}
				title="View your trophy collection"
			>
				<FontAwesomeIcon icon="trophy" />
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
			<FontAwesomeIcon icon="redo" />
			Restart
		</button>
	);
}

export default GameActionButton;
