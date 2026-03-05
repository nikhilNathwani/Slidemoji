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
	isEntering,
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
	const [isGameWon, setIsGameWon] = useState(false);
	const [isInputBlocked, setIsInputBlocked] = useState(false);
	// Initialize prevPositions with initial tiles for FLIP animation
	const prevPositions = useRef([...tiles]);
	const boardRef = useRef(null);
	const touchStartRef = useRef(null);
	const mouseDragRef = useRef(null);
	const hasShownWin = useRef(false);
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
		const solvedTiles = getSolvedState(size);
		setTiles(solvedTiles);
		prevPositions.current = [...solvedTiles]; // Sync prevPositions
		setIsGameWon(true);
		hasShownWin.current = false;
	}, [size]);

	// Shuffle function - restart the puzzle with the same initial board
	const handleShuffle = useCallback(() => {
		// Use initialBoard if available (persistence mode), otherwise generate random
		const newTiles = initialBoard || scramblePuzzle(size);
		setTiles(newTiles);
		prevPositions.current = [...newTiles]; // Sync prevPositions
		setIsGameWon(false);
		hasShownWin.current = false;
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
		// Clear any pending state
		if (winDialogTimeoutRef.current) {
			clearTimeout(winDialogTimeoutRef.current);
			winDialogTimeoutRef.current = null;
		}
		setIsInputBlocked(false);
		// Use initialBoard or savedBoard if available, otherwise scramble
		// This triggers when user changes difficulty (3x3 <-> 4x4)
		let newTiles;
		if (savedBoard) {
			newTiles = savedBoard;
		} else if (initialBoard) {
			newTiles = initialBoard;
		} else {
			newTiles = scramblePuzzle(size);
		}
		setTiles(newTiles);
		prevPositions.current = [...newTiles]; // Sync prevPositions with new tiles
		setIsGameWon(false);
		hasShownWin.current = false;
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
		if (isGameWon && onWin && onShowWinDialog && !hasShownWin.current) {
			hasShownWin.current = true;
			// Call onWin immediately to trigger trophy transformation
			onWin();
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
	}, [isGameWon, onWin, onShowWinDialog]);

	// ===== Movement Logic =====
	const gapIndex = getGapIndex(tiles);

	// Move tile - FLIP technique for smooth animation
	const moveTile = useCallback(
		(tileIndex) => {
			const currentGapIndex = getGapIndex(tiles);
			const newTiles = swapTiles(tiles, tileIndex, currentGapIndex);

			// Store current positions before update (FLIP: First)
			prevPositions.current = [...tiles];
			console.log("[FLIP] Before move:", {
				tiles,
				newTiles,
				prevPositions: prevPositions.current,
			});

			// Update state immediately (FLIP: Last)
			setTiles(newTiles);

			// Check for win
			if (checkWin(newTiles, getSolvedState(size))) {
				setIsGameWon(true);
			}

			// Notify parent for Firestore save immediately (not after animation)
			if (onMove) {
				onMove(newTiles);
			}

			// Block input during animation
			setIsInputBlocked(true);

			// Note: isInputBlocked will be cleared by onTransitionEnd in Tile
		},
		[tiles, size, onMove],
	);

	// Validates tile selection and triggers movement if valid
	const handleTileSelect = useCallback(
		(tileIndex, direction = null) => {
			// Block if game won or input blocked
			if (isGameWon || isInputBlocked) {
				return;
			}

			const gapIndex = getGapIndex(tiles);
			let targetTileIndex;

			if (direction !== null) {
				// Keyboard/swipe: find tile in that direction from gap
				targetTileIndex = getTileIndexFromDirection(
					gapIndex,
					direction,
					size,
				);
				if (targetTileIndex === null) {
					return; // Invalid direction
				}
			} else {
				// Click/tap: tile index already known
				targetTileIndex = tileIndex;
			}

			moveTile(targetTileIndex);
		},
		[tiles, isGameWon, isInputBlocked, size, moveTile],
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
		// Only attach listener when input is not blocked
		if (!isInputBlocked && !isGameWon) {
			window.addEventListener("keydown", handleKeyPress);
			return () => window.removeEventListener("keydown", handleKeyPress);
		}
	}, [handleKeyPress, isInputBlocked, isGameWon]);

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
			className={`${styles.board}${isGameWon ? " " + styles.won : ""}`}
			style={{
				width: `${boardSizePx}px`,
				height: `${boardSizePx}px`,
			}}
		>
			{tiles.map((value, index) => {
				const isGap = value === null;

				if (isGap) {
					return (
						<Gap
							key="gap"
							index={index}
							size={size}
							tileSizePx={tileSizePx}
							onMouseUp={handleMouseUpOnGap}
						/>
					);
				}
				const isClickable =
					!isGameWon &&
					!isInputBlocked &&
					isAdjacent(gapIndex, index, size);

				// Find previous index for FLIP animation (Invert step)
				const prevIndex = prevPositions.current.indexOf(value);

				return (
					<Tile
						key={value}
						tileNumber={value}
						tileIndex={index}
						prevIndex={prevIndex}
						isClickable={isClickable}
						showNumbers={showNumbers}
						tileSizePx={tileSizePx}
						emojiSvgUrl={emojiSvgUrl}
						boardSize={size}
						isEntering={isEntering}
						isGameWon={isGameWon}
						onTransitionEnd={() => setIsInputBlocked(false)}
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
