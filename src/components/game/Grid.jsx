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
	const [isSolved, setIsSolved] = useState(() =>
		checkWin(grid, getSolvedState(size)),
	);
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
	}, [size, getResponsiveGridSize]);

	// Sync state when grid prop changes (e.g., loading different puzzle)
	useEffect(() => {
		setTiles(grid);
		setIsSolved(checkWin(grid, getSolvedState(size)));
	}, [size, grid]);

	// ===== Tile Movement Logic =====
	// Get gap position (handles null/undefined tiles gracefully)
	const gapIndex = tiles ? getGapIndex(tiles) : -1;

	// Move tile (no validation, just executes the move)
	const moveTile = useCallback(
		(tileIndex) => {
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
		[tiles, size, onMove, onWin, hasSoundEnabled],
	);

	// Arbiter: validates and decides if move should happen
	const handleTileSelect = useCallback(
		(tileIndex) => {
			// Block if puzzle is solved
			if (isSolved) {
				return;
			}

			const gapIndex = getGapIndex(tiles);

			// Verify tile is adjacent to gap before moving
			// Note: tileIndex can be null from keyboard handler if move is invalid
			if (tileIndex !== null && isAdjacent(gapIndex, tileIndex, size)) {
				moveTile(tileIndex);
			}
		},
		[tiles, isSolved, size, moveTile],
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

			// Convert arrow key direction to target tile index
			const gapIndex = getGapIndex(tiles);
			const targetTileIndex = getTileIndexFromDirection(
				gapIndex,
				event.key,
				size,
			);

			if (targetTileIndex !== null) {
				handleTileSelect(targetTileIndex);
			}
		},
		[tiles, size, handleTileSelect],
	);

	// Keyboard listener: Always attached to prevent scroll
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

				// Determine if tile should show as clickable (for UI/cursor feedback)
				const isClickable = !isSolved && isAdjacent(gapIndex, index, size);

				return (
					<Tile
						key={value}
						tileNumber={value}
						isClickable={isClickable}
						hasNumbersShown={hasNumbersShown}
						emojiSvgUrl={emojiSvgUrl}
						gridSize={size}
						{...(isClickable && {
							onPointerDown: () => handleTileSelect(index),
						})}
					/>
				);
			})}
		</div>
	);
}

export default Grid;
