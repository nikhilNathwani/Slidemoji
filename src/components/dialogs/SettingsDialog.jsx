import Dialog from "./Dialog";
import styles from "./SettingsDialog.module.css";
import { FontAwesomeIcon } from "../../utils/icons";
import { DIFFICULTIES } from "../../constants";

function SettingsDialog({
	isOpen,
	onClose,
	hasDarkMode,
	onDarkModeChange,
	hasNumbersShown,
	onShowNumbersChange,
	hasSoundEnabled,
	onSoundEnabledChange,
	difficulty,
	onDifficultyChange,
	isPuzzleSolved = false,
	onAlmostSolve,
	onTogglePremium,
}) {
	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Settings">
			<div className={styles.settingsContent}>
				<div className={styles.settingsItem}>
					<label className={styles.settingsLabel}>Difficulty</label>
					<div className={styles.difficultySelector}>
						{DIFFICULTIES.map((diff) => (
							<button
								key={diff.value}
								className={`${styles.difficultyBtn} ${
									difficulty === diff.value
										? styles.active
										: ""
								}`}
								onClick={() => onDifficultyChange(diff.value)}
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
				<div className={styles.settingsDivider}></div>
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
				{process.env.NODE_ENV === "development" && onAlmostSolve && (
					<>
						<div className={styles.settingsItem}>
							<label className={styles.settingsLabel}>
								Dev Tools
							</label>
							<div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
								<button
									onClick={() => {
										onAlmostSolve();
										setTimeout(() => onClose(), 300);
									}}
									className={styles.devButton}
								>
									Almost Solved
								</button>
								<button
									onClick={() => onTogglePremium?.(true)}
									className={styles.devButton}
								>
									Grant Premium
								</button>
								<button
									onClick={() => {
										onTogglePremium?.(false);
										localStorage.removeItem("slidemoji_archive_seen");
									}}
									className={styles.devButton}
								>
									Revoke Premium
								</button>
							</div>
						</div>
						<div className={styles.settingsDivider}></div>
					</>
				)}
				<div className={styles.settingsActions}>
					<a
						href="mailto:support.slidemoji@gmail.com?subject=Slidemoji%20Feedback"
						className={`${styles.actionButton} ${styles.feedback}`}
					>
						<FontAwesomeIcon icon="comment" />
						Give Feedback
					</a>
					<a
						href={`mailto:support.slidemoji@gmail.com?subject=Slidemoji%20Bug%20Report&body=${encodeURIComponent(
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

function Toggle({ isOn, onToggle, disabled = false }) {
	return (
		<button
			className={`${styles.toggle} ${isOn ? styles.on : styles.off}`}
			onClick={onToggle}
			disabled={disabled}
		>
			<span className={styles.slider}></span>
			<span className={styles.label}>{isOn ? "ON" : "OFF"}</span>
		</button>
	);
}

export default SettingsDialog;
