import Dialog from "./Dialog";
import styles from "./ConfirmRestart.module.css";
import { FontAwesomeIcon, faRedo } from "../../utils/icons";

function ConfirmRestartDialog({ isOpen, onClose, onConfirm }) {
	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title={
				<>
					<FontAwesomeIcon
						icon={faRedo}
						style={{ marginRight: "0.35em" }}
					/>
					Restart Puzzle?
				</>
			}
		>
			<div className={styles.confirmDialogContent}>
				<p>
					This will restart the puzzle and reset your current
					progress. Are you sure?
				</p>
				<div className={styles.confirmButtons}>
					<button
						className="btn btn-secondary btn-cancel"
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						className="btn btn-secondary"
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
