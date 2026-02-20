import { useState, useRef, useEffect } from "react";
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
	// Initialize dark mode based on system preference
	const [darkMode, setDarkMode] = useState(() => {
		if (typeof window !== 'undefined' && window.matchMedia) {
			return window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		return true; // Fallback to dark mode
	});
	const [showShuffleConfirm, setShowShuffleConfirm] = useState(false);
	const [showDifficultyConfirm, setShowDifficultyConfirm] = useState(false);
	const [pendingSize, setPendingSize] = useState(null);
	const [earnedEmojis, _setEarnedEmojis] = useState(["🛝"]); // Mock data - will be from backend
	const solveRef = useRef(null);
	const shuffleRef = useRef(null);

	// Listen for system theme changes
	useEffect(() => {
		if (typeof window !== 'undefined' && window.matchMedia) {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handler = (e) => setDarkMode(e.matches);
			
			// Modern browsers
			if (mediaQuery.addEventListener) {
				mediaQuery.addEventListener('change', handler);
				return () => mediaQuery.removeEventListener('change', handler);
			}
			// Legacy browsers
			else if (mediaQuery.addListener) {
				mediaQuery.addListener(handler);
				return () => mediaQuery.removeListener(handler);
			}
		}
	}, []);

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
				</div>
			</header>

			<main>
				<div className="puzzle-info">
					<div className="puzzle-of-day">
						<div className="puzzle-title">Slidemoji #001</div>
						<div className="puzzle-emoji">🛝</div>
						<div className="puzzle-emoji-name">Playground Slide</div>
					</div>
				</div>

				<Board
					size={gridSize}
					onWin={handleWin}
					showNumbers={showNumbers}
					onSolveRef={solveRef}
					onShuffleRef={shuffleRef}
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
					<button
						className={`control-button ${showNumbers ? "active" : ""}`}
						onClick={() => setShowNumbers(!showNumbers)}
						title="Toggle Numbers"
					>
						<i className="fas fa-hashtag"></i>
						Numbers
					</button>
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
							<i className="fas fa-award"></i> Trophy Case
						</h3>
						<div className="emoji-grid">
							{earnedEmojis.map((emoji, index) => (
								<div key={index} className="trophy-emoji">
									{emoji}
								</div>
							))}
						</div>
					</div>
					<div className="stats-divider"></div>
					<div className="stats-signin">
						<h3>Sync Your Progress</h3>
						<p className="stats-description">
							Sign in to save your trophies and compete on the
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
				<WinContent earnedEmoji="🛝" />
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
