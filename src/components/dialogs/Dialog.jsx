import FocusTrap from "focus-trap-react";
import styles from "./Dialog.module.css";

function Dialog({ isOpen, onClose, title, children }) {
	if (!isOpen) return null;

	return (
		<div className={styles.dialogOverlay} onClick={onClose}>
			<FocusTrap focusTrapOptions={{ allowOutsideClick: true, onDeactivate: onClose }}>
				<div
					role="dialog"
					aria-modal="true"
					aria-label={title}
					className={styles.dialogContent}
					onClick={(e) => e.stopPropagation()}
				>
					<div className={styles.dialogHeader}>
						<h2>{title}</h2>
						<button className={styles.dialogClose} onClick={onClose}>
							×
						</button>
					</div>
					<div className={styles.dialogBody}>{children}</div>
				</div>
			</FocusTrap>
		</div>
	);
}

export default Dialog;