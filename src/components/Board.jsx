import { useEffect, useState, useRef, useCallback } from "react";
import Tile from "./Tile";
import { isAdjacent, getAdjacentIndices } from "../utils/adjacency";

// ===== Helper Functions =====

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

// Calculate tile position based on index
function getTilePosition(index, size, tileSizePx) {
	const row = Math.floor(index / size);
	const col = index % size;
	return {
		x: col * tileSizePx,
		y: row * tileSizePx,
	};
}

// Get tile index from direction for keyboard controls
function getTileIndexFromDirection(gapIndex, direction, size) {
	const gapRow = Math.floor(gapIndex / size);
	const gapCol = gapIndex % size;

	const directionMap = {
		ArrowUp: { row: gapRow + 1, col: gapCol },
		ArrowDown: { row: gapRow - 1, col: gapCol },
		ArrowLeft: { row: gapRow, col: gapCol + 1 },
		ArrowRight: { row: gapRow, col: gapCol - 1 },
	};

	const target = directionMap[direction];
	if (!target) return null;

	if (
		target.row < 0 ||
		target.row >= size ||
		target.col < 0 ||
		target.col >= size
	) {
		return null;
	}

	return target.row * size + target.col;
}

// ===== Main Component =====

function Board({ size, onWin, showNumbers }) {
	const [tiles, setTiles] = useState(() => scramblePuzzle(size));
	const [isWon, setIsWon] = useState(false);
	const boardRef = useRef(null);
	const touchStartRef = useRef(null);

	// Responsive sizing
	const getResponsiveBoardSize = useCallback(() => {
		const maxSize = Math.min(window.innerWidth - 40, 480);
		return maxSize;
	}, []);

	const [boardSizePx, setBoardSizePx] = useState(getResponsiveBoardSize());
	const tileSizePx = boardSizePx / size;

	// Reset board when size changes
	useEffect(() => {
		setTiles(scramblePuzzle(size));
		setIsWon(false);
	}, [size]);

	// Handle window resize
	useEffect(() => {
		const handleResize = () => {
			setBoardSizePx(getResponsiveBoardSize());
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [getResponsiveBoardSize]);

	// Show win dialog
	useEffect(() => {
		if (isWon && onWin) {
			onWin();
		}
	}, [isWon, onWin]);

	// ===== Movement Logic =====
	const gapIndex = getGapIndex(tiles);

	const moveTile = useCallback(
		(tileIndex) => {
			if (isWon) return;
			if (tiles[tileIndex] === null) return;

			const gapIndex = getGapIndex(tiles);
			if (!isAdjacent(gapIndex, tileIndex, size)) return;

			const newTiles = swapTiles(tiles, tileIndex, gapIndex);

			if (checkWin(newTiles, getSolvedState(size))) {
				setIsWon(true);
			}

			setTiles(newTiles);
		},
		[tiles, isWon, size],
	);

	// ===== Event Handlers =====
	const handleTileClick = (index) => {
		moveTile(index);
	};

	// Keyboard controls
	const handleKeyPress = useCallback(
		(event) => {
			const arrowKeys = [
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight",
			];
			if (!arrowKeys.includes(event.key)) return;

			event.preventDefault();

			const gapIndex = getGapIndex(tiles);
			const tileIndex = getTileIndexFromDirection(
				gapIndex,
				event.key,
				size,
			);

			if (tileIndex !== null) {
				moveTile(tileIndex);
			}
		},
		[tiles, size, moveTile],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [handleKeyPress]);

	// Touch/swipe controls
	const handleTouchStart = (e) => {
		const touch = e.touches[0];
		touchStartRef.current = {
			x: touch.clientX,
			y: touch.clientY,
			time: Date.now(),
		};
	};

	const handleTouchEnd = (e, tileIndex) => {
		if (!touchStartRef.current) return;

		const touch = e.changedTouches[0];
		const deltaX = touch.clientX - touchStartRef.current.x;
		const deltaY = touch.clientY - touchStartRef.current.y;
		const deltaTime = Date.now() - touchStartRef.current.time;

		// Require minimum swipe distance and speed
		const minSwipeDistance = 30;
		const maxSwipeTime = 500;

		if (deltaTime > maxSwipeTime) {
			touchStartRef.current = null;
			return;
		}

		const absX = Math.abs(deltaX);
		const absY = Math.abs(deltaY);

		if (absX < minSwipeDistance && absY < minSwipeDistance) {
			// Not a swipe, treat as click
			handleTileClick(tileIndex);
			touchStartRef.current = null;
			return;
		}

		// Determine swipe direction
		let direction;
		if (absX > absY) {
			direction = deltaX > 0 ? "ArrowRight" : "ArrowLeft";
		} else {
			direction = deltaY > 0 ? "ArrowDown" : "ArrowUp";
		}

		// Check if tile can move in that direction (opposite of gap direction)
		const tileRow = Math.floor(tileIndex / size);
		const tileCol = tileIndex % size;
		const gapRow = Math.floor(gapIndex / size);
		const gapCol = gapIndex % size;

		const canMove =
			(direction === "ArrowUp" &&
				tileRow === gapRow + 1 &&
				tileCol === gapCol) ||
			(direction === "ArrowDown" &&
				tileRow === gapRow - 1 &&
				tileCol === gapCol) ||
			(direction === "ArrowLeft" &&
				tileCol === gapCol + 1 &&
				tileRow === gapRow) ||
			(direction === "ArrowRight" &&
				tileCol === gapCol - 1 &&
				tileRow === gapRow);

		if (canMove) {
			moveTile(tileIndex);
		}

		touchStartRef.current = null;
	};

	const handleSolve = () => {
		setTiles(getSolvedState(size));
		setIsWon(true);
	};

	// ===== Render =====
	return (
		<>
			<div
				ref={boardRef}
				className="board"
				style={{
					width: `${boardSizePx}px`,
					height: `${boardSizePx}px`,
					position: "relative",
				}}
			>
				{tiles.map((value, index) => {
					const position = getTilePosition(index, size, tileSizePx);
					return (
						<Tile
							key={`${index}-${value}`}
							value={value}
							isGap={value === null}
							isAdjacentToGap={
								gapIndex >= 0 &&
								isAdjacent(index, gapIndex, size)
							}
							onClick={() => handleTileClick(index)}
							onTouchStart={handleTouchStart}
							onTouchEnd={(e) => handleTouchEnd(e, index)}
							showNumbers={showNumbers}
							position={position}
							size={tileSizePx}
						/>
					);
				})}
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
