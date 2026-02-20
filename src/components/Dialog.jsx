function Dialog({ isOpen, onClose, title, children }) {
	if (!isOpen) return null;

	return (
		<div className="dialog-overlay" onClick={onClose}>
			<div
				className="dialog-content"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="dialog-header">
					<h2>{title}</h2>
					<button className="dialog-close" onClick={onClose}>
						×
					</button>
				</div>
				<div className="dialog-body">{children}</div>
			</div>
		</div>
	);
}

// ===== Dialog Content Components =====

export function SettingsContent({
	selectedSize,
	onSizeChange,
	showNumbers,
	onShowNumbersChange,
	darkMode,
	onDarkModeChange,
	onSolve,
}) {
	const difficulties = [
		{ size: 3, label: "Normal", display: "3×3" },
		{ size: 4, label: "Hard", display: "4×4" },
	];

	return (
		<div className="settings-content">
			<div className="settings-item">
				<label className="settings-label">Difficulty</label>
				<div className="difficulty-selector">
					{difficulties.map((diff) => (
						<button
							key={diff.size}
							className={
								selectedSize === diff.size
									? "difficulty-btn active"
									: "difficulty-btn"
							}
							onClick={() => onSizeChange(diff.size)}
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
				<button
					className={`toggle-switch ${showNumbers ? "on" : "off"}`}
					onClick={() => onShowNumbersChange(!showNumbers)}
				>
					<span className="toggle-slider"></span>
					<span className="toggle-label">
						{showNumbers ? "ON" : "OFF"}
					</span>
				</button>
			</div>
			<div className="settings-item">
				<label className="settings-label">Dark Mode</label>
				<button
					className={`toggle-switch ${darkMode ? "on" : "off"}`}
					onClick={() => onDarkModeChange(!darkMode)}
				>
					<span className="toggle-slider"></span>
					<span className="toggle-label">
						{darkMode ? "ON" : "OFF"}
					</span>
				</button>
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

export function WinContent({ earnedEmoji }) {
	return (
		<div className="win-dialog-content">
			<div className="earned-trophy">
				<div className="trophy-sparkle">✨</div>
				<div className="earned-emoji">{earnedEmoji}</div>
				<div className="trophy-sparkle">✨</div>
			</div>
			<h3>You earned today's emoji!</h3>
			<p>Added to your trophy case</p>
			<div className="win-emoji">🎊</div>
		</div>
	);
}

export function ConfirmContent({ message, onConfirm, onCancel }) {
	return (
		<div className="confirm-dialog-content">
			<p>{message}</p>
			<div className="confirm-buttons">
				<button className="confirm-btn cancel" onClick={onCancel}>
					Cancel
				</button>
				<button className="confirm-btn confirm" onClick={onConfirm}>
					Confirm
				</button>
			</div>
		</div>
	);
}

export default Dialog;
