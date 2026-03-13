import Dialog from "./Dialog";
import Toggle from "../common/Toggle";
import { DIFFICULTIES } from "../../constants";
import styles from "./SettingsDialog.module.css";
import { FontAwesomeIcon } from "../../utils/icons";

function SettingsDialog({
	isOpen,
	onClose,
	gridSize,
	onGridSizeChange,
	hasDarkMode,
	onDarkModeChange,
	hasNumbersShown,
	onShowNumbersChange,
	hasSoundEnabled,
	onSoundEnabledChange,
}) {
	const difficulties = DIFFICULTIES;

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Settings">
			<div className={styles.settingsContent}>
				<div className={styles.settingsItem}>
					<label className={styles.settingsLabel}>Difficulty</label>
					<div className={styles.difficultySelector}>
						{difficulties.map((diff) => (
							<button
								key={diff.size}
								className={
									gridSize === diff.size
										? `${styles.difficultyBtn} ${styles.active}`
										: styles.difficultyBtn
								}
								onClick={() => onGridSizeChange(diff.size)}
							>
								<span className={styles.difficultyLabel}>
									{diff.label}
								</span>
								<span className={styles.difficultySize}>
									{diff.display}
								</span>
							</button>
						))}
					</div>
				</div>
				<div className={styles.settingsItem}>
					<label className={styles.settingsLabel}>Show Numbers</label>
					<Toggle
						isOn={hasNumbersShown}
						onToggle={() => onShowNumbersChange(!hasNumbersShown)}
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
								`Grid Size: ${gridSize}\n` +
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
