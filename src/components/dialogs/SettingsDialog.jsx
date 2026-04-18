import Dialog from "./Dialog";
import styles from "./SettingsDialog.module.css";
import { FontAwesomeIcon, faComment, faBug, faCog } from "../../utils/icons";
import { DIFFICULTIES } from "../../constants";
import { useUserDoc } from "../../hooks/useUserDoc";
import { usePreference } from "../../hooks/usePreference";
import { useTheme } from "../../hooks/useTheme";

function SettingsDialog({
	isOpen,
	onClose,
	difficulty,
	onDifficultyChange,
	isPuzzleSolved = false,
	onAlmostSolve,
	onTogglePremium,
}) {
	const [showNumbers, setShowNumbers] = usePreference("showNumbers");
	const [soundEnabled, setSoundEnabled] = usePreference("soundEnabled");
	const [darkMode, setDarkMode] = useTheme();
	const { userDoc } = useUserDoc();
	const isDevMode = import.meta.env.DEV || userDoc?.isDevMode === true;
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
								className={`selectorBtn ${styles.difficultyBtn} ${difficulty === diff.value ? "active" : ""}`}
								onClick={() => onDifficultyChange(diff.value)}
							>
								<span>{diff.label}</span>
								<span className="selectorBtnSub">
									{diff.display}
								</span>
							</button>
						))}
					</div>
				</div>
				<div className={styles.settingsDivider}></div>
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
				<div className={styles.settingsItem}>
					<label className={styles.settingsLabel}>
						Sound Effects
					</label>
					<Toggle
						isOn={soundEnabled}
						onToggle={() => setSoundEnabled(!soundEnabled)}
					/>
				</div>
				<div className={styles.settingsItem}>
					<label className={styles.settingsLabel}>Dark Mode</label>
					<Toggle
						isOn={darkMode}
						onToggle={() => setDarkMode(!darkMode)}
					/>
				</div>
				<div className={styles.settingsDivider}></div>
				{isDevMode && onAlmostSolve && (
					<>
						<div className={styles.settingsItem}>
							<label className={styles.settingsLabel}>
								Dev Tools
							</label>
							<div
								style={{
									display: "flex",
									gap: "8px",
									flexDirection: "column",
									alignItems: "flex-end",
								}}
							>
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
									onClick={() => onTogglePremium?.(false)}
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
						className="btn btn-secondary"
					>
						<FontAwesomeIcon icon={faComment} />
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
						className="btn btn-secondary"
					>
						<FontAwesomeIcon icon={faBug} />
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
