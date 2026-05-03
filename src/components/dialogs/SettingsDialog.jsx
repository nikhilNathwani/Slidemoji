import Dialog from "./Dialog";
import styles from "./SettingsDialog.module.css";
import { FontAwesomeIcon, faCog } from "../../utils/icons";
import { DIFFICULTIES } from "../../constants";
import { usePreference } from "../../hooks/usePreference";
import { useTheme } from "../../hooks/useTheme";

function SettingsDialog({
	isOpen,
	onClose,
	difficulty,
	onDifficultyChange,
	isPuzzleSolved = false,
}) {
	const [showNumbers, setShowNumbers] = usePreference("showNumbers");
	const [soundEnabled, setSoundEnabled] = usePreference("soundEnabled");
	const [darkMode, setDarkMode] = useTheme();
	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title={
				<>
					<FontAwesomeIcon
						icon={faCog}
						className={styles.settingsIcon}
					/>{" "}
					Settings
				</>
			}
		>
			<div className={styles.settingsContent}>
				<div className={styles.settingsItem}>
					<label className={styles.settingsLabel}>Difficulty</label>
					<div className={styles.difficultySelector}>
						{DIFFICULTIES.map((diff) => (
							<button
								key={diff.value}
								className={`selectorBtn ${difficulty === diff.value ? "active" : ""}`}
								onClick={() => onDifficultyChange(diff.value)}
							>
								<span>{diff.label}</span>
								<span className="selectorBtnSubtitle">
									{diff.display}
								</span>
							</button>
						))}
					</div>
				</div>
				{!isPuzzleSolved && (
					<div className={styles.settingsItem}>
						<label className={styles.settingsLabel}>
							Show Numbers
						</label>
						<Toggle
							isOn={showNumbers}
							onToggle={() => setShowNumbers(!showNumbers)}
						/>
					</div>
				)}
				{!isPuzzleSolved && (
					<div className={styles.settingsItem}>
						<label className={styles.settingsLabel}>
							Sound Effects
						</label>
						<Toggle
							isOn={soundEnabled}
							onToggle={() => setSoundEnabled(!soundEnabled)}
						/>
					</div>
				)}
				<div className={styles.settingsItem}>
					<label className={styles.settingsLabel}>Dark Mode</label>
					<Toggle
						isOn={darkMode}
						onToggle={() => setDarkMode(!darkMode)}
					/>
				</div>
				<div className={styles.settingsDivider} />
				<div className={styles.settingsActions}>
					<a
						href="mailto:support.slidemoji@gmail.com?subject=Slidemoji%20Feedback"
						className="btn btn-outline"
					>
						Give Feedback
					</a>
					<a
						href={`mailto:support.slidemoji@gmail.com?subject=Slidemoji%20Bug%20Report&body=${encodeURIComponent(
							"Please describe the issue you encountered:\n\n\n\n---\nDebug Information:\n" +
								`User Agent: ${navigator.userAgent}\n` +
								`Screen Size: ${window.innerWidth}x${window.innerHeight}\n` +
								`Dark Mode: ${darkMode}\n` +
								`Show Numbers: ${showNumbers}\n` +
								`Timestamp: ${new Date().toISOString()}`,
						)}`}
						className="btn btn-outline"
					>
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
			<span className={styles.slider} />
			<span className={styles.label}>{isOn ? "ON" : "OFF"}</span>
		</button>
	);
}

export default SettingsDialog;
