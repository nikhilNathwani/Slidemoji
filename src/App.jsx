import { useState, useRef } from "react";
import "./App.css";
import Board from "./components/Board";
import LandingPage from "./components/LandingPage";
import Dialog, {
	SettingsContent,
	WinContent,
	ConfirmContent,
} from "./components/Dialog";
import { getDailyEmoji } from "./utils/emoji";

function App() {
	const dailyEmoji = getDailyEmoji();
	const [showLanding, setShowLanding] = useState(true);
	const [gridSize, setGridSize] = useState(3); // Default to 3×3
	const [showSettings, setShowSettings] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);
	const [showStats, setShowStats] = useState(false);
	const [showNumbers, setShowNumbers] = useState(true); // Default to showing numbers
	const [isWon, setIsWon] = useState(false);
	const [darkMode, setDarkMode] = useState(true); // Default to dark mode
	const [showShuffleConfirm, setShowShuffleConfirm] = useState(false);
	const [showDifficultyConfirm, setShowDifficultyConfirm] = useState(false);
	const [pendingSize, setPendingSize] = useState(null);
	const [earnedEmojis, _setEarnedEmojis] = useState([dailyEmoji.emoji]); // Mock data - will be from backend
	const solveRef = useRef(null);
	const shuffleRef = useRef(null);

	const handleWin = () => {
		setIsWon(true);
		setShowWinDialog(true);
	};

	const handleCloseWinDialog = () => {
		setShowWinDialog(false);
		// Keep puzzle in solved state, don't reset
	};

	const handleSolve = () => {
		if (solveRef.current) {
			solveRef.current();
		}
	};

	const handleShuffleClick = () => {
		setShowShuffleConfirm(true);
	};

	const handleShuffleConfirm = () => {
		setShowShuffleConfirm(false);
		setIsWon(false);
		if (shuffleRef.current) {
			shuffleRef.current();
		}
	};

	const handleSizeChange = (newSize) => {
		if (newSize !== gridSize) {
			setPendingSize(newSize);
			setShowDifficultyConfirm(true);
		}
	};

	const handleDifficultyConfirm = () => {
		if (pendingSize !== null) {
			setGridSize(pendingSize);
			setPendingSize(null);
		}
		setIsWon(false);
		setShowDifficultyConfirm(false);
	};

	const handleDifficultyCancel = () => {
		setPendingSize(null);
		setShowDifficultyConfirm(false);
	};

	if (showLanding) {
		return (
			<div className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
				<LandingPage onPlay={() => setShowLanding(false)} />
			</div>
		);
	}

	return (
		<div className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
			<header className="app-header">
				<h1 className="app-title">Slidemoji</h1>
				<div className="header-actions">
					<button
						className="icon-button"
						onClick={() => setShowSettings(true)}
						aria-label="Settings"
						title="Settings"
					>
						<i className="fas fa-cog"></i>
					</button>
					<button
						className="icon-button"
						onClick={() => setShowStats(true)}
						aria-label="Stats"
						title="Stats"
					>
						<i className="fas fa-trophy"></i>
					</button>
					<button
						className="google-signin-btn"
						onClick={() => alert("Sign in coming soon!")}
						aria-label="Sign In"
						title="Sign In with Google"
					>
						<svg className="google-icon" viewBox="0 0 24 24">
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="#FBBC05"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Sign in
					</button>
				</div>
			</header>

			<main>
				<div className="puzzle-info">
					<div className="puzzle-of-day">
						<div className="puzzle-title">Slidemoji #001</div>
						<div className="puzzle-emoji">{dailyEmoji.emoji}</div>
						<div className="puzzle-emoji-name">
							"{dailyEmoji.name}"
						</div>
					</div>
				</div>

				<Board
					size={gridSize}
					onWin={handleWin}
					showNumbers={showNumbers && !isWon}
					onSolveRef={solveRef}
					onShuffleRef={shuffleRef}
					dailyEmoji={dailyEmoji.emoji}
				/>

				<div className="game-controls">
					<button
						className="control-button"
						onClick={handleShuffleClick}
						title="Shuffle Board"
					>
						<i className="fas fa-random"></i>
						Shuffle
					</button>
					<div className="control-toggle">
						<span className="control-label">Show Numbers</span>
						<button
							className={`toggle-switch compact ${showNumbers ? "on" : "off"}`}
							onClick={() => setShowNumbers(!showNumbers)}
							aria-label={
								showNumbers ? "Hide Numbers" : "Show Numbers"
							}
							disabled={isWon}
						>
							<span className="toggle-slider"></span>
							<span className="toggle-label">
								{showNumbers ? "ON" : "OFF"}
							</span>
						</button>
					</div>
				</div>
			</main>

			<Dialog
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
				title="Settings"
			>
				<SettingsContent
					selectedSize={gridSize}
					onSizeChange={handleSizeChange}
					darkMode={darkMode}
					onDarkModeChange={setDarkMode}
					onSolve={handleSolve}
				/>
			</Dialog>

			<Dialog
				isOpen={showStats}
				onClose={() => setShowStats(false)}
				title="Stats"
			>
				<div className="stats-content">
					<div className="trophy-case">
						<h3 className="trophy-case-title">
							<i className="fas fa-trophy"></i> Trophy Case
						</h3>
						<div className="emoji-grid">
							{earnedEmojis.map((emoji, index) => (
								<div key={index} className="trophy-item">
									<div className="trophy-number">#001</div>
									<div className="trophy-emoji">{emoji}</div>
									<div className="trophy-name">
										"{dailyEmoji.name}"
									</div>
								</div>
							))}
						</div>
					</div>
					<div className="stats-divider"></div>
					<div className="stats-signin">
						<h3 className="stats-signin-title">
							Sync Your Progress
						</h3>
						<p className="stats-description">
							Sign in to save your trophies and compete on the
							leaderboard!
						</p>
						<button
							className="google-signin-btn"
							onClick={() => alert("Sign in coming soon!")}
						>
							<i className="fab fa-google"></i>
							Sign in with Google
						</button>
						<p className="privacy-note">
							<i className="fas fa-shield-alt"></i>
							<span>
								We respect your privacy. Your data is never sold
								or shared. We only use your email to save your
								progress.
							</span>
						</p>
					</div>
				</div>
			</Dialog>

			<Dialog
				isOpen={showWinDialog}
				onClose={handleCloseWinDialog}
				title="🎉 Congratulations!"
			>
				<WinContent earnedEmoji={dailyEmoji.emoji} />
			</Dialog>

			<Dialog
				isOpen={showShuffleConfirm}
				onClose={() => setShowShuffleConfirm(false)}
				title="Shuffle Board?"
			>
				<ConfirmContent
					message="This will shuffle the board and reset your current progress. Are you sure?"
					onConfirm={handleShuffleConfirm}
					onCancel={() => setShowShuffleConfirm(false)}
				/>
			</Dialog>

			<Dialog
				isOpen={showDifficultyConfirm}
				onClose={handleDifficultyCancel}
				title="Change Difficulty?"
			>
				<ConfirmContent
					message="Changing difficulty will reset the board and you will lose your current progress. Continue?"
					onConfirm={handleDifficultyConfirm}
					onCancel={handleDifficultyCancel}
				/>
			</Dialog>
		</div>
	);
}

export default App;
