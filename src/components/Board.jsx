import { useEffect, useState, useRef, useCallback } from "react";
import Tile from "./Tile";
import { isAdjacent } from "../utils/adjacency";
import {
	getSolvedState,
	getGapIndex,
	swapTiles,
	checkWin,
	scramblePuzzle,
	getTilePosition,
	getTileIndexFromDirection,
} from "../utils/boardHelpers";

// ===== Constants =====
const ANIMATION_DURATION_MS = 1000; // Must match CSS transition duration

// ===== Main Component =====

function Board({ size, onWin, showNumbers, onSolveRef, onShuffleRef }) {
	const [tiles, setTiles] = useState(() => scramblePuzzle(size));
	const [isWon, setIsWon] = useState(false);
	const [movingTileValue, setMovingTileValue] = useState(null);
	const boardRef = useRef(null);
	const touchStartRef = useRef(null);
	const isAnimating = useRef(false);
	const hasShownWin = useRef(false);

	// Responsive sizing
	const getResponsiveBoardSize = useCallback(() => {
		const maxSize = Math.min(window.innerWidth - 40, 480);
		return maxSize;
	}, []);

	const [boardSizePx, setBoardSizePx] = useState(getResponsiveBoardSize());
	const tileSizePx = boardSizePx / size;

	// Solve function
	const handleSolve = useCallback(() => {
		setTiles(getSolvedState(size));
		setIsWon(true);
		hasShownWin.current = false;
	}, [size]);

	// Shuffle function
	const handleShuffle = useCallback(() => {
		setTiles(scramblePuzzle(size));
		setIsWon(false);
		hasShownWin.current = false;
	}, [size]);

	// Expose functions to parent
	useEffect(() => {
		if (onSolveRef) {
			onSolveRef.current = handleSolve;
		}
		if (onShuffleRef) {
			onShuffleRef.current = handleShuffle;
		}
	}, [handleSolve, handleShuffle, onSolveRef, onShuffleRef]);

	// Reset board when size changes
	useEffect(() => {
		setTiles(scramblePuzzle(size));
		setIsWon(false);
		hasShownWin.current = false;
	}, [size]);

	// Handle window resize
	useEffect(() => {
		const handleResize = () => {
			setBoardSizePx(getResponsiveBoardSize());
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [getResponsiveBoardSize]);

	// Show win dialog (only once per win)
	useEffect(() => {
		if (isWon && onWin && !hasShownWin.current) {
			hasShownWin.current = true;
			onWin();
		}
	}, [isWon, onWin]);

	// ===== Movement Logic =====
	const gapIndex = getGapIndex(tiles);

	const moveTile = useCallback(
		(tileIndex) => {
			console.log("\n=== moveTile called ===");
			console.log("tileIndex:", tileIndex);
			console.log("tile value:", tiles[tileIndex]);
			console.log("isWon:", isWon);
			console.log("isAnimating.current:", isAnimating.current);

			if (isWon) {
				console.log("❌ BLOCKED: Game is won");
				return;
			}
			if (isAnimating.current) {
				console.log("❌ BLOCKED: Animation already in progress");
				return;
			}
			if (tiles[tileIndex] === null) {
				console.log("❌ BLOCKED: Clicked on gap");
				return;
			}

			const gapIndex = getGapIndex(tiles);
			const adjacent = isAdjacent(gapIndex, tileIndex, size);
			console.log("gapIndex:", gapIndex);
			console.log("isAdjacent:", adjacent);

			if (!adjacent) {
				console.log("❌ BLOCKED: Tile not adjacent to gap");
				return;
			}

			const tileValue = tiles[tileIndex];
			const oldPosition = getTilePosition(tileIndex, size, tileSizePx);
			const newPosition = getTilePosition(gapIndex, size, tileSizePx);

			console.log("✅ MOVING TILE");
			console.log("oldPosition:", oldPosition);
			console.log("newPosition:", newPosition);
			console.log("deltaX:", newPosition.x - oldPosition.x);
			console.log("deltaY:", newPosition.y - oldPosition.y);

			isAnimating.current = true;
			setMovingTileValue(tileValue);

			console.log("Setting movingTileValue to:", tileValue);
			console.log("Calling requestAnimationFrame...");

			// Use requestAnimationFrame to ensure the moving class is applied before state change
			requestAnimationFrame(() => {
				console.log("Inside requestAnimationFrame - swapping tiles");
				const newTiles = swapTiles(tiles, tileIndex, gapIndex);

				if (checkWin(newTiles, getSolvedState(size))) {
					console.log("🎉 PUZZLE SOLVED!");
					setIsWon(true);
				}

				setTiles(newTiles);

				console.log(
					"Tiles swapped, setting timeout for",
					ANIMATION_DURATION_MS,
					"ms",
				);

				// Allow next move after animation completes
				setTimeout(() => {
					console.log("Animation complete - resetting flags");
					isAnimating.current = false;
					setMovingTileValue(null);
				}, ANIMATION_DURATION_MS);
			});
		},
		[tiles, isWon, size, tileSizePx],
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

	// ===== Render =====
	return (
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
				const isTileMoving = value === movingTileValue;
				return (
					<Tile
						key={value === null ? "gap" : value}
						value={value}
						isGap={value === null}
						isAdjacentToGap={
							gapIndex >= 0 && isAdjacent(index, gapIndex, size)
						}
						isMoving={isTileMoving}
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
	);
}

export default Board;
