import GoogleSignInButton from "../common/GoogleSignInButton";
import { FontAwesomeIcon } from "../../utils/icons";
import styles from "./Game.module.css";

/**
 * GameActionButton - Dynamic button shown below the game grid (3x3 only)
 *
 * Shows different actions based on game state:
 * - Sign in upsell (when solved while signed out)
 * - View Trophies (when solved while signed in)
 * - Restart (when game is in progress)
 */
function GameActionButton({
	isSolved,
	user,
	onOpenStats,
	onRestart,
}) {
	// Signed out and solved - show sign-in upsell
	if (isSolved && !user) {
		return (
			<div
				className={`${styles.restartContainer} ${styles.visible}`}
				style={{
					flexDirection: "column",
					gap: "16px",
					alignItems: "center",
				}}
			>
				<div
					style={{ textAlign: "center", maxWidth: "min(90%, 400px)" }}
				>
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

	// Solved and signed in - show View Trophies
	if (isSolved) {
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
