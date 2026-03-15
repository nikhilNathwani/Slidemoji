import Dialog from "./Dialog";
import styles from "./ConfirmRestart.module.css";

function ConfirmRestartDialog({ isOpen, onClose, onConfirm }) {
	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Restart Puzzle?">
			<div className={styles.confirmDialogContent}>
				<p>
					This will restart the puzzle and reset your current
					progress. Are you sure?
				</p>
				<div className={styles.confirmButtons}>
					<button
						className={`${styles.confirmBtn} ${styles.cancel}`}
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						className={`${styles.confirmBtn} ${styles.confirm}`}
						onClick={onConfirm}
					>
						Confirm
					</button>
				</div>
			</div>
		</Dialog>
	);
}

export default ConfirmRestartDialog;
