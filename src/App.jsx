import { useState, useEffect } from "react";
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
import { useUpdatePreferences } from "./hooks/useUpdatePreferences";
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

	// Settings (local state only - no Firestore sync)
	const [hasNumbersShown, setHasNumbersShown] =
		useState(DEFAULT_SHOW_NUMBERS);

	// Initialize dark mode and sound from localStorage (for signed-out users)
	const [hasDarkMode, setHasDarkMode] = useState(() => {
		const saved = localStorage.getItem("darkMode");
		return saved !== null ? JSON.parse(saved) : DEFAULT_DARK_MODE;
	});
	const [hasSoundEnabled, setHasSoundEnabled] = useState(() => {
		const saved = localStorage.getItem("soundEnabled");
		return saved !== null ? JSON.parse(saved) : DEFAULT_SOUND_ENABLED;
	});

	// Game State
	const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);

	// ===== Fetch User Data with React Query =====
	// Automatically fetches, caches, and refetches user data from Firestore
	// Eliminates manual useEffect boilerplate and provides loading/error states
	const { data: userData } = useUser(user?.uid);

	// Mutation for updating preferences in Firestore
	const { mutate: updatePreferences } = useUpdatePreferences(user?.uid);

	// Derive preferences from userData or use defaults
	// This avoids setState in useEffect and keeps preferences in sync
	const userDarkMode = userData?.preferences?.darkMode;
	const userSoundEnabled = userData?.preferences?.soundEnabled;

	// Use user preferences if available, otherwise use localStorage/local state
	const effectiveDarkMode =
		user && userDarkMode !== undefined ? userDarkMode : hasDarkMode;
	const effectiveSoundEnabled =
		user && userSoundEnabled !== undefined
			? userSoundEnabled
			: hasSoundEnabled;

	// Handlers that update local state, localStorage, AND Firestore
	const handleDarkModeChange = (newValue) => {
		setHasDarkMode(newValue);
		localStorage.setItem("darkMode", JSON.stringify(newValue));
		if (user) {
			updatePreferences({ darkMode: newValue });
		}
	};

	const handleSoundEnabledChange = (newValue) => {
		setHasSoundEnabled(newValue);
		localStorage.setItem("soundEnabled", JSON.stringify(newValue));
		if (user) {
			updatePreferences({ soundEnabled: newValue });
		}
	};

	// Restore gridSize from saved game state when user data loads
	// Use the lastPlayedDifficulty from user document
	useEffect(() => {
		if (!userData?.lastPlayedDifficulty) return;

		// Restore to the difficulty they were last playing
		setGridSize(userData.lastPlayedDifficulty);
	}, [userData]);

	// Reset to default difficulty when signing out
	useEffect(() => {
		if (!user) {
			setGridSize(DEFAULT_GRID_SIZE);
		}
	}, [user]);

	if (showLandingPage) {
		return (
			<div className="app light-theme">
				<LandingPage onPlay={() => setShowLandingPage(false)} />
			</div>
		);
	}

	return (
		<div
			className={`app ${effectiveDarkMode ? "dark-theme" : "light-theme"}`}
		>
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
				hasNumbersShown={hasNumbersShown}
				hasSoundEnabled={effectiveSoundEnabled}
				onOpenStats={() => setShowStatsDialog(true)}
				onGridSizeChange={setGridSize}
			/>

			<SettingsDialog
				isOpen={showSettingsDialog}
				onClose={() => setShowSettingsDialog(false)}
				gridSize={gridSize}
				hasDarkMode={effectiveDarkMode}
				hasNumbersShown={hasNumbersShown}
				hasSoundEnabled={effectiveSoundEnabled}
				onShowNumbersChange={setHasNumbersShown}
				onDarkModeChange={handleDarkModeChange}
				onSoundEnabledChange={handleSoundEnabledChange}
				onGridSizeChange={setGridSize}
			/>

			<StatsDialog
				isOpen={showStatsDialog}
				onClose={() => setShowStatsDialog(false)}
			/>
		</div>
	);
}

export default App;
