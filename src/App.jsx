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
	const [hasDarkMode, setHasDarkMode] = useState(DEFAULT_DARK_MODE);
	const [hasSoundEnabled, setHasSoundEnabled] = useState(
		DEFAULT_SOUND_ENABLED,
	);

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

	// Use user preferences if available, otherwise use local state
	const effectiveDarkMode =
		user && userDarkMode !== undefined ? userDarkMode : hasDarkMode;
	const effectiveSoundEnabled =
		user && userSoundEnabled !== undefined
			? userSoundEnabled
			: hasSoundEnabled;

	// Handlers that update local state AND Firestore
	const handleDarkModeChange = (newValue) => {
		setHasDarkMode(newValue);
		if (user) {
			updatePreferences({ darkMode: newValue });
		}
	};

	const handleSoundEnabledChange = (newValue) => {
		setHasSoundEnabled(newValue);
		if (user) {
			updatePreferences({ soundEnabled: newValue });
		}
	};

	// Restore gridSize from saved game state when user data loads
	// Use whichever difficulty was played most recently
	useEffect(() => {
		if (!userData?.gameState?.[todaysPuzzleNumber]) return;

		const savedGames = userData.gameState[todaysPuzzleNumber];

		// Get both saved games with their lastPlayed timestamps
		const game3 = savedGames[3];
		const game4 = savedGames[4];

		// If only one difficulty has saved progress, use that
		if (game4 && !game3) {
			setGridSize(4);
		} else if (game3 && !game4) {
			setGridSize(3);
		}
		// If both exist, use the one most recently played
		else if (game3 && game4) {
			// Compare lastPlayed timestamps (Firestore Timestamp objects)
			const lastPlayed3 = game3.lastPlayed?.toDate?.() || new Date(0);
			const lastPlayed4 = game4.lastPlayed?.toDate?.() || new Date(0);

			if (lastPlayed4 > lastPlayed3) {
				setGridSize(4);
			} else {
				setGridSize(3);
			}
		}
		// No saved game - default is already 3
	}, [userData, todaysPuzzleNumber]);

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
