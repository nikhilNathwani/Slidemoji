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
	const mouseDragRef = useRef(null);
	const isAnimating = useRef(false);
	const hasShownWin = useRef(false);

	// Responsive sizing
	const getResponsiveBoardSize = useCallback(() => {
		const maxSize = Math.min(window.innerWidth - 40, 480);
		// Ensure board size is divisible by grid size to avoid subpixel rendering
		return Math.floor(maxSize / size) * size;
	}, [size]);

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
		(tileIndex, gapIndex) => {
			const tileValue = tiles[tileIndex];
			console.log("[moveTile] Moving tile:", {
				tileIndex,
				tileValue,
				gapIndex,
			});
			const newPosition = getTilePosition(gapIndex, size, tileSizePx);

			isAnimating.current = true;
			setMovingTileValue(tileValue);

			// Update tile position via DOM (triggers CSS transition)
			if (boardRef.current) {
				const movingTileElement = boardRef.current.querySelector(
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
		},
		[tiles, size, tileSizePx],
	);

	// Validates tile selection and triggers movement if valid
	// Supports two modes:
	// 1. Direct tile selection: handleTileSelect(tileIndex, null)
	//    - Handlers only attached to gap-adjacent tiles, so no need to re-check
	// 2. Directional movement: handleTileSelect(null, direction)
	//    - Must validate the tile in that direction exists and is valid
	const handleTileSelect = useCallback(
		(tileIndex, direction = null) => {
			// Validation checks
			if (isWon) {
				return;
			}
			if (isAnimating.current) {
				return;
			}

			const gapIndex = getGapIndex(tiles);
			let targetTileIndex;

			if (direction !== null) {
				// Direction-based movement (keyboard/swipe)
				console.log("[handleTileSelect] Direction mode:", {
					direction,
					gapIndex,
				});
				targetTileIndex = getTileIndexFromDirection(
					gapIndex,
					direction,
					size,
				);
				console.log(
					"[handleTileSelect] Target tile from direction:",
					targetTileIndex,
				);
				if (targetTileIndex === null) {
					return; // Invalid direction
				}
			} else {
				// Direct tile selection (click/tap/drag)
				// No additional validation needed - handlers only attached to gap-adjacent tiles
				console.log("[handleTileSelect] Direct selection mode:", {
					tileIndex,
					gapIndex,
				});
				targetTileIndex = tileIndex;
			}

			// All checks passed - move the tile
			console.log("[handleTileSelect] Final validation passed:", {
				targetTileIndex,
				tileValue: tiles[targetTileIndex],
			});
			moveTile(targetTileIndex, gapIndex);
		},
		[tiles, isWon, size, moveTile],
	);

	// ===== Event Handlers =====
	const handleTileClick = (index) => {
		handleTileSelect(index, null);
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
			handleTileSelect(null, event.key);
		},
		[handleTileSelect],
	);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [handleKeyPress]);

	// Touch/swipe controls
	const handleTouchStart = (e, tileIndex) => {
		const touch = e.touches[0];
		touchStartRef.current = {
			tileIndex,
			x: touch.clientX,
			y: touch.clientY,
			time: Date.now(),
		};
	};

	// Mouse drag controls - drag tile INTO the gap
	const handleMouseDown = (e, tileIndex) => {
		e.preventDefault(); // Prevent text selection while dragging
		mouseDragRef.current = {
			startTileIndex: tileIndex,
			startX: e.clientX,
			startY: e.clientY,
		};
	};

	const handleTouchEnd = (e, tileIndex) => {
		if (!touchStartRef.current) return;

		// Verify touch ended on same tile it started on
		if (touchStartRef.current.tileIndex !== tileIndex) {
			touchStartRef.current = null;
			return;
		}

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
			handleTileSelect(tileIndex, null);
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

		// Let handleTileSelect validate and execute the move
		handleTileSelect(tileIndex, direction);

		touchStartRef.current = null;
	};

	const handleMouseUpOnGap = () => {
		if (!mouseDragRef.current) return;

		const { startTileIndex } = mouseDragRef.current;

		// User dragged from a tile into the gap - move that tile
		handleTileSelect(startTileIndex, null);

		mouseDragRef.current = null;
	};

	const handleMouseUpAnywhere = () => {
		// Clear drag state if mouse is released anywhere else
		mouseDragRef.current = null;
	};

	// Global mouse up listener to handle mouse release anywhere
	useEffect(() => {
		window.addEventListener("mouseup", handleMouseUpAnywhere);
		return () =>
			window.removeEventListener("mouseup", handleMouseUpAnywhere);
	}, []);

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
						<Gap
							key="gap"
							position={position}
							tileSizePx={tileSizePx}
							onMouseUp={handleMouseUpOnGap}
						/>
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
						{...(isClickable && {
							onClick: () => handleTileClick(index),
							onTouchStart: (e) => handleTouchStart(e, index),
							onTouchEnd: (e) => handleTouchEnd(e, index),
							onMouseDown: (e) => handleMouseDown(e, index),
						})}
						showNumbers={showNumbers}
						position={position}
						tileSizePx={tileSizePx}
						animationDuration={ANIMATION_DURATION_MS}
					/>
				);
			})}
		</div>
	);
}

export default Board;
