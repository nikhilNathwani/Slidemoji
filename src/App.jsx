import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import "./App.css";
import LandingPage from "./components/landing/LandingPage";
import Header from "./components/Header";
import Game from "./components/game/Game";
import SettingsDialog from "./components/dialogs/SettingsDialog";
import StatsDialog from "./components/dialogs/StatsDialog";
import WinDialog from "./components/dialogs/WinDialog";
import { getTodaysPuzzleNumber } from "./utils/dateUtils";
import { useAuth } from "./hooks/useAuth";
import { useUser } from "./hooks/useUser";
import { usePuzzle } from "./hooks/usePuzzle";
import {
	DEFAULT_GRID_SIZE,
	DEFAULT_DARK_MODE,
	DEFAULT_SHOW_NUMBERS,
	DEFAULT_SOUND_ENABLED,
} from "./constants";
import { getDevConfig } from "./dev/mockData";
import { addPuzzleSolution, getMaxGridSizeSolved } from "./utils/statsHelpers";

function App() {
	const { user } = useAuth();
	const todaysPuzzleNumber = getTodaysPuzzleNumber();

	// Show Page / Dialog
	const [showLandingPage, setShowLandingPage] = useState(true);
	const [showSettingsDialog, setShowSettingsDialog] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);
	const [showStatsDialog, setShowStatsDialog] = useState(false);

	// Settings (local state only - no Firestore sync)
	const [hasNumbersShown, setHasNumbersShown] =
		useState(DEFAULT_SHOW_NUMBERS);
	const [hasDarkMode, setHasDarkMode] = useState(DEFAULT_DARK_MODE);
	const [hasSoundEnabled, setHasSoundEnabled] = useState(
		DEFAULT_SOUND_ENABLED,
	);

	// Game State
	const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
	const [isGameWon, setIsGameWon] = useState(false);

	// Dev mode configuration
	const devConfig = getDevConfig();

	// Query client for manual cache updates
	const queryClient = useQueryClient();

	// ===== Fetch User Data with React Query =====
	// Automatically fetches, caches, and refetches user data from Firestore
	// Eliminates manual useEffect boilerplate and provides loading/error states
	const { data: userData } = useUser(user?.uid, devConfig);

	// ===== Fetch Puzzle Data with React Query =====
	// Automatically fetches and caches puzzle data
	// Puzzles are cached for 24 hours (they never change once published)
	const { data: puzzle } = usePuzzle(todaysPuzzleNumber, devConfig);

	// Derive maxGridSizeSolved from userData (no separate state needed)
	const maxGridSizeSolved = useMemo(
		() => getMaxGridSizeSolved(userData, todaysPuzzleNumber),
		[userData, todaysPuzzleNumber],
	);

	const handleWin = () => {
		// Update React Query cache to add this solution immediately (for trophy case)
		// This ensures the trophy shows up right away in the win dialog
		// maxGridSizeSolved will auto-update via useMemo when userData changes
		queryClient.setQueryData(
			["user", user?.uid, devConfig.userScenario],
			(prevData) =>
				addPuzzleSolution(prevData, todaysPuzzleNumber, gridSize, {
					completedAt: new Date(),
					emoji: puzzle?.emoji,
					emojiName: puzzle?.emojiName,
				}),
		);

		// Block all input during win celebration period
		setShowSettingsDialog(false);
		setShowStatsDialog(false);

		// Note: setIsWon and dialog opening happens in Board after celebration delay
	};

	if (showLandingPage) {
		return (
			<div
				className={`app ${hasDarkMode ? "dark-theme" : "light-theme"}`}
			>
				<LandingPage onPlay={() => setShowLandingPage(false)} />
			</div>
		);
	}

	return (
		<div className={`app ${hasDarkMode ? "dark-theme" : "light-theme"}`}>
			<Header
				onSettingsClick={() => setShowSettingsDialog(true)}
				onStatsClick={() => setShowStatsDialog(true)}
				isWinCelebrating={false}
			/>

			<Game
				puzzle={puzzle}
				gridSize={gridSize}
				savedGame={
					userData?.gameState?.[todaysPuzzleNumber]?.[gridSize]
				}
				maxGridSizeSolved={maxGridSizeSolved}
				hasNumbersShown={hasNumbersShown}
				isGameWon={isGameWon}
				hasSoundEnabled={hasSoundEnabled}
				onWin={handleWin}
				onShowWinDialog={() => {
					setIsGameWon(true);
					setShowWinDialog(true);
				}}
				onShuffle={() => setIsGameWon(false)}
			/>

			<SettingsDialog
				isOpen={showSettingsDialog}
				onClose={() => setShowSettingsDialog(false)}
				gridSize={gridSize}
				hasDarkMode={hasDarkMode}
				hasNumbersShown={hasNumbersShown}
				hasSoundEnabled={hasSoundEnabled}
				onShowNumbersChange={setHasNumbersShown}
				onDarkModeChange={setHasDarkMode}
				onSoundEnabledChange={setHasSoundEnabled}
				onGridSizeChange={(newSize) => {
					setGridSize(newSize);
					setIsGameWon(false);
				}}
			/>

			<StatsDialog
				isOpen={showStatsDialog}
				onClose={() => setShowStatsDialog(false)}
				solvedPuzzles={userData?.stats?.solvedPuzzles}
				numTotalPuzzles={todaysPuzzleNumber}
			/>

			<WinDialog
				isOpen={showWinDialog}
				onClose={() => setShowWinDialog(false)}
				puzzle={puzzle}
				gridSize={gridSize}
				solvedPuzzles={userData?.stats?.solvedPuzzles}
			/>
		</div>
	);
}

export default App;
