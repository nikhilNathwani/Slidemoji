import { useState } from "react";
import "./App.css";
import LandingPage from "./components/landing/LandingPage";
import Header from "./components/Header";
import Game from "./components/game/Game";
import SettingsDialog from "./components/dialogs/SettingsDialog";
import StatsDialog from "./components/dialogs/StatsDialog";
import ArchiveDialog from "./components/dialogs/ArchiveDialog";
import PaywallDialog from "./components/dialogs/PaywallDialog";
import { getLatestPuzzleId } from "./utils/puzzleUtils";
import { useAuth } from "./hooks/useAuth";
import { usePuzzle } from "./hooks/usePuzzle";
import { usePreference } from "./hooks/usePreference";
import { useGameState } from "./hooks/useGameState";
import { useSolvedPuzzles } from "./hooks/useSolvedPuzzles";
import { resetPremiumForDev } from "./firebase/firestore/user";

// App-level preference defaults
const DEFAULT_DARK_MODE = false;
const DEFAULT_SHOW_NUMBERS = true;
const DEFAULT_SOUND_ENABLED = false;

function App() {
	const { loading: isAuthLoading, isMerging, user } = useAuth();

	// PUZZLE contains: id, emoji, emoji name, initialGrids (normal and hard)
	const [puzzleId, setPuzzleId] = useState(() => getLatestPuzzleId());
	const { data: puzzleMetadata, isLoading: isLoadingPuzzle } =
		usePuzzle(puzzleId);

	// PREFERENCES include: dark/light mode, sound on/off, show tile numbers on/off
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

	// GAME STATE is {currentDifficulty: normal|hard, normal:[normal_grid], hard:[hard_grid]}
	const [gameState, setGameState, isLoadingGameState] = useGameState({
		puzzleMetadata,
	});

	// SOLVED PUZZLES is a list of puzzles with a normal- and/or hard-solve
	const { solvedPuzzles } = useSolvedPuzzles();

	// Show Page / Dialog
	// Lazy initializer: skip landing page when returning from Stripe checkout.
	const [showLandingPage, setShowLandingPage] = useState(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.get("payment") === "success") {
			window.history.replaceState({}, "", window.location.pathname);
			return false;
		}
		return true;
	});
	const [showSettingsDialog, setShowSettingsDialog] = useState(false);
	const [showStatsDialog, setShowStatsDialog] = useState(false);
	const [showArchiveDialog, setShowArchiveDialog] = useState(false);
	const [showPaywallDialog, setShowPaywallDialog] = useState(false);

	const isLoading =
		isLoadingPuzzle || isLoadingGameState || !gameState || !puzzleMetadata;

	// During auth transitions (notably Google -> anonymous), keep rendering existing
	// game UI if we already have renderable state to avoid a flash to Loading text.
	const shouldShowLoading =
		isLoading &&
		!((isAuthLoading || isMerging) && gameState && puzzleMetadata);

	// Dev helper: Set grid to one move away from solved
	const setAlmostSolved = () => {
		if (!gameState || !puzzleMetadata) {
			console.log("[Dev] Can't set almost solved - missing data");
			return;
		}

		const currentDiff = gameState.currentDifficulty;
		const currentGrid = gameState[currentDiff];
		if (!currentGrid) {
			console.log("[Dev] Can't set almost solved - no current grid");
			return;
		}

		const size = currentGrid.length;

		// Create almost-solved grid: [1, 2, 3, 4, 5, 6, 7, 0, 8]
		// Gap in second-to-last position, one move away from solved
		const almostSolvedGrid = Array.from({ length: size }, (_, i) => {
			if (i === size - 2) return 0; // Gap in second-to-last position
			if (i === size - 1) return size - 1; // Last tile goes in last position
			return i + 1; // Everything else in order: 1, 2, 3, ...
		});

		console.log("[Dev] Setting almost solved grid:", almostSolvedGrid);
		setGameState({ [currentDiff]: almostSolvedGrid });
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
	if (shouldShowLoading) {
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
		<div className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
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
				isAppDialogOpen={
					showSettingsDialog || showStatsDialog || showPaywallDialog
				}
				solvedPuzzles={solvedPuzzles}
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
				isPuzzleSolved={
					!!solvedPuzzles?.[puzzleId]?.[gameState.currentDifficulty]
				}
				onAlmostSolve={setAlmostSolved}
			onTogglePremium={(grant) => resetPremiumForDev(user?.uid, grant)}
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
				onUnlockArchiveClick={() => {
					setShowStatsDialog(false);
					setShowPaywallDialog(true);
				}}
			/>

			<PaywallDialog
				isOpen={showPaywallDialog}
				onClose={() => setShowPaywallDialog(false)}
			/>
		</div>
	);
}

export default App;
