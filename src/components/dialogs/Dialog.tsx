import { useEffect } from "react";
import { FocusTrap } from "focus-trap-react";
import styles from "./Dialog.module.css";

interface DialogProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
}

function Dialog({ isOpen, onClose, title, children }: DialogProps) {
	// Handle Escape key independently -- FocusTrap only traps Tab focus.
	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent): void => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div className={styles.dialogOverlay} onClick={onClose}>
			<FocusTrap
				focusTrapOptions={{
					allowOutsideClick: true,
					escapeDeactivates: false,
					fallbackFocus: "body",
				}}
			>
				<div
					role="dialog"
					aria-modal="true"
					aria-label={title}
					className={styles.dialogContent}
					onClick={(e) => e.stopPropagation()}
				>
					<div className={styles.dialogHeader}>
						<h2>{title}</h2>
						<button
							className={styles.dialogClose}
							onClick={onClose}
						>
							✕
						</button>
					</div>
					<div className={styles.dialogBody}>{children}</div>
				</div>
			</FocusTrap>
		</div>
	);
}

export default Dialog;
