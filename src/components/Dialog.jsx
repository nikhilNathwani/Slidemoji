import Toggle from "./Toggle";

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
	const handleShare = () => {
		const shareText = `Slidemoji #001 ${earnedEmoji}

I earned today's emoji! 🎉

Play at slidemoji.com`;

		// Copy to clipboard
		navigator.clipboard
			.writeText(shareText)
			.then(() => {
				alert("Results copied to clipboard!");
			})
			.catch((err) => {
				console.error("Failed to copy:", err);
			});
	};

	return (
		<div className="win-dialog-content">
			<div className="trophy-item win-trophy-display">
				<div className="trophy-number">#001</div>
				<div className="trophy-emoji">{earnedEmoji}</div>
				<div className="trophy-name">Today's Emoji</div>
			</div>
			<h3>You earned today's emoji!</h3>

			<button className="share-button" onClick={handleShare}>
				<i className="fas fa-share-nodes"></i>
				Share
			</button>

			<div className="win-signin-prompt">
				<p className="signin-message">
					Sign in to save your trophy and compete for tomorrow's
					emoji!
				</p>
				<button
					className="google-signin-btn"
					onClick={() => alert("Sign in coming soon!")}
				>
					<img
						src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
						alt="Google"
						className="google-icon"
					/>
					Sign in with Google
				</button>
			</div>
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
