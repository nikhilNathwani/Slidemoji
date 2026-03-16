import { useEffect, useState, useCallback, useMemo } from "react";
import Tile from "./Tile";
import Gap from "./Gap";
import { isAdjacent } from "../../utils/adjacency";
import {
	getSolvedState,
	getGapIndex,
	swapTiles,
	checkWin,
	getTileIndexFromDirection,
	calcBoardSizePx,
} from "../../utils/boardHelpers";
import { createEmojiSvgUrl } from "../../utils/emoji";
import { playTileMoveSound } from "../../utils/sound";
import styles from "./Grid.module.css";

function Grid({
	size,
	onWin,
	hasNumbersShown,
	emoji,
	board, // The board configuration to display
	onMove,
	hasSoundEnabled,
}) {
	// ===== State =====
	const [tiles, setTiles] = useState(board);
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

	// Reset board when size or board changes
	useEffect(() => {
		Promise.resolve().then(() => {
			setTiles(board);
			setIsGameWon(false);
			setIsInputBlocked(false);
		});
	}, [size, board]);

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

export default Grid;
