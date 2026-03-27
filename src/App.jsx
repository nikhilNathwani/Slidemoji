import { useState } from "react";
import "./App.css";
import LandingPage from "./components/landing/LandingPage";
import Header from "./components/Header";
import Game from "./components/game/Game";
import SettingsDialog from "./components/dialogs/SettingsDialog";
import StatsDialog from "./components/dialogs/StatsDialog";
import ArchiveDialog from "./components/dialogs/ArchiveDialog";
import { getLatestPuzzleId } from "./utils/puzzleUtils";
import { useAuth } from "./hooks/useAuth";
import { useUser } from "./hooks/useUser";
import { usePreference } from "./hooks/usePreference";
import { useGameState } from "./hooks/useGameState";

// App-level preference defaults
const DEFAULT_DARK_MODE = false;
const DEFAULT_SHOW_NUMBERS = true;
const DEFAULT_SOUND_ENABLED = false;

function App() {
	const { user } = useAuth();

	const [puzzleId, setPuzzleId] = useState(() => getLatestPuzzleId());

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
	);

	// Fetch user data
	const { data: userData, isLoading: isLoadingUser } = useUser(user?.uid);

	// Load and manage game state (fetches puzzles, handles loading/saving)
	const { gameState, setGameState, puzzleMetadata, isLoading: isLoadingGame } =
		useGameState({
			puzzleId,
			userData,
		});

	// Show Page / Dialog
	const [showLandingPage, setShowLandingPage] = useState(true);
	const [showSettingsDialog, setShowSettingsDialog] = useState(false);
	const [showStatsDialog, setShowStatsDialog] = useState(false);
	const [showArchiveDialog, setShowArchiveDialog] = useState(false);

	const isLoading = isLoadingGame || (user && isLoadingUser);

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
	if (isLoading) {
		return (
			<div className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
				<Header
					onArchiveClick={() => setShowArchiveDialog(true)}
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
				onArchiveClick={() => setShowArchiveDialog(true)}
				onStatsClick={() => setShowStatsDialog(true)}
			/>

			<Game
				key={`${puzzleId}-${gameState.currentDifficulty}`}
				puzzleMetadata={puzzleMetadata}
				grid={gameState[gameState.currentDifficulty]}
				difficulty={gameState.currentDifficulty}
				setGameState={setGameState}
				hasNumbersShown={showNumbers}
				hasSoundEnabled={soundEnabled}
				onOpenStats={() => setShowStatsDialog(true)}
				isAppDialogOpen={showSettingsDialog || showStatsDialog}
			/>

			<SettingsDialog
				isOpen={showSettingsDialog}
				onClose={() => setShowSettingsDialog(false)}
				hasDarkMode={darkMode}
				hasNumbersShown={showNumbers}
				hasSoundEnabled={soundEnabled}
				difficulty={gameState.currentDifficulty}
				onShowNumbersChange={setShowNumbers}
				onDarkModeChange={setDarkMode}
				onSoundEnabledChange={setSoundEnabled}
				onDifficultyChange={(diff) =>
					setGameState({ currentDifficulty: diff })
				}
				isPuzzleSolved={!!userData?.stats?.solvedPuzzles?.[puzzleId]}
			/>

			<ArchiveDialog
				isOpen={showArchiveDialog}
				onClose={() => setShowArchiveDialog(false)}
				solvedPuzzles={userData?.stats?.solvedPuzzles}
				currentPuzzleId={puzzleId}
				onPuzzleSelect={setPuzzleId}
			/>

			<StatsDialog
				isOpen={showStatsDialog}
				onClose={() => setShowStatsDialog(false)}
				solvedPuzzles={userData?.stats?.solvedPuzzles}
				currentPuzzleId={puzzleId}
			/>
		</div>
	);
}

export default App;
