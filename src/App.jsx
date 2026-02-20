import { useState, useRef } from "react";
import "./App.css";
import Board from "./components/Board";
import Dialog, {
	SettingsContent,
	WinContent,
	ConfirmContent,
} from "./components/Dialog";

function App() {
	const [gridSize, setGridSize] = useState(3); // Default to 3×3
	const [showSettings, setShowSettings] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);
	const [showStats, setShowStats] = useState(false);
	const [showNumbers, setShowNumbers] = useState(true); // Default to showing numbers
	const [darkMode, setDarkMode] = useState(true); // Default to dark mode
	const [showShuffleConfirm, setShowShuffleConfirm] = useState(false);
	const [showDifficultyConfirm, setShowDifficultyConfirm] = useState(false);
	const [pendingSize, setPendingSize] = useState(null);
	const solveRef = useRef(null);
	const shuffleRef = useRef(null);

	const handleWin = () => {
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
		setShowDifficultyConfirm(false);
	};

	const handleDifficultyCancel = () => {
		setPendingSize(null);
		setShowDifficultyConfirm(false);
	};

	return (
		<div className="app">
			<header className="app-header">
				<h1 className="app-title">Slidemoji</h1>
				<div className="header-actions">
					<button
						className="icon-button"
						onClick={() => setShowSettings(true)}
						aria-label="Settings"
					>
						<i className="fas fa-cog"></i>
					</button>
					<button
						className="icon-button"
						onClick={() => setShowStats(true)}
						aria-label="Stats"
					>
						<i className="fas fa-trophy"></i>
					</button>
				</div>
			</header>

			<main>
				<div className="puzzle-info">
					<div className="puzzle-of-day">
						<div className="puzzle-title">Slidemoji #001</div>
						<div className="puzzle-emoji">🛝</div>
					</div>
				</div>

				<Board
					size={gridSize}
					onWin={handleWin}
					showNumbers={showNumbers}
					onSolveRef={solveRef}
					onShuffleRef={shuffleRef}
				/>
			</main>

			<Dialog
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
				title="Settings"
			>
				<SettingsContent
					selectedSize={gridSize}
					onSizeChange={handleSizeChange}
					showNumbers={showNumbers}
					onShowNumbersChange={setShowNumbers}
					darkMode={darkMode}
					onDarkModeChange={setDarkMode}
					onShuffle={handleShuffleClick}
					onSolve={handleSolve}
				/>
			</Dialog>

			<Dialog
				isOpen={showStats}
				onClose={() => setShowStats(false)}
				title="Stats"
			>
				<div className="stats-content">
					<div className="stats-empty">
						<i className="fas fa-chart-line stats-icon"></i>
						<h3>Track Your Progress</h3>
						<p className="stats-description">
							Sign in to save your stats and compete on the
							leaderboard!
						</p>
						<button className="google-signin-btn">
							<i className="fab fa-google"></i>
							Sign in with Google
						</button>
						<p className="privacy-note">
							<i className="fas fa-shield-alt"></i> We respect
							your privacy. Your data is never sold or shared. We
							only use your email to save your progress.
						</p>
					</div>
				</div>
			</Dialog>

			<Dialog
				isOpen={showWinDialog}
				onClose={handleCloseWinDialog}
				title="🎉 Congratulations!"
			>
				<WinContent />
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
