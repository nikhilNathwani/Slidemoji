import { useState } from "react";
import "./App.css";
import LandingPage from "./components/landing/LandingPage";
import Header from "./components/Header";
import Game from "./components/game/Game";
import SettingsDialog from "./components/dialogs/SettingsDialog";
import StatsDialog from "./components/dialogs/StatsDialog";
import { getLatestPuzzleId } from "./utils/puzzleUtils";
import { useAuth } from "./hooks/useAuth";
import { useUser } from "./hooks/useUser";
import { usePuzzle } from "./hooks/usePuzzle";
import { usePreference } from "./hooks/usePreference";

// App-level preference defaults
const DEFAULT_DARK_MODE = false;
const DEFAULT_SHOW_NUMBERS = true;
const DEFAULT_SOUND_ENABLED = false;

function App() {
	const { user } = useAuth();

	// Check for demo URL param (e.g., ?demo=134 to view specific puzzle)
	const urlParams = new URLSearchParams(window.location.search);
	const demoParam = urlParams.get("demo");
	const demoPuzzleId = demoParam ? parseInt(demoParam, 10) : null;

	const [selectedPuzzleId, setSelectedPuzzleId] = useState(
		() => demoPuzzleId || getLatestPuzzleId(),
	);
	const puzzleId = selectedPuzzleId;

	// Fetch puzzle data
	const { data: puzzleMetadata, isLoading: isLoadingPuzzle } =
		usePuzzle(puzzleId);

	// Show Page / Dialog
	const [showLandingPage, setShowLandingPage] = useState(true);
	const [showSettingsDialog, setShowSettingsDialog] = useState(false);
	const [showStatsDialog, setShowStatsDialog] = useState(false);

	// Synced preferences (localStorage for signed-out, Firestore for signed-in)
	const [darkMode, setDarkMode] = usePreference(
		"darkMode",
		DEFAULT_DARK_MODE,
	);
	const [soundEnabled, setSoundEnabled] = usePreference(
		"soundEnabled",
		DEFAULT_SOUND_ENABLED,
	);
	const [showNumbers, setShowNumbers] = usePreference(
		"showNumbers",
		DEFAULT_SHOW_NUMBERS,
		{ contextKey: puzzleId },
		// Resets to ON for each new puzzle (new puzzleId), but respects manual changes within the puzzle
	);

	// Fetch user data
	const { data: userData, isLoading: isLoadingUser } = useUser(user?.uid);
	const isLoading = isLoadingPuzzle || (user && isLoadingUser);

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
	if (isLoading || !puzzleMetadata) {
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
			key={`${user?.uid || "anonymous"}-${puzzleId}`}
			className={`app ${darkMode ? "dark-theme" : "light-theme"}`}
		>
			<Header
				onSettingsClick={() => setShowSettingsDialog(true)}
				onStatsClick={() => setShowStatsDialog(true)}
			/>

			<Game
				puzzleMetadata={puzzleMetadata}
				savedGame={userData?.gameState?.[puzzleId]}
				solvedPuzzles={userData?.stats?.solvedPuzzles}
				hasNumbersShown={showNumbers}
				hasSoundEnabled={soundEnabled}
				onOpenStats={() => setShowStatsDialog(true)}
			/>

			<SettingsDialog
				isOpen={showSettingsDialog}
				onClose={() => setShowSettingsDialog(false)}
				hasDarkMode={darkMode}
				hasNumbersShown={showNumbers}
				hasSoundEnabled={soundEnabled}
				onShowNumbersChange={setShowNumbers}
				onDarkModeChange={setDarkMode}
				onSoundEnabledChange={setSoundEnabled}
			/>

			<StatsDialog
				isOpen={showStatsDialog}
				onClose={() => setShowStatsDialog(false)}
				solvedPuzzles={userData?.stats?.solvedPuzzles}
				currentPuzzleId={puzzleId}
				onSelectPuzzle={(id) => {
					setSelectedPuzzleId(id);
					setShowStatsDialog(false);
				}}
			/>
		</div>
	);
}

export default App;
