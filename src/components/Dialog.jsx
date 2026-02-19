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
		</div>
	);
}

export function WinContent() {
	return (
		<div className="win-dialog-content">
			<div className="emoji">🎊</div>
			<h3>You solved it!</h3>
			<p>Great job completing the puzzle!</p>
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
