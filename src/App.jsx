import { useState, useMemo } from "react";
import "./App.css";
import LandingPage from "./components/landing/LandingPage";
import Header from "./components/Header";
import Game from "./components/game/Game";
import SettingsDialog from "./components/dialogs/SettingsDialog";
import StatsDialog from "./components/dialogs/StatsDialog";
import { getLatestPuzzleId } from "./utils/dateUtils";
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
import {
	convertPuzzleFromFirestore,
	convertGridFromFirestore,
} from "./utils/puzzleUtils";

function App() {
	const { user } = useAuth();
	const puzzleId = getLatestPuzzleId();

	// Fetch puzzle data with loading state
	const { data: rawPuzzleData, isLoading: isLoadingPuzzle } =
		usePuzzle(puzzleId);
	const puzzleData = useMemo(() => {
		return rawPuzzleData ? convertPuzzleFromFirestore(rawPuzzleData) : null;
	}, [rawPuzzleData]);

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
		{ contextKey: puzzleId },
		// Resets to ON for each new puzzle (new puzzleId), but respects manual changes within the puzzle
	);
	const [gridSize, setGridSize] = useSyncedPreference(
		"gridSize",
		DEFAULT_GRID_SIZE,
		{ persistForSignedOut: false },
		// Signed-out users always get default 3x3 grid size, to
		// reinforce that you should sign in to retain progress
	);

	// Fetch User Data with React Query
	const { data: userData, isLoading: isLoadingUser } = useUser(user?.uid);

	// Convert savedGame grid from Firestore format if it exists
	const savedGame = userData?.gameState?.[puzzleId]?.[gridSize];
	const convertedSavedGame = savedGame
		? { ...savedGame, grid: convertGridFromFirestore(savedGame.grid) }
		: undefined;

	if (showLandingPage) {
		return (
			<div className="app light-theme">
				<LandingPage onPlay={() => setShowLandingPage(false)} />
			</div>
		);
	}

	// Wait for data to load before rendering Game
	// For signed-in users, wait for both puzzle and user data
	// For signed-out users, only wait for puzzle data
	const isLoading = isLoadingPuzzle || (user && isLoadingUser);
	if (isLoading || !puzzleData) {
		return (
			<div className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
				<Header
					onSettingsClick={() => setShowSettingsDialog(true)}
					onStatsClick={() => setShowStatsDialog(true)}
				/>
				<main style={{ padding: "20px", textAlign: "center" }}>
					Loading puzzle...
				</main>
			</div>
		);
	}

	return (
		<div
			key={`${user?.uid || "anonymous"}-${puzzleId}-${gridSize}`}
			className={`app ${darkMode ? "dark-theme" : "light-theme"}`}
		>
			<Header
				onSettingsClick={() => setShowSettingsDialog(true)}
				onStatsClick={() => setShowStatsDialog(true)}
			/>

			<Game
				puzzleId={puzzleId}
				puzzleData={puzzleData}
				gridSize={gridSize}
				savedGame={convertedSavedGame}
				maxGridSizeSolved={getMaxGridSizeSolved(userData, puzzleId)}
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
				onClose={() => setShowStatsDialog(false)}
				userData={userData}
			/>
		</div>
	);
}

export default App;
