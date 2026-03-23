import Dialog from "./Dialog";
import Toggle from "../common/Toggle";
import styles from "./SettingsDialog.module.css";
import { FontAwesomeIcon } from "../../utils/icons";

function SettingsDialog({
	isOpen,
	onClose,
	hasDarkMode,
	onDarkModeChange,
	hasNumbersShown,
	onShowNumbersChange,
	hasSoundEnabled,
	onSoundEnabledChange,
	isPuzzleSolved = false,
}) {
	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Settings">
			<div className={styles.settingsContent}>
				<div
					className={`${styles.settingsItem} ${
						isPuzzleSolved ? styles.disabled : ""
					}`}
				>
					<label className={styles.settingsLabel}>
						Show Numbers
						{isPuzzleSolved && (
							<span className={styles.disabledHint}>
								(hidden when solved)
							</span>
						)}
					</label>
					<Toggle
						isOn={hasNumbersShown}
						onToggle={
							isPuzzleSolved
								? undefined
								: () => onShowNumbersChange(!hasNumbersShown)
						}
						disabled={isPuzzleSolved}
					/>
				</div>
				<div className={styles.settingsItem}>
					<label className={styles.settingsLabel}>
						Sound Effects
					</label>
					<Toggle
						isOn={hasSoundEnabled}
						onToggle={() => onSoundEnabledChange(!hasSoundEnabled)}
					/>
				</div>
				<div className={styles.settingsItem}>
					<label className={styles.settingsLabel}>Dark Mode</label>
					<Toggle
						isOn={hasDarkMode}
						onToggle={() => onDarkModeChange(!hasDarkMode)}
					/>
				</div>
				<div className={styles.settingsDivider}></div>
				<div className={styles.settingsActions}>
					<a
						href="mailto:nnathwani36@gmail.com?subject=Slidemoji%20Feedback"
						className={`${styles.actionButton} ${styles.feedback}`}
					>
						<FontAwesomeIcon icon="comment" />
						Give Feedback
					</a>
					<a
						href={`mailto:nnathwani36@gmail.com?subject=Slidemoji%20Bug%20Report&body=${encodeURIComponent(
							"Please describe the issue you encountered:\n\n\n\n---\nDebug Information:\n" +
								`User Agent: ${navigator.userAgent}\n` +
								`Screen Size: ${window.innerWidth}x${window.innerHeight}\n` +
								`Dark Mode: ${hasDarkMode}\n` +
								`Show Numbers: ${hasNumbersShown}\n` +
								`Timestamp: ${new Date().toISOString()}`,
						)}`}
						className={`${styles.actionButton} ${styles.report}`}
					>
						<FontAwesomeIcon icon="bug" />
						Report an Issue
					</a>
				</div>
			</div>
		</Dialog>
	);
}

export default SettingsDialog;
