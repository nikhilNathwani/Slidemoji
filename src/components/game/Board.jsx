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
import {
	BOARD_VIEWPORT_PADDING,
	BOARD_RIDGE_BORDER,
	BOARD_MAX_SIZE,
	WIN_DIALOG_DELAY_MS,
	MIN_SWIPE_DISTANCE,
	MAX_SWIPE_TIME_MS,
} from "../../constants";
import { createEmojiSvgUrl } from "../../utils/emoji";
import { playTileMoveSound } from "../../utils/sound";
import styles from "./Board.module.css";

// ===== Main Component =====

function Board({
	size,
	onWin,
	onShowWinDialog,
	showNumbers,
	onSolveRef,
	onRestartRef,
	dailyEmoji,
	// Persistence props - from Game component
	initialBoard, // The starting board from Firestore (for this puzzle+difficulty)
	savedBoard, // Previously saved board state (resume game), or null for new game
	onMove, // Callback to notify parent when board changes (for Firestore saves)
	soundEnabled, // Whether to play sound effects
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
		console.log("Falling back to random scramble");
		return scramblePuzzle(size); // Fallback (shouldn't happen)
	});
	const [isGameWon, setIsGameWon] = useState(false);
	const [isInputBlocked, setIsInputBlocked] = useState(false);
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
		const maxContentSize = Math.min(
			window.innerWidth - BOARD_VIEWPORT_PADDING - BOARD_RIDGE_BORDER,
			BOARD_MAX_SIZE,
		);
		// Ensure content area is divisible by grid size for perfect tile sizing
		return Math.floor(maxContentSize / size) * size;
	}, [size]);

	const [boardSizePx, setBoardSizePx] = useState(getResponsiveBoardSize);

	// Update board size on window resize
	useEffect(() => {
		const handleResize = () => setBoardSizePx(getResponsiveBoardSize());
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [getResponsiveBoardSize]);

	// Solve function
	const handleSolve = useCallback(() => {
		const solvedTiles = getSolvedState(size);
		setTiles(solvedTiles);
		setIsGameWon(true);
		hasShownWin.current = false;
	}, [size]);

	// Restart function - reset puzzle with the same initial board
	const handleRestart = useCallback(() => {
		// Use initialBoard if available (persistence mode), otherwise generate random
		const newTiles = initialBoard || scramblePuzzle(size);
		setTiles(newTiles);
		setIsGameWon(false);
		hasShownWin.current = false;
	}, [size, initialBoard]);

	// Expose solve/restart functions to parent via refs (for Settings dialog buttons)
	// This enables imperative calls: Game -> Board -> handleSolve/handleRestart
	useEffect(() => {
		if (onSolveRef) {
			onSolveRef.current = handleSolve;
		}
		if (onRestartRef) {
			onRestartRef.current = handleRestart;
		}
	}, [handleSolve, handleRestart, onSolveRef, onRestartRef]);

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
		setIsGameWon(false);
		hasShownWin.current = false;
	}, [size, initialBoard, savedBoard]);

	// Show win dialog after delay (allows trophy transformation and celebration)
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
			}, WIN_DIALOG_DELAY_MS);
		}
	}, [isGameWon, onWin, onShowWinDialog]);

	// ===== Movement Logic =====
	const gapIndex = getGapIndex(tiles);

	// Unblock input (called by Tile's onLayoutAnimationComplete)
	const unblockInput = useCallback(() => {
		setIsInputBlocked(false);
	}, []);

	// Move tile - smooth animation via CSS transitions
	const moveTile = useCallback(
		(tileIndex) => {
			const currentGapIndex = getGapIndex(tiles);
			const newTiles = swapTiles(tiles, tileIndex, currentGapIndex);

			// Update state (CSS transitions will handle smooth movement)
			setTiles(newTiles);

			// Check for win
			if (checkWin(newTiles, getSolvedState(size))) {
				setIsGameWon(true);
			}

			// Play tile move sound
			if (soundEnabled) {
				playTileMoveSound();
			}

			// Notify parent for Firestore save immediately (not after animation)
			if (onMove) {
				onMove(newTiles);
			}

			// Block input during animation (unblocked by onLayoutAnimationComplete)
			setIsInputBlocked(true);
		},
		[tiles, size, onMove, soundEnabled],
	);

	// Validates tile selection and triggers movement if valid
	const handleTileSelect = useCallback(
		(tileIndex, direction = null) => {
			// Block if game won or input blocked
			if (isGameWon || isInputBlocked) {
				return;
			}

			const gapIndex = getGapIndex(tiles);

			// For keyboard controls: find tile in direction from gap
			if (direction !== null && tileIndex === null) {
				const targetTileIndex = getTileIndexFromDirection(
					gapIndex,
					direction,
					size,
				);
				if (targetTileIndex !== null) {
					moveTile(targetTileIndex);
				}
				return;
			}

			// For click/tap/swipe: verify tile is adjacent to gap before moving
			if (tileIndex !== null && isAdjacent(gapIndex, tileIndex, size)) {
				moveTile(tileIndex);
			}
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

	// Keyboard listener: Attach/detach based on game state
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

		// Tap or swipe on tile - will only move if adjacent to gap
		handleTileSelect(tileIndex, null);
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

	// Global mouse up listener: Handle mouse release anywhere
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
				gridTemplateColumns: `repeat(${size}, 1fr)`,
				gridTemplateRows: `repeat(${size}, 1fr)`,
			}}
		>
			{tiles.map((value, index) => {
				const isGap = value === null;

				if (isGap) {
					return <Gap key="gap" onMouseUp={handleMouseUpOnGap} />;
				}
				const isClickable =
					!isGameWon &&
					!isInputBlocked &&
					isAdjacent(gapIndex, index, size);

				return (
					<Tile
						key={value}
						tileNumber={value}
						tileIndex={index}
						isClickable={isClickable}
						showNumbers={showNumbers}
						emojiSvgUrl={emojiSvgUrl}
						boardSize={size}
						isGameWon={isGameWon}
						onTransitionEnd={unblockInput}
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
