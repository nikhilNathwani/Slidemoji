import { useEffect, useState } from "react";
import Tile from "./Tile";
import { isAdjacent, getAdjacentIndices } from "../utils/adjacency";

let SOLVED_STATE = [1, 2, 3, 4, 5, 6, 7, 8, null];

function scramblePuzzle(size, numMoves = 100) {
	let tiles = [...SOLVED_STATE];
	let gapIndex = getGapIndex(tiles);

	for (let i = 0; i < numMoves; i++) {
		// Get valid adjacent positions from lookup table
		const validMoves = getAdjacentIndices(gapIndex, size);

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

function Board({ size }) {
	const [tiles, setTiles] = useState(scramblePuzzle(size));
	const [isWon, setIsWon] = useState(false);

	useEffect(() => {
		SOLVED_STATE = [...Array(size * size - 1)]
			.map((_, i) => i + 1)
			.concat(null);
		setTiles(scramblePuzzle(size));
		setIsWon(false);
	}, [size]);

	const handleTileClick = (index) => {
		if (isWon) return; // do nothing if the game is already won
		if (tiles[index] === null) return; // do nothing if the gap is clicked

		const gapIndex = getGapIndex(tiles);
		// Use adjacency helper for O(1) lookup with readable function name
		if (isAdjacent(gapIndex, index, size)) {
			console.log(`Swapping tile ${tiles[index]} with gap`);
			const newTiles = swapTiles(tiles, index, gapIndex);
			setTiles(newTiles);
			if (checkWin(newTiles)) {
				setIsWon(true);
				alert("Congratulations! You've solved the puzzle!");
			}
		}
	};

	// Daily emoji - you can change this based on the date
	const dailyEmoji = getDailyEmoji();

	const handleSolve = () => {
		setTiles([...SOLVED_STATE]);
		setIsWon(true);
	};

	// Fixed board size with responsive tiles
	// Desktop: 480px, Mobile: uses CSS variable
	const boardSizePx = 480; // Will be controlled by CSS var(--board-size)
	const tileSize = boardSizePx / size; // Auto-calculate tile size

	return (
		<>
			<div
				className="board"
				style={{
					width: `var(--board-size, ${boardSizePx}px)`,
					height: `var(--board-size, ${boardSizePx}px)`,
					display: "grid",
					gridTemplateColumns: `repeat(${size}, 1fr)`,
					gridTemplateRows: `repeat(${size}, 1fr)`,
					gap: "0px",
				}}
			>
				{tiles.map((value, index) => (
					<Tile
						key={index}
						value={value}
						isGap={value === null}
						onClick={() => handleTileClick(index)}
						boardSize={size}
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

function getGapIndex(tiles) {
	return tiles.indexOf(null);
}

function swapTiles(tiles, index1, index2) {
	const newTiles = [...tiles];
	[newTiles[index1], newTiles[index2]] = [newTiles[index2], newTiles[index1]];
	return newTiles;
}

function checkWin(tiles) {
	return tiles.every((tile, index) => tile === SOLVED_STATE[index]);
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
