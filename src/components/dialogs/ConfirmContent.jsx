import styles from "./ConfirmContent.module.css";

function ConfirmContent({ message, onConfirm, onCancel }) {
	return (
		<div className={styles.confirmDialogContent}>
			<p>{message}</p>
			<div className={styles.confirmButtons}>
				<button
					className={`${styles.confirmBtn} ${styles.cancel}`}
					onClick={onCancel}
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
	);
}

export default ConfirmContent;
