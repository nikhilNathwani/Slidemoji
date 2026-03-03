import { useState, useRef, useEffect } from "react";
import "./App.css";
import Game from "./components/Game";
import LandingPage from "./components/landing/LandingPage";
import Header from "./components/Header";
import Dialog from "./components/dialogs/Dialog";
import SettingsContent from "./components/dialogs/SettingsContent";
import WinContent from "./components/dialogs/WinContent";
import ConfirmContent from "./components/dialogs/ConfirmContent";
import StatsContent from "./components/dialogs/StatsContent";
import { getDailyEmoji } from "./utils/emoji";
import {
	DEFAULT_GRID_SIZE,
	DEFAULT_DARK_MODE,
	DEFAULT_SHOW_NUMBERS,
} from "./constants";

function App() {
	const dailyEmoji = getDailyEmoji();

	const [showLanding, setShowLanding] = useState(true);
	const [playingEntranceAnimation, setPlayingEntranceAnimation] =
		useState(false);
	const [showControls, setShowControls] = useState(false);
	const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
	const [showSettings, setShowSettings] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);
	const [showStats, setShowStats] = useState(false);
	const [showNumbers, setShowNumbers] = useState(DEFAULT_SHOW_NUMBERS);
	const [isWon, setIsWon] = useState(false);
	const [darkMode, setDarkMode] = useState(DEFAULT_DARK_MODE);
	const [showDifficultyConfirm, setShowDifficultyConfirm] = useState(false);
	const [pendingSize, setPendingSize] = useState(null);
	const [_earnedEmojis, _setEarnedEmojis] = useState([dailyEmoji.emoji]); // Mock data - will be from backend
	const [highestEarnedDifficulty, setHighestEarnedDifficulty] = useState(0); // 0 = not earned, 3 = 3x3 earned, 4 = 4x4 earned
	const solveRef = useRef(null);

	const handleWin = () => {
		// Update highest earned difficulty immediately (before dialog)
		if (gridSize > highestEarnedDifficulty) {
			setHighestEarnedDifficulty(gridSize);
		}
		// setIsWon and dialog opening happens in Board after delay
	};

	const handleShowWinDialog = () => {
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
		setShowSettings(false);
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
		setShowWinDialog(false); // Close win dialog if open
		setShowDifficultyConfirm(false);
	};

	const handleDifficultyCancel = () => {
		setPendingSize(null);
		setShowDifficultyConfirm(false);
	};

	// Handle entrance animation timing
	useEffect(() => {
		if (playingEntranceAnimation) {
			// Tiles animate in over ~800ms (staggered)
			// Wait for tiles to finish, then show controls
			const timer = setTimeout(() => {
				setShowControls(true);
				setPlayingEntranceAnimation(false);
			}, 1000); // Adjust timing as needed
			return () => clearTimeout(timer);
		}
	}, [playingEntranceAnimation]);

	const handlePlay = () => {
		setShowLanding(false);
		setPlayingEntranceAnimation(true);
		setShowControls(false);
	};

	if (showLanding) {
		return (
			<div className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
				<LandingPage onPlay={handlePlay} />
			</div>
		);
	}

	return (
		<div className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
			<Header
				onSettingsClick={() => setShowSettings(true)}
				onStatsClick={() => setShowStats(true)}
			/>
			<Game
				dailyEmoji={dailyEmoji}
				gridSize={gridSize}
				onWin={handleWin}
				onShowWinDialog={handleShowWinDialog}
				showNumbers={showNumbers}
				isWon={isWon}
				onSolveRef={solveRef}
				playingEntranceAnimation={playingEntranceAnimation}
				showControls={showControls}
				onShuffle={() => setIsWon(false)}
				highestEarnedDifficulty={highestEarnedDifficulty}
			/>

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
				<StatsContent dailyEmoji={dailyEmoji} />
			</Dialog>

			<Dialog
				isOpen={showWinDialog}
				onClose={handleCloseWinDialog}
				title="🎉 Congratulations!"
			>
				<WinContent
					earnedEmoji={dailyEmoji.emoji}
					earnedEmojiName={dailyEmoji.name}
					gridSize={gridSize}
					dailyEmoji={dailyEmoji}
					earnedPuzzleIds={new Set([1])}
					totalPuzzles={12}
				/>
			</Dialog>

			<Dialog
				isOpen={showDifficultyConfirm}
				onClose={handleDifficultyCancel}
				title="Change Difficulty?"
			>
				<ConfirmContent
					message="Changing difficulty will restart the puzzle. Continue?"
					onConfirm={handleDifficultyConfirm}
					onCancel={handleDifficultyCancel}
				/>
			</Dialog>
		</div>
	);
}

export default App;
