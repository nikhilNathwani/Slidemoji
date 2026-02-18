import { useState, useRef } from "react";
import "./App.css";
import Board from "./components/Board";
import Dialog from "./components/Dialog";

function App() {
	const [gridSize, setGridSize] = useState(3); // Default to 3×3
	const [showSettings, setShowSettings] = useState(false);
	const [showWinDialog, setShowWinDialog] = useState(false);
	const [showNumbers, setShowNumbers] = useState(true); // Default to showing numbers
	const [showShuffleConfirm, setShowShuffleConfirm] = useState(false);
	const [showDifficultyConfirm, setShowDifficultyConfirm] = useState(false);
	const [pendingSize, setPendingSize] = useState(null);
	const solveRef = useRef(null);
	const shuffleRef = useRef(null);

	const handleWin = () => {
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
	};

	const handleShuffleClick = () => {
		setShowShuffleConfirm(true);
	};

	const handleShuffleConfirm = () => {
		setShowShuffleConfirm(false);
		if (shuffleRef.current) {
			shuffleRef.current();
		}
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
		setShowDifficultyConfirm(false);
	};

	const handleDifficultyCancel = () => {
		setPendingSize(null);
		setShowDifficultyConfirm(false);
	};

	return (
		<div className="app">
			<header className="game-header">
				<div className="header-left">
					<button
						className="icon-button"
						onClick={() => setShowSettings(true)}
						aria-label="Settings"
					>
						⚙️
					</button>
					<button
						className="icon-button"
						onClick={handleShuffleClick}
						aria-label="Shuffle"
					>
						🔀
					</button>
				</div>
				<div className="puzzle-of-day">
					<div className="puzzle-title">Slidemoji #001</div>
					<div className="puzzle-emoji">🛝</div>
				</div>
				<button
					className="icon-button"
					onClick={handleSolve}
					aria-label="Solve"
				>
					🔧
				</button>
			</header>
			<main>
				<Board
					size={gridSize}
					onWin={handleWin}
					showNumbers={showNumbers}
					onSolveRef={solveRef}
					onShuffleRef={shuffleRef}
				/>
			</main>

			<Dialog
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
				title="Settings"
			>
				<SettingsContent
					selectedSize={gridSize}
					onSizeChange={handleSizeChange}
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

			<Dialog
				isOpen={showShuffleConfirm}
				onClose={() => setShowShuffleConfirm(false)}
				title="Shuffle Board?"
			>
				<ConfirmContent
					message="This will shuffle the board and reset your current progress. Are you sure?"
					onConfirm={handleShuffleConfirm}
					onCancel={() => setShowShuffleConfirm(false)}
				/>
			</Dialog>

			<Dialog
				isOpen={showDifficultyConfirm}
				onClose={handleDifficultyCancel}
				title="Change Difficulty?"
			>
				<ConfirmContent
					message="Changing difficulty will reset the board and you will lose your current progress. Continue?"
					onConfirm={handleDifficultyConfirm}
					onCancel={handleDifficultyCancel}
				/>
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

function ConfirmContent({ message, onConfirm, onCancel }) {
	return (
		<div className="confirm-dialog-content">
			<p>{message}</p>
			<div className="confirm-buttons">
				<button className="confirm-btn cancel" onClick={onCancel}>
					Cancel
				</button>
				<button className="confirm-btn confirm" onClick={onConfirm}>
					Confirm
				</button>
			</div>
		</div>
	);
}

export default App;
