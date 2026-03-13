import { useState, useEffect } from "react";
import "./App.css";
import Game from "./components/game/Game";
import LandingPage from "./components/landing/LandingPage";
import Header from "./components/Header";
import TrophyCaseTitle from "./components/stats/TrophyCaseTitle";
import Dialog from "./components/dialogs/Dialog";
import SettingsDialog from "./components/dialogs/SettingsDialog";
import WinDialog from "./components/dialogs/WinDialog";
import ConfirmResetDialog from "./components/dialogs/ConfirmResetDialog";
import StatsDialog from "./components/dialogs/StatsDialog";
import { getDailyEmoji } from "./utils/emoji";
import { getTodaysPuzzleNumber } from "./utils/dateUtils";
import { getPuzzleById, convertPuzzleFromFirestore } from "./utils/puzzleUtils";
import { FontAwesomeIcon } from "./utils/icons";
import { getUserData, updateUserPreferences } from "./firebase/firestore";
import { useAuth } from "./hooks/useAuth";
import {
	DEFAULT_GRID_SIZE,
	DEFAULT_DARK_MODE,
	DEFAULT_SHOW_NUMBERS,
	DEFAULT_SOUND_ENABLED,
} from "./constants";
import {
	isDevMode,
	getMockPuzzle,
	getMockUser,
	getDevConfig,
	devLog,
} from "./dev/mockData";

