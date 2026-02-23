import { useState, useRef } from "react";
import "./App.css";
import Board from "./components/Board";
import LandingPage from "./components/LandingPage";
import Toggle from "./components/Toggle";
import Trophy from "./components/Trophy";
import Dialog, {
	SettingsContent,
	WinContent,
	ConfirmContent,
	StatsContent,
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
						<img
							src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
							alt="Google"
							className="google-icon"
						/>
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

				<div className="board-container">
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
							<Toggle
								isOn={showNumbers}
								onToggle={() => setShowNumbers(!showNumbers)}
								disabled={isWon}
							/>
						</div>
					</div>
				</div>
			</main>

			<Dialog
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
				title="Settings"
			>
				<SettingsContent
					gridSize={gridSize}
					darkMode={darkMode}
					showNumbers={showNumbers}
					onDarkModeChange={setDarkMode}
					onShowNumbersChange={setShowNumbers}
					onGridSizeChange={handleSizeChange}
					onSolve={handleSolve}
				/>
			</Dialog>

			<Dialog
				isOpen={showStats}
				onClose={() => setShowStats(false)}
				title="Stats"
			>
				<StatsContent
					earnedEmojis={earnedEmojis}
					dailyEmoji={dailyEmoji}
				/>
			</Dialog>

			<Dialog
				isOpen={showWinDialog}
				onClose={handleCloseWinDialog}
				title="🎉 Congratulations!"
			>
				<WinContent
					earnedEmoji={dailyEmoji.emoji}
					earnedEmojiName={dailyEmoji.name}
				/>
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
