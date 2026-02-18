import { useState } from "react";
import "./App.css";
import Board from "./components/Board";
import Dialog from "./components/Dialog";

function App() {
	const [gridSize, setGridSize] = useState(3); // Default to 3×3
	const [showSettings, setShowSettings] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);
	const [boardKey, setBoardKey] = useState(0);
	const [showNumbers, setShowNumbers] = useState(true); // Default to showing numbers

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
				<Board
					key={boardKey}
					size={gridSize}
					onWin={handleWin}
					showNumbers={showNumbers}
				/>
			</main>

			<Dialog
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
				title="Settings"
			>
				<SettingsContent
					selectedSize={gridSize}
					onSizeChange={setGridSize}
					showNumbers={showNumbers}
					onShowNumbersChange={setShowNumbers}
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

function SettingsContent({
	selectedSize,
	onSizeChange,
	showNumbers,
	onShowNumbersChange,
}) {
	const difficulties = [
		{ size: 3, label: "Normal", display: "3×3" },
		{ size: 4, label: "Hard", display: "4×4" },
	];

	return (
		<div className="settings-content">
			<div className="settings-item">
				<label className="settings-label">Difficulty</label>
				<div className="difficulty-selector">
					{difficulties.map((diff) => (
						<button
							key={diff.size}
							className={
								selectedSize === diff.size
									? "difficulty-btn active"
									: "difficulty-btn"
							}
							onClick={() => onSizeChange(diff.size)}
						>
							<span className="difficulty-label">
								{diff.label}
							</span>
							<span className="difficulty-size">
								{diff.display}
							</span>
						</button>
					))}
				</div>
			</div>
			<div className="settings-item">
				<label className="settings-label">Show Numbers</label>
				<button
					className={`toggle-switch ${showNumbers ? "on" : "off"}`}
					onClick={() => onShowNumbersChange(!showNumbers)}
				>
					<span className="toggle-slider"></span>
					<span className="toggle-label">
						{showNumbers ? "ON" : "OFF"}
					</span>
				</button>
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
