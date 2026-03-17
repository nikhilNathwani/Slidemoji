import { useState } from "react";
import "./App.css";
import LandingPage from "./components/landing/LandingPage";
import Header from "./components/Header";
import Game from "./components/game/Game";
import SettingsDialog from "./components/dialogs/SettingsDialog";
import StatsDialog from "./components/dialogs/StatsDialog";
import { getTodaysPuzzleNumber } from "./utils/dateUtils";
import { useAuth } from "./hooks/useAuth";
import { useUser } from "./hooks/useUser";
import { usePuzzle } from "./hooks/usePuzzle";
import { useSyncedPreference } from "./hooks/useSyncedPreference";
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

	// Preload today's puzzle while landing page is showing
	// This ensures puzzle data is cached before user clicks "Play"
	usePuzzle(todaysPuzzleNumber);

	// Show Page / Dialog
	const [showLandingPage, setShowLandingPage] = useState(true);
	const [showSettingsDialog, setShowSettingsDialog] = useState(false);
	const [showStatsDialog, setShowStatsDialog] = useState(false);

	// Synced preferences (localStorage for signed-out, Firestore for signed-in)
	const [darkMode, setDarkMode] = useSyncedPreference(
		"darkMode",
		DEFAULT_DARK_MODE,
	);
	const [soundEnabled, setSoundEnabled] = useSyncedPreference(
		"soundEnabled",
		DEFAULT_SOUND_ENABLED,
	);
	const [showNumbers, setShowNumbers] = useSyncedPreference(
		"showNumbers",
		DEFAULT_SHOW_NUMBERS,
	);
	// Grid size: Persists to localStorage (for Firestore fallback) but signed-out users always see default
	const [gridSize, setGridSize] = useSyncedPreference(
		"gridSize",
		DEFAULT_GRID_SIZE,
		{ persistForSignedOut: false },
	);

	// ===== Fetch User Data with React Query =====
	// Automatically fetches, caches, and refetches user data from Firestore
	// Eliminates manual useEffect boilerplate and provides loading/error states
	const { data: userData } = useUser(user?.uid);

	if (showLandingPage) {
		return (
			<div className="app light-theme">
				<LandingPage onPlay={() => setShowLandingPage(false)} />
			</div>
		);
	}

	return (
		<div className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
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
				maxGridSizeSolved={getMaxGridSizeSolved(
					userData,
					todaysPuzzleNumber,
				)}
				hasNumbersShown={showNumbers}
				hasSoundEnabled={soundEnabled}
				onOpenStats={() => setShowStatsDialog(true)}
				onGridSizeChange={setGridSize}
			/>

			<SettingsDialog
				isOpen={showSettingsDialog}
				onClose={() => setShowSettingsDialog(false)}
				gridSize={gridSize}
				hasDarkMode={darkMode}
				hasNumbersShown={showNumbers}
				hasSoundEnabled={soundEnabled}
				onShowNumbersChange={setShowNumbers}
				onDarkModeChange={setDarkMode}
				onSoundEnabledChange={setSoundEnabled}
				onGridSizeChange={setGridSize}
			/>

			<StatsDialog
				isOpen={showStatsDialog}
				OnClose={() => setShowStatsDialog(false)}
			/>
		</div>
	);
}

export default App;
