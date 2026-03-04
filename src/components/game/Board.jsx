import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Tile from "./Tile";
import Gap from "./Gap";
import { isAdjacent } from "../../utils/adjacency";
import {
	getSolvedState,
	getGapIndex,
	swapTiles,
	checkWin,
	scramblePuzzle,
	getTilePosition,
	getTileIndexFromDirection,
} from "../../utils/boardHelpers";
import { createEmojiSvgUrl } from "../../utils/emoji";
import { ANIMATION_DURATION_MS } from "../../constants";
import styles from "./Board.module.css";

// ===== Main Component =====

function Board({
	size,
	onWin,
	onShowWinDialog,
	showNumbers,
	onSolveRef,
	onShuffleRef,
	dailyEmoji,
	playingEntranceAnimation,
	// Persistence props - from Game component
	initialBoard, // The starting board from Firestore (for this puzzle+difficulty)
	savedBoard, // Previously saved board state (resume game), or null for new game
	onMove, // Callback to notify parent when board changes (for Firestore saves)
}) {
	// Initialize board state from savedBoard (resume) or initialBoard (new game)
	// Falls back to scramblePuzzle if neither provided (shouldn't happen in production)
	const [tiles, setTiles] = useState(() => {
		if (savedBoard) {
			return savedBoard; // Resume from saved state
		}
		if (initialBoard) {
			return initialBoard; // Start fresh with provided board
		}
		return scramblePuzzle(size); // Fallback (shouldn't happen)
	});
	const [isWon, setIsWon] = useState(false);
	const [celebrating, setCelebrating] = useState(false);
	const [movingTileValue, setMovingTileValue] = useState(null);
	const [isInteractionEnabled, setIsInteractionEnabled] = useState(true);
	const boardRef = useRef(null);
	const touchStartRef = useRef(null);
	const mouseDragRef = useRef(null);
	const isAnimatingRef = useRef(false); // Immediate flag to prevent rapid inputs
	const hasShownWin = useRef(false);
	const moveTimeoutRef = useRef(null);
	const winDialogTimeoutRef = useRef(null);

	// Create emoji SVG URL once and memoize it
	const emojiSvgUrl = useMemo(
		() => (dailyEmoji ? createEmojiSvgUrl(dailyEmoji) : null),
		[dailyEmoji],
	);

	// Responsive sizing
	const getResponsiveBoardSize = useCallback(() => {
		// padding is 20px on each side of viewport (40 total)
		// With content-box, width/height we set is the content area (tiles)
		// Ridge border (8px each side) is added outside
		const viewportPadding = 40;
		const ridgeBorder = 16; // 8px each side, added outside content
		const maxContentSize = Math.min(
			window.innerWidth - viewportPadding - ridgeBorder,
			456, // 5% smaller than previous 480
		);
		// Ensure content area is divisible by grid size for perfect tile sizing
		return Math.floor(maxContentSize / size) * size;
	}, [size]);

	const [boardSizePx, setBoardSizePx] = useState(getResponsiveBoardSize());
	const tileSizePx = boardSizePx / size;

	// Solve function
	const handleSolve = useCallback(() => {
		setTiles(getSolvedState(size));
		setIsWon(true);
		hasShownWin.current = false;
		setCelebrating(true);
	}, [size]);

	// Shuffle function - restart the puzzle with the same initial board
	const handleShuffle = useCallback(() => {
		// Use initialBoard if available (persistence mode), otherwise generate random
		setTiles(initialBoard || scramblePuzzle(size));
		setIsWon(false);
		hasShownWin.current = false;
		setCelebrating(false);
	}, [size, initialBoard]);

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
		// Clear any pending timeouts to prevent race conditions
		if (moveTimeoutRef.current) {
			clearTimeout(moveTimeoutRef.current);
			moveTimeoutRef.current = null;
		}
		if (winDialogTimeoutRef.current) {
			clearTimeout(winDialogTimeoutRef.current);
			winDialogTimeoutRef.current = null;
		}
		setIsInteractionEnabled(true);
		isAnimatingRef.current = false;
		setMovingTileValue(null);
		// Use initialBoard or savedBoard if available, otherwise scramble
		// This triggers when user changes difficulty (3x3 <-> 4x4)
		if (savedBoard) {
			setTiles(savedBoard);
		} else if (initialBoard) {
			setTiles(initialBoard);
		} else {
			setTiles(scramblePuzzle(size));
		}
		setIsWon(false);
		hasShownWin.current = false;
		setCelebrating(false);
	}, [size, initialBoard, savedBoard]);

	// Handle window resize
	useEffect(() => {
		const handleResize = () => {
			setBoardSizePx(getResponsiveBoardSize());
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [getResponsiveBoardSize]);

	// Show win dialog (only once per win) - delayed to allow trophy transformation and celebration
	useEffect(() => {
		if (isWon && onWin && onShowWinDialog && !hasShownWin.current) {
			hasShownWin.current = true;
			// Call onWin immediately to trigger trophy transformation
			onWin();
			// Start celebration
			setCelebrating(true);
			// Delay to show trophy transformation and celebration before dialog
			// Clear any existing timeout
			if (winDialogTimeoutRef.current) {
				clearTimeout(winDialogTimeoutRef.current);
			}
			winDialogTimeoutRef.current = setTimeout(() => {
				onShowWinDialog();
				winDialogTimeoutRef.current = null;
			}, 2500); // Delay win dialog by 2500ms to allow celebration and trophy transformation
		}
	}, [isWon, onWin, onShowWinDialog]);

	// ===== Movement Logic =====
	const gapIndex = getGapIndex(tiles);

	// Core tile movement function - assumes all validation has passed
	const moveTile = useCallback(
		(tileIndex) => {
			// Get current gap index from tiles state
			const currentGapIndex = getGapIndex(tiles);
			const tileValue = tiles[tileIndex];

			// Calculate new board state
			const newTiles = swapTiles(tiles, tileIndex, currentGapIndex);

			// CRITICAL: Disable interaction immediately using BOTH ref and state
			// - Ref blocks same-loop rapid inputs (synchronous)
			// - State removes event listeners on next render (asynchronous)
			isAnimatingRef.current = true;
			setMovingTileValue(tileValue);
			setIsInteractionEnabled(false);

			// Force browser repaint before updating tile positions
			// This ensures CSS transition triggers properly for ALL directions
			// Without this, React updates too fast and skips the transition
			requestAnimationFrame(() => {
				// Now update tile positions - CSS will animate the change
				setTiles(newTiles);

				// Check for win
				if (checkWin(newTiles, getSolvedState(size))) {
					setIsWon(true);
				}
			});

			// Clear any existing timeout
			if (moveTimeoutRef.current) {
				clearTimeout(moveTimeoutRef.current);
			}

			// Re-enable interaction and notify parent AFTER animation completes
			moveTimeoutRef.current = setTimeout(() => {
				isAnimatingRef.current = false;
				setIsInteractionEnabled(true);
				setMovingTileValue(null);
				moveTimeoutRef.current = null;

				// Notify parent component of board change (for persistence)
				// This triggers saveGameState in Game.jsx to update Firestore
				if (onMove) {
					onMove(newTiles);
				}
			}, ANIMATION_DURATION_MS);
		},
		[tiles, size, onMove],
	);

	// Validates tile selection and triggers movement if valid
	// Supports two modes:
	// 1. Direct tile selection: handleTileSelect(tileIndex, null)
	//    - Handlers only attached to gap-adjacent tiles, so no need to re-check
	// 2. Directional movement: handleTileSelect(null, direction)
	//    - Must validate the tile in that direction exists and is valid
	const handleTileSelect = useCallback(
		(tileIndex, direction = null) => {
			// Exit early if game is won or animation is in progress
			// Check ref first (synchronous) to block rapid inputs in same event loop
			if (isWon || isAnimatingRef.current) {
				return;
			}

			const gapIndex = getGapIndex(tiles);
			let targetTileIndex;

			if (direction !== null) {
				// Direction-based movement (keyboard/swipe)
				targetTileIndex = getTileIndexFromDirection(
					gapIndex,
					direction,
					size,
				);
				if (targetTileIndex === null) {
					return; // Invalid direction (e.g., trying to move up when gap is at top)
				}
			} else {
				// Direct tile selection (click/tap/drag)
				// No additional validation needed - handlers only attached to gap-adjacent tiles
				targetTileIndex = tileIndex;
			}

			// All checks passed - move the tile
			moveTile(targetTileIndex);
		},
		[tiles, isWon, size, moveTile],
	);

	// ===== Event Handlers =====
	const handleTileClick = (index) => {
		handleTileSelect(index, null);
	};

	// Keyboard controls - only active when interaction is enabled
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
		// Only attach keyboard listener when interaction is enabled
		// This is the "startInteraction/stopInteraction" pattern from Trigram
		if (isInteractionEnabled && !isWon) {
			window.addEventListener("keydown", handleKeyPress);
			return () => window.removeEventListener("keydown", handleKeyPress);
		}
	}, [handleKeyPress, isInteractionEnabled, isWon]);

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
			className={`${styles.board}${isWon ? " " + styles.won : ""}`}
			style={{
				width: `${boardSizePx}px`,
				height: `${boardSizePx}px`,
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
					isInteractionEnabled &&
					isAdjacent(gapIndex, index, size);

				return (
					<Tile
						key={value}
						tileNumber={value}
						isMoving={isMoving}
						isClickable={isClickable}
						showNumbers={showNumbers}
						position={position}
						tileSizePx={tileSizePx}
						animationDuration={ANIMATION_DURATION_MS}
						emojiSvgUrl={emojiSvgUrl}
						boardSize={size}
						playingEntranceAnimation={playingEntranceAnimation}
						entranceDelay={index * 50}
						celebrating={celebrating}
						celebrationDelay={index * 60}
						isWon={isWon}
						{...(isClickable && {
							onClick: () => handleTileClick(index),
							onTouchStart: (e) => handleTouchStart(e, index),
							onTouchEnd: (e) => handleTouchEnd(e, index),
							onMouseDown: (e) => handleMouseDown(e, index),
						})}
					/>
				);
			})}
		</div>
	);
}

export default Board;
