import { useState, useMemo } from "react";
import "./App.css";
import LandingPage from "./components/landing/LandingPage";
import Header from "./components/Header";
import Game from "./components/game/Game";
import SettingsDialog from "./components/dialogs/SettingsDialog";
import StatsDialog from "./components/dialogs/StatsDialog";
import { getTodaysPuzzleNumber } from "./utils/dateUtils";
import { useAuth } from "./hooks/useAuth";
import { useUser } from "./hooks/useUser";
import {
	DEFAULT_GRID_SIZE,
	DEFAULT_DARK_MODE,
	DEFAULT_SHOW_NUMBERS,
	DEFAULT_SOUND_ENABLED,
} from "./constants";
import { getMaxGridSizeSolved } from "./utils/statsHelpers";

function App() {
	const { user } = useAuth();
	const todaysPuzzleNumber = getTodaysPuzzleNumber();

	// Show Page / Dialog
	const [showLandingPage, setShowLandingPage] = useState(true);
	const [showSettingsDialog, setShowSettingsDialog] = useState(false);
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

	// ===== Fetch User Data with React Query =====
	// Automatically fetches, caches, and refetches user data from Firestore
	// Eliminates manual useEffect boilerplate and provides loading/error states
	const { data: userData } = useUser(user?.uid);

	// Derive maxGridSizeSolved from userData (no separate state needed)
	// Using useMemo to automatically recompute when dependencies change
	const maxGridSizeSolved = useMemo(
		() => getMaxGridSizeSolved(userData, todaysPuzzleNumber),
		[userData, todaysPuzzleNumber],
	);

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
				puzzleId={todaysPuzzleNumber}
				gridSize={gridSize}
				savedGame={
					userData?.gameState?.[todaysPuzzleNumber]?.[gridSize]
				}
				maxGridSizeSolved={maxGridSizeSolved}
				solvedPuzzles={userData?.stats?.solvedPuzzles}
				hasNumbersShown={hasNumbersShown}
				isGameWon={isGameWon}
				hasSoundEnabled={hasSoundEnabled}
				onWinStateChange={setIsGameWon}
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
		</div>
	);
}

export default App;
