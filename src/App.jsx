import { useState } from "react";
import "./App.css";
import LandingPage from "./components/landing/LandingPage";
import Header from "./components/Header";
import Game from "./components/game/Game";
import SettingsDialog from "./components/dialogs/SettingsDialog";
import StatsDialog from "./components/dialogs/StatsDialog";
import ArchiveDialog from "./components/dialogs/ArchiveDialog";
import { getLatestPuzzleId } from "./utils/puzzleUtils";
import { checkWin } from "./utils/gridHelpers";
import { useAuth } from "./hooks/useAuth";
import { usePuzzle } from "./hooks/usePuzzle";
import { useGameState } from "./hooks/useGameState";

function App() {
	const { isLoading: isAuthLoading, isMerging } = useAuth();

	// PUZZLE contains: id, emoji, emoji name, initialGrids (normal and hard)
	const [puzzleId, setPuzzleId] = useState(() => getLatestPuzzleId());
	const { data: puzzleMetadata, isLoading: isLoadingPuzzle } =
		usePuzzle(puzzleId);

	// GAME STATE is {currentDifficulty: normal|hard, normal:[normal_grid], hard:[hard_grid]}
	const [gameState, setGameState, isLoadingGameState] = useGameState({
		puzzleId,
		initialGrids: puzzleMetadata?.initialGrids,
	});

	// SOLVED PUZZLES is used by StatsDialog and ArchiveDialog via their own hooks

	// Dev-only: in-memory premium override (avoids Firestore write / race conditions)
	const [devIsPremium, setDevIsPremium] = useState(null); // null = no override

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
			<div className="app">
				<LandingPage onPlay={() => setShowLandingPage(false)} />
			</div>
		);
	}

	// Wait for data to load before rendering Game
	// For signed-in users, wait for both puzzle and user data
	// For signed-out users, only wait for puzzle data
	if (shouldShowLoading) {
		return (
			<div className="app">
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
		<div className="app">
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
				onOpenStats={() => setShowStatsDialog(true)}
				isAppDialogOpen={
					showSettingsDialog || showStatsDialog || showArchiveDialog
				}
			/>

			<SettingsDialog
				isOpen={showSettingsDialog}
				onClose={() => setShowSettingsDialog(false)}
				difficulty={gameState.currentDifficulty}
				onDifficultyChange={(diff) =>
					setGameState({ currentDifficulty: diff })
				}
				isPuzzleSolved={checkWin(
					gameState?.[gameState?.currentDifficulty],
				)}
				onAlmostSolve={setAlmostSolved}
				onTogglePremium={(grant) =>
					setDevIsPremium(grant ? true : null)
				}
			/>

			<ArchiveDialog
				isOpen={showArchiveDialog}
				onClose={() => setShowArchiveDialog(false)}
				onPuzzleSelect={setPuzzleId}
				devIsPremium={devIsPremium}
			/>

			<StatsDialog
				isOpen={showStatsDialog}
				onClose={() => setShowStatsDialog(false)}
				onUnlockArchiveClick={() => {
					setShowStatsDialog(false);
					setShowArchiveDialog(true);
				}}
				devIsPremium={devIsPremium}
			/>
		</div>
	);
}

export default App;
