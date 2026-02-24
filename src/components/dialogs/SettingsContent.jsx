import Toggle from "../common/Toggle";
import { DIFFICULTIES } from "../../constants";
import styles from "./SettingsContent.module.css";

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
