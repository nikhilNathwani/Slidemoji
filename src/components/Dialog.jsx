import Toggle from "./Toggle";
import Trophy from "./Trophy";

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
	gridSize,
	onGridSizeChange,
	darkMode,
	onDarkModeChange,
	showNumbers,
	onShowNumbersChange,
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

export function StatsContent({ earnedEmojis, dailyEmoji }) {
	return (
		<div className="stats-content">
			<div className="trophy-case">
				<h3 className="trophy-case-title">
					<i className="fas fa-trophy"></i> Trophy Case
				</h3>
				<div className="emoji-grid">
					{earnedEmojis.map((emoji, index) => (
						<Trophy
							key={index}
							trophyNum={1}
							trophyEmoji={emoji}
							trophyName={dailyEmoji.name}
							isMini={true}
						/>
					))}
				</div>
			</div>
			<div className="stats-divider"></div>
			<div className="stats-signin">
				<h3 className="stats-signin-title">Sync Your Progress</h3>
				<p className="stats-description">
					Sign in to save your trophies and compete on the
					leaderboard!
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
				<p className="privacy-note">
					<i className="fas fa-shield-alt"></i>
					<span>
						We respect your privacy. Your data is never sold or
						shared. We only use your email to save your progress.
					</span>
				</p>
			</div>
		</div>
	);
}

export function WinContent({ earnedEmoji, earnedEmojiName }) {
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
			<Trophy
				key={1} //is key necessary here? since its just one trophy, not a list?
				trophyNum={1}
				trophyEmoji={earnedEmoji}
				trophyName={earnedEmojiName}
			/>
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
