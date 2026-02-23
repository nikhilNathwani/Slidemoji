import Toggle from "../common/Toggle";
import { DIFFICULTIES } from "../../constants";

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
		<div className="settings-content">
			<div className="settings-item">
				<label className="settings-label">Difficulty</label>
				<div className="difficulty-selector">
					{difficulties.map((diff) => (
						<button
							key={diff.size}
							className={
								gridSize === diff.size
									? "difficulty-btn active"
									: "difficulty-btn"
							}
							onClick={() => onGridSizeChange(diff.size)}
						>
							<span className="difficulty-label">
								{diff.label}
							</span>
							<span className="difficulty-size">
								{diff.display}
							</span>
						</button>
					))}
				</div>
			</div>
			<div className="settings-item">
				<label className="settings-label">Show Numbers</label>
				<Toggle
					isOn={showNumbers}
					onToggle={() => onShowNumbersChange(!showNumbers)}
				/>
			</div>
			<div className="settings-item">
				<label className="settings-label">Dark Mode</label>
				<Toggle
					isOn={darkMode}
					onToggle={() => onDarkModeChange(!darkMode)}
				/>
			</div>
			<div className="settings-divider"></div>
			<div className="settings-actions">
				<button className="action-button solve" onClick={onSolve}>
					<i className="fas fa-magic"></i>
					Solve (Dev)
				</button>
			</div>
		</div>
	);
}

export default SettingsContent;
