import { useEffect, useState, useRef, useCallback } from "react";
import Tile from "./Tile";
import Gap from "./Gap";
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
const ANIMATION_DURATION_MS = 400; // Must match CSS transition duration

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

	// Core tile movement function - assumes all validation has passed
	const moveTile = useCallback(
		(tileIndex, tileValue, gapIndex) => {
			const newPosition = getTilePosition(gapIndex, size, tileSizePx);

			isAnimating.current = true;

			// Apply .moving class, then update position after browser paints
			requestAnimationFrame(() => {
				setMovingTileValue(tileValue);

				requestAnimationFrame(() => {
					// Update tile position via DOM (triggers CSS transition)
					if (boardRef.current) {
						const movingTileElement =
							boardRef.current.querySelector(
								`[data-tile-number="${tileValue}"]`,
							);
						if (movingTileElement) {
							movingTileElement.style.transform = `translate(${newPosition.x}px, ${newPosition.y}px)`;
						}
					}

					// Update React state after animation completes
					const newTiles = swapTiles(tiles, tileIndex, gapIndex);

					setTimeout(() => {
						if (checkWin(newTiles, getSolvedState(size))) {
							setIsWon(true);
						}

						setTiles(newTiles);
						isAnimating.current = false;
						setMovingTileValue(null);
					}, ANIMATION_DURATION_MS);
				});
			});
		},
		[tiles, size, tileSizePx],
	);

	// Validates tile selection and triggers movement if valid
	const handleTileSelect = useCallback(
		(tileIndex) => {
			// Validation checks
			if (isWon) {
				return;
			}
			if (isAnimating.current) {
				return;
			}
			if (tiles[tileIndex] === null) {
				return;
			}

			const gapIndex = getGapIndex(tiles);
			const adjacent = isAdjacent(gapIndex, tileIndex, size);

			if (!adjacent) {
				return;
			}

			// All checks passed - move the tile
			const tileValue = tiles[tileIndex];
			moveTile(tileIndex, tileValue, gapIndex);
		},
		[tiles, isWon, size, moveTile],
	);

	// ===== Event Handlers =====
	const handleTileClick = (index) => {
		handleTileSelect(index);
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
				handleTileSelect(tileIndex);
			}
		},
		[tiles, size, handleTileSelect],
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
				const isGap = value === null;

				if (isGap) {
					return (
						<Gap key="gap" position={position} size={tileSizePx} />
					);
				}

				const isMoving = value === movingTileValue;
				const isClickable =
					!isWon &&
					!isAnimating.current &&
					isAdjacent(gapIndex, index, size);

				return (
					<Tile
						key={value}
						tileNumber={value}
						isMoving={isMoving}
						isClickable={isClickable}
						onClick={() => handleTileClick(index)}
						onTouchStart={handleTouchStart}
						onTouchEnd={(e) => handleTouchEnd(e, index)}
						showNumbers={showNumbers}
						position={position}
						size={tileSizePx}
						animationDuration={ANIMATION_DURATION_MS}
					/>
				);
			})}
		</div>
	);
}

export default Board;
