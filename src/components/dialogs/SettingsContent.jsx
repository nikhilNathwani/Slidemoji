import Toggle from "../common/Toggle";
import { DIFFICULTIES } from "../../constants";
import styles from "./SettingsContent.module.css";
import { FontAwesomeIcon } from "../../utils/icons";

function SettingsContent({
	gridSize,
	onGridSizeChange,
	darkMode,
	onDarkModeChange,
	showNumbers,
	onShowNumbersChange,
	onSolve,
}) {
	const difficulties = DIFFICULTIES;

	return (
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
					isOn={showNumbers}
					onToggle={() => onShowNumbersChange(!showNumbers)}
				/>
			</div>
			<div className={styles.settingsItem}>
				<label className={styles.settingsLabel}>Dark Mode</label>
				<Toggle
					isOn={darkMode}
					onToggle={() => onDarkModeChange(!darkMode)}
				/>
			</div>
			<div className={styles.settingsDivider}></div>
			<div className={styles.settingsActions}>
				<a
					href="mailto:nnathwani36@gmail.com?subject=Slidemoji%20Feedback"
					className={`${styles.actionButton} ${styles.feedback}`}
				>
					<i className="fas fa-comment"></i>
					Give Feedback
				</a>
				<a
					href={`mailto:nnathwani36@gmail.com?subject=Slidemoji%20Bug%20Report&body=${encodeURIComponent(
						"Please describe the issue you encountered:\n\n\n\n---\nDebug Information:\n" +
							`User Agent: ${navigator.userAgent}\n` +
							`Screen Size: ${window.innerWidth}x${window.innerHeight}\n` +
							`Grid Size: ${gridSize}\n` +
							`Dark Mode: ${darkMode}\n` +
							`Show Numbers: ${showNumbers}\n` +
							`Timestamp: ${new Date().toISOString()}`,
					)}`}
					className={`${styles.actionButton} ${styles.report}`}
				>
					<i className="fas fa-bug"></i>
					Report an Issue
				</a>
				<button
					className={`${styles.actionButton} ${styles.solve}`}
					onClick={onSolve}
				>
					<i className="fas fa-magic"></i>
					Solve (Dev)
				</button>
			</div>
		</div>
	);
}

export default SettingsContent;
