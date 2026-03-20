import GoogleSignInButton from "../common/GoogleSignInButton";
import { FontAwesomeIcon } from "../../utils/icons";
import styles from "./Game.module.css";

/**
 * GameActionButton - Dynamic button shown below the game grid
 *
 * Shows different actions based on game state:
 * - Sign in upsell (when solved while signed out)
 * - View Trophies (when solved both difficulties or just 4x4)
 * - Try Hard mode (when solved 3x3 but not 4x4 yet)
 * - Restart (when game is in progress)
 */
function GameActionButton({
	isSolved,
	user,
	gridSize,
	maxGridSizeSolved,
	onOpenStats,
	onGridSizeChange,
	onRestart,
}) {
	// Signed out and solved - show sign-in upsell
	if (isSolved && !user) {
		return (
			<div className={`${styles.restartContainer} ${styles.visible}`}>
				<div style={{ textAlign: "center", marginBottom: "12px" }}>
					<h3
						style={{
							fontSize: "var(--text-lg)",
							color: "var(--text-primary)",
							marginBottom: "8px",
						}}
					>
						Save Your Trophies
					</h3>
					<p
						style={{
							fontSize: "var(--text-base)",
							color: "var(--text-secondary)",
							margin: 0,
							lineHeight: 1.5,
						}}
					>
						Sign in to save your trophies across devices and track
						your progress over time.
					</p>
				</div>
				<GoogleSignInButton />
			</div>
		);
	}

	// Solved 4x4 - show View Trophies
	if (isSolved && gridSize === 4) {
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

	// Solved 3x3 but not 4x4 - show Try Hard mode
	if (isSolved && gridSize === 3 && maxGridSizeSolved < 4) {
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

	// Solved both 3x3 and 4x4 - show View Trophies
	if (isSolved && gridSize === 3 && maxGridSizeSolved >= 4) {
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
