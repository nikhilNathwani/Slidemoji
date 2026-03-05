import { useState, useRef, useEffect } from "react";
import "./App.css";
import Game from "./components/game/Game";
import LandingPage from "./components/landing/LandingPage";
import Header from "./components/Header";
import Dialog from "./components/dialogs/Dialog";
import SettingsContent from "./components/dialogs/SettingsContent";
import WinContent from "./components/dialogs/WinContent";
import ConfirmContent from "./components/dialogs/ConfirmContent";
import StatsContent from "./components/dialogs/StatsContent";
import { getDailyEmoji } from "./utils/emoji";
import { getTodaysPuzzleNumber } from "./utils/dateUtils";
import { getPuzzleById } from "./utils/puzzleUtils";
import { getUserData, updateUserPreferences } from "./firebase/firestore";
import { useAuth } from "./hooks/useAuth";
import { loadFontAwesome } from "./utils/fontAwesome";
import {
	DEFAULT_GRID_SIZE,
	DEFAULT_DARK_MODE,
	DEFAULT_SHOW_NUMBERS,
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
	const dailyEmoji = getDailyEmoji();
	const todaysPuzzleNumber = getTodaysPuzzleNumber();

	const [showLanding, setShowLanding] = useState(true);
	const [isEntering, setIsEntering] = useState(false);
	const [showControls, setShowControls] = useState(false);
	const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
	const [showSettings, setShowSettings] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);
	const [showStats, setShowStats] = useState(false);
	const [showNumbers, setShowNumbers] = useState(DEFAULT_SHOW_NUMBERS);
	const [isWon, setIsWon] = useState(false);
	const [darkMode, setDarkMode] = useState(DEFAULT_DARK_MODE);
	const [showDifficultyConfirm, setShowDifficultyConfirm] = useState(false);
	const [pendingSize, setPendingSize] = useState(null);
	const [userData, setUserData] = useState(null);
	const [puzzleData, setPuzzleData] = useState(null);
	const [highestEarnedDifficulty, setHighestEarnedDifficulty] = useState(0); // 0 = not earned, 3 = 3x3 earned, 4 = 4x4 earned
	const solveRef = useRef(null);

	// Load FontAwesome on app mount
	useEffect(() => {
		loadFontAwesome();
	}, []);

	// Dev mode configuration
	const devConfig = getDevConfig();
	console.log(
		"[DEV] Config:",
		devConfig,
		"VITE_DEV_MODE:",
		import.meta.env.VITE_DEV_MODE,
	);

	// ===== Load User Data on Sign-In =====
	// When user signs in, fetch their Firestore document (preferences, stats, game state)
	// This loads all their data in ONE read - efficient!
	// In dev mode: uses mock data instead
	useEffect(() => {
		if (devConfig.enabled) {
			// DEV MODE: Use mock user data
			const mockUser = getMockUser(devConfig.userScenario);
			console.log(
				"[DEV] Using mock user:",
				devConfig.userScenario,
				mockUser,
			);
			setUserData(mockUser);
			if (mockUser.preferences?.darkMode !== undefined) {
				setDarkMode(mockUser.preferences.darkMode);
			}
			return;
		}

		if (user) {
			// User just signed in - load their data from Firestore
			getUserData(user.uid)
				.then((data) => {
					console.log("[AUTH] User data loaded:", data);
					setUserData(data);
					// Apply saved preferences (dark mode)
					if (data?.preferences?.darkMode !== undefined) {
						setDarkMode(data.preferences.darkMode);
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
			// User signed out - clear data
			setUserData(null);
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
			console.log("[DEV] Using mock puzzle:", mockPuzzle);
			setPuzzleData(mockPuzzle);
			return;
		}

		getPuzzleById(todaysPuzzleNumber)
			.then((data) => {
				setPuzzleData(data);
			})
			.catch((error) => {
				console.error("Error loading puzzle:", error);
			});
	}, [todaysPuzzleNumber, devConfig.enabled, gridSize]);

	// ===== Calculate Trophy Badge (3x3 or 4x4) =====
	// Shows highest difficulty completed for today's puzzle
	// User might complete both 3x3 and 4x4 - badge shows the harder one
	useEffect(() => {
		if (userData?.stats?.completedPuzzles?.[todaysPuzzleNumber]) {
			const completions =
				userData.stats.completedPuzzles[todaysPuzzleNumber];
			// Get all difficulty levels completed (e.g., [3, 4])
			const difficulties = Object.keys(completions).map(Number);
			// Take the highest (4 > 3)
			const highest = Math.max(...difficulties, 0);
			setHighestEarnedDifficulty(highest);
		} else {
			setHighestEarnedDifficulty(0); // Not completed yet
		}
	}, [userData, todaysPuzzleNumber]);

	const handleWin = () => {
		// Update trophy badge difficulty immediately (before win dialog shows)
		// User might complete 3x3 then try 4x4 - badge should update right away
		if (gridSize > highestEarnedDifficulty) {
			setHighestEarnedDifficulty(gridSize);
		}
		// Note: setIsWon and dialog opening happens in Board after celebration delay
	};

	const handleShowWinDialog = () => {
		setIsWon(true);
		setShowWinDialog(true);
	};

	const handleCloseWinDialog = () => {
		setShowWinDialog(false);
		// Keep puzzle in solved state, don't reset
	};

	const handleSolve = () => {
		if (solveRef.current) {
			solveRef.current();
		}
		setShowSettings(false);
	};

	const handleSizeChange = (newSize) => {
		if (newSize !== gridSize) {
			setPendingSize(newSize);
			setShowDifficultyConfirm(true);
		}
	};

	const handleDifficultyConfirm = () => {
		if (pendingSize !== null) {
			setGridSize(pendingSize);
			setPendingSize(null);
		}
		setIsWon(false);
		setShowWinDialog(false); // Close win dialog if open
		setShowDifficultyConfirm(false);
	};

	const handleDifficultyCancel = () => {
		setPendingSize(null);
		setShowDifficultyConfirm(false);
	};

	const handleDarkModeChange = (newDarkMode) => {
		setDarkMode(newDarkMode);
		// Persist to Firestore if user is signed in
		if (user) {
			updateUserPreferences(user.uid, { darkMode: newDarkMode }).catch(
				(error) => {
					console.error("Error saving dark mode preference:", error);
				},
			);
		}
	};

	// Handle entrance animation timing
	useEffect(() => {
		if (isEntering) {
			// Tiles animate in over ~800ms (staggered)
			// Wait for tiles to finish, then show controls
			const timer = setTimeout(() => {
				setShowControls(true);
				setIsEntering(false);
			}, 1000); // Adjust timing as needed
			return () => clearTimeout(timer);
		}
	}, [isEntering]);

	const handlePlay = () => {
		setShowLanding(false);
		setIsEntering(true);
		setShowControls(false);
	};

	if (showLanding) {
		return (
			<div className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
				<LandingPage onPlay={handlePlay} />
			</div>
		);
	}

	return (
		<div className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
			<Header
				onSettingsClick={() => setShowSettings(true)}
				onStatsClick={() => setShowStats(true)}
			/>
			<Game
				dailyEmoji={dailyEmoji}
				gridSize={gridSize}
				onWin={handleWin}
				onShowWinDialog={handleShowWinDialog}
				showNumbers={showNumbers}
				isWon={isWon}
				onSolveRef={solveRef}
				isEntering={isEntering}
				showControls={showControls}
				onShuffle={() => setIsWon(false)}
				highestEarnedDifficulty={highestEarnedDifficulty}
				userData={userData}
				puzzleData={puzzleData}
				puzzleId={todaysPuzzleNumber}
				difficulty={gridSize}
			/>

			<Dialog
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
				title="Settings"
			>
				<SettingsContent
					gridSize={gridSize}
					darkMode={darkMode}
					showNumbers={showNumbers}
					onDarkModeChange={handleDarkModeChange}
					onShowNumbersChange={setShowNumbers}
					onGridSizeChange={handleSizeChange}
					onSolve={handleSolve}
				/>
			</Dialog>

			<Dialog
				isOpen={showStats}
				onClose={() => setShowStats(false)}
				title="Stats"
			>
				<StatsContent dailyEmoji={dailyEmoji} userData={userData} />
			</Dialog>

			<Dialog
				isOpen={showWinDialog}
				onClose={handleCloseWinDialog}
				title="🎉 Congratulations!"
			>
				<WinContent
					earnedEmoji={dailyEmoji.emoji}
					earnedEmojiName={dailyEmoji.name}
					gridSize={gridSize}
					dailyEmoji={dailyEmoji}
					earnedPuzzleIds={new Set([todaysPuzzleNumber])}
					totalPuzzles={365}
					userData={userData}
				/>
			</Dialog>

			<Dialog
				isOpen={showDifficultyConfirm}
				onClose={handleDifficultyCancel}
				title="Change Difficulty?"
			>
				<ConfirmContent
					message="Changing difficulty will restart the puzzle. Continue?"
					onConfirm={handleDifficultyConfirm}
					onCancel={handleDifficultyCancel}
				/>
			</Dialog>
		</div>
	);
}

export default App;