function App() {
	const { user } = useAuth();
	const puzzleEmoji = getDailyEmoji();
	const todaysPuzzleNumber = getTodaysPuzzleNumber();

	// Show Page / Dialog
	const [showLandingPage, setShowLandingPage] = useState(true);
	const [showSettingsDialog, setShowSettingsDialog] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);
	const [showStatsDialog, setShowStatsDialog] = useState(false);
	const [showDifficultyConfirmDialog, setShowDifficultyConfirmDialog] =
		useState(false);

	// Settings
	const [hasDarkMode, setHasDarkMode] = useState(DEFAULT_DARK_MODE);
	const [hasNumbersShown, setHasNumbersShown] =
		useState(DEFAULT_SHOW_NUMBERS);
	const [hasSoundEnabled, setHasSoundEnabled] = useState(
		DEFAULT_SOUND_ENABLED,
	);

	// Game State
	const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
	const [isGameWon, setIsGameWon] = useState(false);
	const [pendingSize, setPendingSize] = useState(null);
	const [userData, setUserData] = useState(null);
	const [puzzle, setPuzzle] = useState(null);
	const [maxDifficultySolved, setMaxDifficultySolved] = useState(0); // 0 = not solved, 3 = 3x3, 4 = 4x4

	// Dev mode configuration
	const devConfig = getDevConfig();

	// ===== Load User Data on Sign-In =====
	// When user signs in, fetch their Firestore document (preferences, stats, game state)
	// This loads all their data in ONE read - efficient!
	// In dev mode: uses mock data instead
	useEffect(() => {
		if (devConfig.enabled) {
			// DEV MODE: Use mock user data
			const mockUser = getMockUser(devConfig.userScenario);
			setUserData(mockUser);
			if (mockUser.preferences?.darkMode !== undefined) {
				setHasDarkMode(mockUser.preferences.darkMode);
			}
			if (mockUser.preferences?.soundEnabled !== undefined) {
				setHasSoundEnabled(mockUser.preferences.soundEnabled);
			}
			return;
		}

		if (user) {
			// User just signed in - load their data from Firestore
			getUserData(user.uid)
				.then((data) => {
					setUserData(data);
					// Apply saved preferences
					if (data?.preferences?.darkMode !== undefined) {
						setHasDarkMode(data.preferences.darkMode);
					}
					if (data?.preferences?.soundEnabled !== undefined) {
						setHasSoundEnabled(data.preferences.soundEnabled);
					}
				})
				.catch((error) => {
					console.error("[AUTH] Error loading user data:", error);
					console.error("[AUTH] Error details:", {
						message: error.message,
						code: error.code,
						stack: error.stack,
					});
					// Set empty userData so board doesn't stay stuck on "Loading..."
					setUserData({});
				});
		} else {
			// Anonymous user - allow playing without saved progress
			setUserData({});
		}
	}, [user, devConfig.enabled, devConfig.userScenario]); // Re-run when user changes (sign in/out) or dev scenario changes

	// ===== Load Today's Puzzle Data from Firestore =====
	// Fetches puzzle definition (emoji, initial boards for 3x3 and 4x4)
	// All users get the same puzzle - ensures fair comparison of moves/time!
	// In dev mode: uses mock puzzle
	useEffect(() => {
		if (devConfig.enabled) {
			// DEV MODE: Use mock puzzle
			const mockPuzzle = getMockPuzzle(todaysPuzzleNumber);
			setPuzzle(mockPuzzle);
			return;
		}

		getPuzzleById(todaysPuzzleNumber)
			.then((data) => {
				const convertedData = convertPuzzleFromFirestore(data);
				setPuzzle(convertedData);
			})
			.catch((error) => {
				console.error("Error loading puzzle:", error);
			});
	}, [todaysPuzzleNumber, devConfig.enabled, gridSize]);

	// ===== Calculate Trophy Badge (highest difficulty solved for today's puzzle) =====
	// User might solve both 3x3 and 4x4 - badge shows the harder one
	useEffect(() => {
		if (userData?.stats?.solvedPuzzles?.[todaysPuzzleNumber]) {
			const solutions = userData.stats.solvedPuzzles[todaysPuzzleNumber];
			// Get all difficulty levels solved (e.g., [3, 4])
			const difficulties = Object.keys(solutions).map(Number);
			// Take the highest (4 > 3)
			const highest = Math.max(...difficulties, 0);
			setMaxDifficultySolved(highest);
		} else {
			setMaxDifficultySolved(0); // Not solved yet
		}
	}, [userData, todaysPuzzleNumber]);

	const handleWin = () => {
		// Update trophy badge difficulty immediately (before win dialog shows)
		// User might solve 3x3 then try 4x4 - badge should update right away
		if (gridSize > maxDifficultySolved) {
			setMaxDifficultySolved(gridSize);
		}

		// Update local userData to add this solution immediately (for trophy case)
		// This ensures the trophy shows up right away in the win dialog
		setUserData((prevData) => {
			if (!prevData || !prevData.stats) return prevData;

			const updatedStats = { ...prevData.stats };
			if (!updatedStats.solvedPuzzles) {
				updatedStats.solvedPuzzles = {};
			}
			if (!updatedStats.solvedPuzzles[todaysPuzzleNumber]) {
				updatedStats.solvedPuzzles[todaysPuzzleNumber] = {};
			}
			// Add this difficulty solution with emoji data
			updatedStats.solvedPuzzles[todaysPuzzleNumber][gridSize] = {
				completedAt: new Date(),
				emoji: puzzleEmoji.emoji,
				emojiName: puzzleEmoji.name,
			};

			return {
				...prevData,
				stats: updatedStats,
			};
		});

		// Block all input during win celebration period
		setShowSettingsDialog(false);
		setShowStatsDialog(false);

		// Note: setIsWon and dialog opening happens in Board after celebration delay
	};

	const handleShowWinDialog = () => {
		setIsGameWon(true);
		setShowWinDialog(true);
	};

	const handleCloseWinDialog = () => {
		setShowWinDialog(false);
		// Keep puzzle in solved state, don't reset
	};

	const handleSizeChange = (newSize) => {
		if (newSize !== gridSize) {
			setPendingSize(newSize);
			setShowDifficultyConfirmDialog(true);
		}
	};

	const handleDifficultyConfirm = () => {
		if (pendingSize !== null) {
			setGridSize(pendingSize);
			setPendingSize(null);
		}
		setIsGameWon(false);
		setShowWinDialog(false); // Close win dialog if open
		setShowDifficultyConfirmDialog(false);
	};

	const handleDifficultyCancel = () => {
		setPendingSize(null);
		setShowDifficultyConfirmDialog(false);
	};

	const handleDarkModeChange = (newHasDarkMode) => {
		setHasDarkMode(newHasDarkMode);
		// Persist to Firestore if user is signed in
		if (user) {
			updateUserPreferences(user.uid, { darkMode: newHasDarkMode }).catch(
				(error) => {
					console.error("Error saving dark mode preference:", error);
				},
			);
		}
	};

	const handleSoundEnabledChange = (newSoundEnabled) => {
		setHasSoundEnabled(newSoundEnabled);
		// Persist to Firestore if user is signed in
		if (user) {
			updateUserPreferences(user.uid, {
				soundEnabled: newSoundEnabled,
			}).catch((error) => {
				console.error("Error saving sound preference:", error);
			});
		}
	};

	const handlePlay = () => {
		setShowLandingPage(false);
	};

	if (showLandingPage) {
		return (
			<div
				className={`app ${hasDarkMode ? "dark-theme" : "light-theme"}`}
			>
				<LandingPage onPlay={handlePlay} />
			</div>
		);
	}

	return (
		<div className={`app ${hasDarkMode ? "dark-theme" : "light-theme"}`}>
			<Header
				onSettingsClick={() => setShowSettingsDialog(true)}
				onStatsClick={() => setShowStatsDialog(true)}
				isWinCelebrating={false}
			/>

			<Game
				puzzleEmoji={puzzleEmoji}
				puzzle={puzzle}
				puzzleId={todaysPuzzleNumber}
				difficulty={gridSize}
				gridSize={gridSize}
				savedGame={
					userData?.gameState?.[todaysPuzzleNumber]?.[gridSize]
				}
				maxDifficultySolved={maxDifficultySolved}
				hasNumbersShown={hasNumbersShown}
				isGameWon={isGameWon}
				hasSoundEnabled={hasSoundEnabled}
				onWin={handleWin}
				onShowWinDialog={handleShowWinDialog}
				onShuffle={() => setIsGameWon(false)}
			/>

			<SettingsDialog
				isOpen={showSettingsDialog}
				onClose={() => setShowSettingsDialog(false)}
				gridSize={gridSize}
				hasDarkMode={hasDarkMode}
				hasNumbersShown={hasNumbersShown}
				hasSoundEnabled={hasSoundEnabled}
				onDarkModeChange={handleDarkModeChange}
				onShowNumbersChange={setHasNumbersShown}
				onSoundEnabledChange={handleSoundEnabledChange}
				onGridSizeChange={handleSizeChange}
			/>

			<StatsDialog
				isOpen={showStatsDialog}
				onClose={() => setShowStatsDialog(false)}
				solvedPuzzles={userData?.stats?.solvedPuzzles}
				numTotalPuzzles={todaysPuzzleNumber}
			/>

			<WinDialog
				isOpen={showWinDialog}
				onClose={handleCloseWinDialog}
				puzzleNumber={todaysPuzzleNumber}
				puzzleEmoji={puzzleEmoji.emoji}
				puzzleEmojiName={puzzleEmoji.name}
				gridSize={gridSize}
				solvedPuzzles={userData?.stats?.solvedPuzzles}
			/>

			<ConfirmResetDialog
				isOpen={showDifficultyConfirmDialog}
				onClose={handleDifficultyCancel}
				//
				onConfirm={handleDifficultyConfirm}
				message={
					"Changing difficulty will restart the puzzle. Continue?"
				}
			/>
		</div>
	);
}

export default App;
