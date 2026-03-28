import { useState, useEffect } from "react";
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
import { usePuzzle } from "./hooks/usePuzzle";
import { usePreference } from "./hooks/usePreference";
import { useGameState } from "./hooks/useGameState";
import { cleanupOldPuzzleData } from "./storage";
import { useMemo } from "react";

// App-level preference defaults
const DEFAULT_DARK_MODE = false;
const DEFAULT_SHOW_NUMBERS = true;
const DEFAULT_SOUND_ENABLED = false;

function App() {
	const { user } = useAuth();

	const [puzzleId, setPuzzleId] = useState(() => getLatestPuzzleId());

	// Clean up old puzzle data from localStorage on mount
	useEffect(() => {
		cleanupOldPuzzleData(puzzleId);
	}, [puzzleId]);

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

	// Compute solvedPuzzles from gameState for backward compatibility with components
	const solvedPuzzles = useMemo(() => {
		if (!userData?.gameState) return {};
		return Object.entries(userData.gameState).reduce(
			(acc, [puzzleId, state]) => {
				if (state?.solved) {
					acc[puzzleId] = state.solved;
				}
				return acc;
			},
			{},
		);
	}, [userData]);

	// Fetch puzzle (returns both difficulty grids in one call)
	const { data: puzzleMetadata, isLoading: isLoadingPuzzle } =
		usePuzzle(puzzleId);

	// Manage game state (loading/saving)
	const [gameState, setGameState] = useGameState({
		puzzleMetadata,
		userData,
	});

	// Show Page / Dialog
	const [showLandingPage, setShowLandingPage] = useState(true);
	const [showSettingsDialog, setShowSettingsDialog] = useState(false);
	const [showStatsDialog, setShowStatsDialog] = useState(false);
	const [showArchiveDialog, setShowArchiveDialog] = useState(false);

	const isLoading =
		isLoadingPuzzle ||
		(user && isLoadingUser) ||
		!gameState ||
		!puzzleMetadata;

	// Dev helper: Set grid to one move away from solved
	const setAlmostSolved = () => {
		if (!gameState || !puzzleMetadata) return;

		const currentDiff = gameState.currentDifficulty;
		const size = puzzleMetadata.initialGrids[currentDiff].length;

		// Create solved grid: [1, 2, 3, ..., n-1, null]
		const almostSolvedGrid = Array.from(
			{ length: size },
			(_, i) => (i === size - 1 ? null : i + 1),
		);

		// Swap last two tiles before gap to make it one move away
		// From [1, 2, 3, 4, 5, 6, 7, 8, null] to [1, 2, 3, 4, 5, 6, 8, 7, null]
		if (size > 2) {
			[almostSolvedGrid[size - 2], almostSolvedGrid[size - 3]] = [
				almostSolvedGrid[size - 3],
				almostSolvedGrid[size - 2],
			];
		}

		setGameState({ grid: almostSolvedGrid });
	};

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
				puzzleId={puzzleId}
				emoji={puzzleMetadata.emoji}
				emojiName={puzzleMetadata.emojiName}
				initialGrid={
					puzzleMetadata.initialGrids[gameState.currentDifficulty]
				}
				currentGrid={gameState[gameState.currentDifficulty]}
				currentDifficulty={gameState.currentDifficulty}
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
				isPuzzleSolved={!!solvedPuzzles?.[puzzleId]}
				onAlmostSolve={setAlmostSolved}
			/>

			<ArchiveDialog
				isOpen={showArchiveDialog}
				onClose={() => setShowArchiveDialog(false)}
				solvedPuzzles={solvedPuzzles}
				currentPuzzleId={puzzleId}
				onPuzzleSelect={setPuzzleId}
			/>

			<StatsDialog
				isOpen={showStatsDialog}
				onClose={() => setShowStatsDialog(false)}
				solvedPuzzles={solvedPuzzles}
				currentPuzzleId={puzzleId}
			/>
		</div>
	);
}

export default App;
