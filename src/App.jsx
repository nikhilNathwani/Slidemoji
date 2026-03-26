import { useState } from "react";
import "./App.css";
import LandingPage from "./components/landing/LandingPage";
import Header from "./components/Header";
import Game from "./components/game/Game";
import SettingsDialog from "./components/dialogs/SettingsDialog";
import StatsDialog from "./components/dialogs/StatsDialog";
import ArchiveDialog from "./components/dialogs/ArchiveDialog";
import { getLatestPuzzleId } from "./utils/puzzleUtils";
import { DEFAULT_DIFFICULTY, DIFFICULTY, getDifficultySize } from "./constants";
import { useAuth } from "./hooks/useAuth";
import { useUser } from "./hooks/useUser";
import { usePuzzle } from "./hooks/usePuzzle";
import { usePreference } from "./hooks/usePreference";
import { useGameState } from "./hooks/useGameState";

// App-level preference defaults
const DEFAULT_DARK_MODE = false;
const DEFAULT_SHOW_NUMBERS = true;
const DEFAULT_SOUND_ENABLED = false;

function App() {
	const { user } = useAuth();

	const [selectedPuzzleId, setSelectedPuzzleId] = useState(() =>
		getLatestPuzzleId(),
	);
	const puzzleId = selectedPuzzleId;

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

	// Difficulty preference: per-puzzle (checks lastPlayedDifficulty, falls back to NORMAL)
	const [difficulty, setDifficulty] = usePreference(
		"difficulty",
		DEFAULT_DIFFICULTY,
		{ puzzleId },
	);

	// Fetch both puzzle difficulties (normal and hard)
	const { data: normalPuzzle, isLoading: isLoadingNormal } = usePuzzle(
		puzzleId,
		getDifficultySize(DIFFICULTY.NORMAL),
	);
	const { data: hardPuzzle, isLoading: isLoadingHard } = usePuzzle(
		puzzleId,
		getDifficultySize(DIFFICULTY.HARD),
	);

	// Load and manage game state (unified hook for loading + saving)
	const [gameState, setGameState] = useGameState({
		puzzleId,
		normalPuzzle,
		hardPuzzle,
		userData,
		currentDifficulty: difficulty,
	});

	// Separate puzzle metadata (not part of gameState)
	const puzzleMetadata = normalPuzzle
		? {
				id: puzzleId,
				emoji: normalPuzzle.emoji,
				emojiName: normalPuzzle.emojiName,
				initialGrids: {
					normal: normalPuzzle.initialGrid,
					hard: hardPuzzle?.initialGrid,
				},
			}
		: null;

	// Show Page / Dialog
	const [showLandingPage, setShowLandingPage] = useState(true);
	const [showSettingsDialog, setShowSettingsDialog] = useState(false);
	const [showStatsDialog, setShowStatsDialog] = useState(false);
	const [showArchiveDialog, setShowArchiveDialog] = useState(false);

	const isLoading =
		isLoadingNormal ||
		isLoadingHard ||
		(user && isLoadingUser) ||
		!gameState ||
		!puzzleMetadata;

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
				key={`${puzzleId}-${difficulty}`}
				puzzleMetadata={puzzleMetadata}
				gameState={gameState}
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
				difficulty={difficulty}
				onShowNumbersChange={setShowNumbers}
				onDarkModeChange={setDarkMode}
				onSoundEnabledChange={setSoundEnabled}
				onDifficultyChange={setDifficulty}
				isPuzzleSolved={!!userData?.stats?.solvedPuzzles?.[puzzleId]}
			/>

			<ArchiveDialog
				isOpen={showArchiveDialog}
				onClose={() => setShowArchiveDialog(false)}
				solvedPuzzles={userData?.stats?.solvedPuzzles}
				currentPuzzleId={puzzleId}
				onPuzzleSelect={setSelectedPuzzleId}
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
