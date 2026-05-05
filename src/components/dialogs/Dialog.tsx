import { useEffect } from "react";
import { FontAwesomeIcon } from "../../utils/icons";
import { faXmark } from "../../utils/icons";
import { FocusTrap } from "focus-trap-react";
import styles from "./Dialog.module.css";

interface DialogProps {
	isOpen: boolean;
	onClose: () => void;
	title: React.ReactNode;
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

	// Prevent background scroll while dialog is open (FocusTrap doesn't handle scroll).
	useEffect(() => {
		if (!isOpen) return;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className={styles.dialogOverlay} onClick={onClose}>
			<FocusTrap
				focusTrapOptions={{
					allowOutsideClick: true,
					escapeDeactivates: false,
					fallbackFocus: "body",
					initialFocus: "#dialog-container",
					// Don't return focus to the header button that opened the dialog.
					// Without this, the button retains a visible focus ring after the dialog closes.
					returnFocusOnDeactivate: false,
				}}
			>
				<div
					id="dialog-container"
					tabIndex={-1}
					role="dialog"
					aria-modal="true"
					aria-label={typeof title === "string" ? title : undefined}
					className={styles.dialogContent}
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => {
						if (e.key === "ArrowDown") {
							e.preventDefault();
							e.currentTarget.scrollBy({
								top: 80,
								behavior: "smooth",
							});
						} else if (e.key === "ArrowUp") {
							e.preventDefault();
							e.currentTarget.scrollBy({
								top: -80,
								behavior: "smooth",
							});
						}
					}}
				>
					<div className={styles.dialogHeader}>
						<h2>{title}</h2>
						<button
							className={`btn-icon ${styles.dialogClose}`}
							onClick={onClose}
						>
							<FontAwesomeIcon icon={faXmark} />
						</button>
					</div>
					<div className={styles.dialogBody}>{children}</div>
				</div>
			</FocusTrap>
		</div>
	);
}

export default Dialog;
