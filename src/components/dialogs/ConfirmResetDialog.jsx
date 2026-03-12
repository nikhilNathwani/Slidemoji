import Dialog from "./Dialog";
import styles from "./ConfirmResetDialog.module.css";

function ConfirmResetDialog({ isOpen, onClose, onConfirm, message }) {
	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Change Difficulty?">
			<div className={styles.confirmDialogContent}>
				<p>{message}</p>
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

export default ConfirmResetDialog;
