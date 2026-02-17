import { useEffect, useState } from "react";
import Tile from "./Tile";
import { isAdjacent, getAdjacentIndices } from "../utils/adjacency";

// ===== Helper Functions (outside component) =====

function getSolvedState(size) {
	return [...Array(size * size - 1)].map((_, i) => i + 1).concat(null);
}

function getGapIndex(tiles) {
	return tiles.indexOf(null);
}

function swapTiles(tiles, index1, index2) {
	const newTiles = [...tiles];
	[newTiles[index1], newTiles[index2]] = [newTiles[index2], newTiles[index1]];
	return newTiles;
}

function checkWin(tiles, solvedState) {
	return tiles.every((tile, index) => tile === solvedState[index]);
}

function scramblePuzzle(size, numMoves = 100) {
	let tiles = [...getSolvedState(size)];
	let gapIndex = getGapIndex(tiles);

	for (let i = 0; i < numMoves; i++) {
		const validMoves = getAdjacentIndices(gapIndex, size);
		const randomMove =
			validMoves[Math.floor(Math.random() * validMoves.length)];

		[tiles[gapIndex], tiles[randomMove]] = [
			tiles[randomMove],
			tiles[gapIndex],
		];
		gapIndex = randomMove;
	}

	return tiles;
}

// ===== Main Component =====

function Board({ size, onWin }) {
	// ===== State & Effects =====
	const [tiles, setTiles] = useState(() => scramblePuzzle(size));
	const [isWon, setIsWon] = useState(false);

	// Reset board when size changes
	useEffect(() => {
		setTiles(scramblePuzzle(size));
		setIsWon(false);
	}, [size]);

	// Show win dialog after render completes
	useEffect(() => {
		if (isWon && onWin) {
			onWin();
		}
	}, [isWon, onWin]);

	// ===== Derived Values =====
	const gapIndex = getGapIndex(tiles);
	const boardSizePx = 480;

	// ===== Event Handlers =====
	const handleTileClick = (index) => {
		if (isWon) return; // do nothing if the game is already won
		if (tiles[index] === null) return; // do nothing if the gap is clicked

		const gapIndex = getGapIndex(tiles);
		if (isAdjacent(gapIndex, index, size)) {
			console.log(`Swapping tile ${tiles[index]} with gap`);
			const newTiles = swapTiles(tiles, index, gapIndex);
			setTiles(newTiles);
			if (checkWin(newTiles, getSolvedState(size))) {
				setIsWon(true);
			}
		}
	};

	const handleSolve = () => {
		setTiles(getSolvedState(size));
		setIsWon(true);
	};

	// ===== Render =====
	return (
		<>
			<div
				className="board"
				style={{
					width: `${boardSizePx}px`,
					height: `${boardSizePx}px`,
					display: "grid",
					gridTemplateColumns: `repeat(${size}, 1fr)`,
					gridTemplateRows: `repeat(${size}, 1fr)`,
					gap: "1px" /* Small gap for visual separation */,
				}}
			>
				{tiles.slice(0, size * size).map((value, index) => (
					<Tile
						key={index}
						value={value}
						isGap={value === null}
						isAdjacentToGap={
							gapIndex >= 0 && isAdjacent(index, gapIndex, size)
						}
						onClick={() => handleTileClick(index)}
					/>
				))}
			</div>
			<SolveButton onClick={handleSolve} />
		</>
	);
}

// ===== Sub-components =====

function SolveButton({ onClick }) {
	return (
		<button
			onClick={onClick}
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
	);
}

export default Board;
