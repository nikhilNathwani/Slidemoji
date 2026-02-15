import { useEffect, useState } from "react";
import Tile from "./Tile";
import { isAdjacent, getAdjacentIndices } from "../utils/adjacency";

function createSolvedState(gridSize) {
	return [...Array(gridSize * gridSize - 1)]
		.map((_, i) => i + 1)
		.concat(null);
}

function scramblePuzzle(gridSize, numMoves = 100) {
	// Generate correct solved state for this grid size
	const solvedState = createSolvedState(gridSize);
	let tiles = [...solvedState];
	let gapIndex = tiles.indexOf(null);

	for (let i = 0; i < numMoves; i++) {
		// Get valid adjacent positions from lookup table
		const validMoves = getAdjacentIndices(gapIndex, gridSize);

		// Pick a random adjacent tile
		const randomMove =
			validMoves[Math.floor(Math.random() * validMoves.length)];

		// Swap with gap
		[tiles[gapIndex], tiles[randomMove]] = [
			tiles[randomMove],
			tiles[gapIndex],
		];
		gapIndex = randomMove;
	}

	return tiles;
}

function Board({ size: gridSize }) {
	const [tiles, setTiles] = useState(() => scramblePuzzle(gridSize));
	const [isWon, setIsWon] = useState(false);

	const solvedState = createSolvedState(gridSize);

	useEffect(() => {
		// Reset game when grid size changes
		setTiles(scramblePuzzle(gridSize));
		setIsWon(false);
	}, [gridSize]);

	const handleTileClick = (index) => {
		if (isWon) return; // do nothing if the game is already won
		if (tiles[index] === null) return; // do nothing if the gap is clicked

		const gapIndex = tiles.indexOf(null);
		// Check adjacency using helper function
		if (isAdjacent(gapIndex, index, gridSize)) {
			console.log(`Swapping tile ${tiles[index]} with gap`);
			const newTiles = [...tiles];
			[newTiles[index], newTiles[gapIndex]] = [
				newTiles[gapIndex],
				newTiles[index],
			];
			setTiles(newTiles);
			if (newTiles.every((tile, i) => tile === solvedState[i])) {
				setIsWon(true);
				alert("Congratulations! You've solved the puzzle!");
			}
		}
	};

	// Daily emoji - you can change this based on the date
	const dailyEmoji = getDailyEmoji();

	const handleSolve = () => {
		setTiles([...solvedState]);
		setIsWon(true);
	};

	// Fixed board size with responsive tiles
	// Desktop: 480px, Mobile: uses CSS variable
	const boardSizePx = 480; // Will be controlled by CSS var(--board-size)
	const tileSize = boardSizePx / gridSize; // Auto-calculate tile size

	return (
		<>
			<div
				className="board"
				style={{
					width: `var(--board-size, ${boardSizePx}px)`,
					height: `var(--board-size, ${boardSizePx}px)`,
					display: "grid",
					gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
					gridTemplateRows: `repeat(${gridSize}, 1fr)`,
					gap: "0px",
				}}
			>
				{tiles.map((value, index) => (
					<Tile
						key={index}
						value={value}
						isGap={value === null}
						onClick={() => handleTileClick(index)}
						boardSize={gridSize}
						emoji={dailyEmoji}
						tileSize={tileSize}
					/>
				))}
			</div>
			{/* Temporary solve button for testing */}
			<button
				onClick={handleSolve}
				style={{
					marginTop: "20px",
					padding: "10px 20px",
					fontSize: "1rem",
					cursor: "pointer",
					backgroundColor: "#10b981",
					color: "white",
					border: "none",
					borderRadius: "6px",
				}}
			>
				🔧 Solve (Testing)
			</button>
		</>
	);
}

// Get daily emoji based on current date
function getDailyEmoji() {
	const emojis = [
		"😀", // Grinning Face
		"🎉", // Party Popper
		"🌟", // Star
		"🎨", // Artist Palette
		"🚀", // Rocket
		"🌈", // Rainbow
		"🎭", // Performing Arts
		"🎸", // Guitar
		"🍕", // Pizza
		"🌺", // Hibiscus
		"🦄", // Unicorn
		"🎯", // Direct Hit
		"🔥", // Fire
		"💎", // Gem Stone
		"🌙", // Crescent Moon
		"☀️", // Sun
		"🌊", // Water Wave
		"🍔", // Hamburger
		"🎮", // Video Game
		"📚", // Books
		"⚡", // High Voltage
		"🎪", // Circus Tent
		"🌸", // Cherry Blossom
		"🎵", // Musical Note
		"🏆", // Trophy
		"🎂", // Birthday Cake
		"🌍", // Earth
		"🎁", // Wrapped Gift
		"🔮", // Crystal Ball
		"🌻", // Sunflower
	];

	// Get day of year (0-365)
	const now = new Date();
	const start = new Date(now.getFullYear(), 0, 0);
	const diff = now - start;
	const oneDay = 1000 * 60 * 60 * 24;
	const dayOfYear = Math.floor(diff / oneDay);

	// Pick emoji based on day of year
	return emojis[dayOfYear % emojis.length];
}

export default Board;
