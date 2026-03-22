import { useEffect, useState, useCallback, useMemo } from "react";
import Tile from "./Tile";
import Gap from "./Gap";
import {
	isAdjacent,
	getSolvedState,
	getGapIndex,
	swapTiles,
	checkWin,
	getTileIndexFromDirection,
	calcBoardSizePx,
} from "../../utils/gridHelpers";
import { createEmojiSvgUrl } from "../../utils/emoji";
import { playTileMoveSound } from "../../utils/sound";
import styles from "./Grid.module.css";

function Grid({
	size,
	grid,
	emoji,
	hasNumbersShown,
	hasSoundEnabled,
	onMove,
	onWin,
}) {
	// ===== State =====
	const [tiles, setTiles] = useState(grid);
	const [isSolved, setIsSolved] = useState(false);
	const [isInputBlocked, setIsInputBlocked] = useState(false);
	const [gridSizePx, setGridSizePx] = useState(() => calcBoardSizePx(size));

	// ===== Memoized Values =====
	// Create emoji SVG URL once and memoize it
	const emojiSvgUrl = useMemo(
		() => (emoji ? createEmojiSvgUrl(emoji) : null),
		[emoji],
	);

	// ===== Callbacks =====
	// Responsive grid size calculation (memoized)
	const getResponsiveGridSize = useCallback(
		() => calcBoardSizePx(size),
		[size],
	);

	// ===== Effects =====
	// Update grid size on window resize
	useEffect(() => {
		const handleResize = () => setGridSizePx(getResponsiveGridSize());
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [size, getResponsiveGridSize]); // size for clarity, getResponsiveGridSize for actual dependency

	// Reset grid when size or grid changes
	useEffect(() => {
		Promise.resolve().then(() => {
			setTiles(grid);
			setIsSolved(false);
			setIsInputBlocked(false);
		});
	}, [size, grid]);

	// ===== Tile Movement Logic =====
	// Get gap position (handles null/undefined tiles gracefully)
	const gapIndex = tiles ? getGapIndex(tiles) : -1;

	// Move tile - smooth animation via CSS transitions
	const moveTile = useCallback(
		(tileIndex) => {
			// Block input during animation
			if (isInputBlocked) {
				return;
			}

			setIsInputBlocked(true);

			const currentGapIndex = getGapIndex(tiles);
			const newTiles = swapTiles(tiles, tileIndex, currentGapIndex);

			// Update state (CSS transitions will handle smooth movement)
			setTiles(newTiles);

			// Notify parent for Firestore save
			onMove(newTiles);

			// Play tile move sound
			if (hasSoundEnabled) {
				playTileMoveSound();
			}

			// Check for win
			if (checkWin(newTiles, getSolvedState(size))) {
				setIsSolved(true);
				// Notify parent immediately that game is won
				onWin();
			}
		},
		[tiles, size, isInputBlocked, onMove, onWin, hasSoundEnabled],
	);

	// Validates tile selection and triggers movement if valid
	const handleTileSelect = useCallback(
		(tileIndex, direction = null) => {
			// Block if game won or input blocked
			if (isSolved || isInputBlocked) {
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
		[tiles, isSolved, isInputBlocked, size, moveTile],
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

			// Only process if input is not blocked
			if (!isInputBlocked && !isSolved) {
				handleTileSelect(null, event.key);
			}
		},
		[handleTileSelect, isInputBlocked, isSolved],
	);

	// Keyboard listener: Always attached to prevent scroll, but only processes when not blocked
	useEffect(() => {
		window.addEventListener("keydown", handleArrowKeyPress);
		return () => window.removeEventListener("keydown", handleArrowKeyPress);
	}, [handleArrowKeyPress]);

	// ===== Render =====
	// Don't render until we have valid tiles
	if (!tiles || !Array.isArray(tiles)) {
		return <div>Loading grid...</div>;
	}

	return (
		<div
			className={`${styles.grid}${isSolved ? " " + styles.won : ""}`}
			style={{
				width: `${gridSizePx}px`,
				height: `${gridSizePx}px`,
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
					!isSolved &&
					!isInputBlocked &&
					isAdjacent(gapIndex, index, size);

				return (
					<Tile
						key={value}
						tileNumber={value}
						isClickable={isClickable}
						hasNumbersShown={hasNumbersShown}
						emojiSvgUrl={emojiSvgUrl}
						gridSize={size}
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
