import { useState } from "react";
import "./App.css";
import Board from "./components/Board";
import Dialog from "./components/Dialog";

function App() {
	const [gridSize, setGridSize] = useState(3); // Default to 3×3
	const [showSettings, setShowSettings] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);
	const [boardKey, setBoardKey] = useState(0);

	const handleWin = () => {
		setShowWinDialog(true);
	};

	const handleCloseWinDialog = () => {
		setShowWinDialog(false);
		// Reset the board by changing its key, which forces a remount
		setBoardKey((k) => k + 1);
	};

	return (
		<div className="app">
			<header>
				<h1>Slidemoji</h1>
				<p>Slides tiles to unscramble the emoji!</p>
			</header>
			<main>
				<button
					className="settings-button"
					onClick={() => setShowSettings(true)}
				>
					⚙️ Settings
				</button>
				<Board key={boardKey} size={gridSize} onWin={handleWin} />
			</main>

			<Dialog
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
				title="Settings"
			>
				<SettingsContent
					selectedSize={gridSize}
					onSizeChange={setGridSize}
				/>
			</Dialog>

			<Dialog
				isOpen={showWinDialog}
				onClose={handleCloseWinDialog}
				title="🎉 Congratulations!"
			>
				<WinContent />
			</Dialog>
		</div>
	);
}

function SettingsContent({ selectedSize, onSizeChange }) {
	const sizes = [2, 3, 4];

	return (
		<div className="settings-content">
			<div className="size-selector">
				<label>Grid Size: </label>
				{sizes.map((size) => (
					<button
						key={size}
						className={selectedSize === size ? "active" : ""}
						onClick={() => onSizeChange(size)}
					>
						{size}×{size}
					</button>
				))}
			</div>
		</div>
	);
}

function WinContent() {
	return (
		<div className="win-dialog-content">
			<div className="emoji">🎊</div>
			<h3>You solved it!</h3>
			<p>Great job completing the puzzle!</p>
		</div>
	);
}

export default App;
