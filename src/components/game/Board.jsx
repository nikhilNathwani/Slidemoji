import { useEffect, useState, useCallback, useMemo } from "react";
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
	calcBoardSizePx,
} from "../../utils/boardHelpers";
import { createEmojiSvgUrl } from "../../utils/emoji";
import { playTileMoveSound } from "../../utils/sound";
import styles from "./Board.module.css";

function Board({
	size,
	onWin,
	hasNumbersShown,
	emoji,
	// Persistence props - from Game component
	initialBoard, // Starting scrambled board for this puzzle+difficulty (from puzzle data)
	savedBoard, // User's saved progress (resume), or null for new game
	onMove, // Callback to notify parent when board changes (for Firestore saves)
	hasSoundEnabled,
}) {
	// ===== State =====
	// Initialize board state from savedBoard (resume) or initialBoard (new game)
	// Falls back to scramblePuzzle if neither provided (shouldn't happen in production)
	const [tiles, setTiles] = useState(() => {
		return savedBoard || initialBoard || scramblePuzzle(size);
	});
	const [isGameWon, setIsGameWon] = useState(false);
	const [isInputBlocked, setIsInputBlocked] = useState(false);
	const [boardSizePx, setBoardSizePx] = useState(() => calcBoardSizePx(size));

	// ===== Memoized Values =====
	// Create emoji SVG URL once and memoize it
	const emojiSvgUrl = useMemo(
		() => (emoji ? createEmojiSvgUrl(emoji) : null),
		[emoji],
	);

	// ===== Callbacks =====
	// Responsive board size calculation (memoized)
	const getResponsiveBoardSize = useCallback(
		() => calcBoardSizePx(size),
		[size],
	);

	// ===== Effects =====
	// Update board size on window resize
	useEffect(() => {
		const handleResize = () => setBoardSizePx(getResponsiveBoardSize());
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [size, getResponsiveBoardSize]); // size for clarity, getResponsiveBoardSize for actual dependency

	// Reset board when size, initialBoard, or savedBoard changes
	useEffect(() => {
		// Update board state (deferred to avoid cascading renders warning)
		Promise.resolve().then(() => {
			setTiles(savedBoard || initialBoard || scramblePuzzle(size));
			setIsGameWon(false);
			setIsInputBlocked(false);
		});
	}, [size, initialBoard, savedBoard]);

	// ===== Tile Movement Logic =====
	const gapIndex = getGapIndex(tiles);

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
				// Notify parent immediately that game is won
				onWin();
			}

			// Play tile move sound
			if (hasSoundEnabled) {
				playTileMoveSound();
			}

			// Notify parent for Firestore save
			onMove(newTiles);

			// Block input during animation (unblocked by onLayoutAnimationComplete)
			setIsInputBlocked(true);
		},
		[tiles, size, onMove, onWin, hasSoundEnabled],
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

	// Keyboard controls (arrow keys move tile FROM gap in that direction)
	const handleArrowKeyPress = useCallback(
		(event) => {
			const arrowKeys = [
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight",
			];
			if (!arrowKeys.includes(event.key)) return;

			// Prevent default behavior (scrolling the page)
			event.preventDefault();
			event.stopPropagation();
			handleTileSelect(null, event.key);
		},
		[handleTileSelect],
	);

	// Keyboard listener: Attach/detach based on game state
	useEffect(() => {
		// Only attach listener when input is not blocked
		if (!isInputBlocked && !isGameWon) {
			window.addEventListener("keydown", handleArrowKeyPress);
			return () =>
				window.removeEventListener("keydown", handleArrowKeyPress);
		}
	}, [handleArrowKeyPress, isInputBlocked, isGameWon]);

	// ===== Render =====
	return (
		<div
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
					return <Gap key="gap" />;
				}
				const isClickable =
					!isGameWon &&
					!isInputBlocked &&
					isAdjacent(gapIndex, index, size);

				return (
					<Tile
						key={value}
						tileNumber={value}
						isClickable={isClickable}
						hasNumbersShown={hasNumbersShown}
						emojiSvgUrl={emojiSvgUrl}
						boardSize={size}
						onTransitionEnd={() => setIsInputBlocked(false)}
						{...(isClickable && {
							onPointerDown: () => handleTileSelect(index, null),
						})}
					/>
				);
			})}
		</div>
	);
}

export default Board;
