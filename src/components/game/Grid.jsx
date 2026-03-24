import { useEffect, useState, useMemo, useCallback } from "react";
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
	grid,
	emoji,
	hasNumbersShown,
	hasSoundEnabled,
	onMove,
	onWin,
	isDialogOpen = false,
}) {
	const gridSize = Math.floor(Math.sqrt(grid?.length || 9));
	const isSolved = checkWin(grid, getSolvedState(gridSize));

	// ===== State =====
	const [gridSizePx, setGridSizePx] = useState(() =>
		calcBoardSizePx(gridSize),
	);

	// ===== Memoized Values =====
	// Create emoji SVG URL once and memoize it
	const emojiSvgUrl = useMemo(
		() => (emoji ? createEmojiSvgUrl(emoji) : null),
		[emoji],
	);

	// ===== Tile Movement Logic =====
	// Get gap position (handles null/undefined grid gracefully)
	const gapIndex = grid ? getGapIndex(grid) : -1;

	// Move tile (executes the move, checks for win)
	const moveTile = useCallback(
		(tileIndex) => {
			const currentGapIndex = getGapIndex(grid);
			const newGrid = swapTiles(grid, tileIndex, currentGapIndex);

			onMove(newGrid); // Parent updates state, flows back as prop

			if (hasSoundEnabled) {
				playTileMoveSound();
			}

			if (checkWin(newGrid, getSolvedState(gridSize))) {
				onWin();
			}
		},
		[grid, gridSize, onMove, hasSoundEnabled, onWin],
	);

	// Arbiter: validates if move should happen, then executes
	const handleTileSelect = useCallback(
		(tileIndex) => {
			if (isDialogOpen) return; // Block moves when dialogs are shown
			if (isSolved) return;

			const gapIndex = getGapIndex(grid);
			if (isAdjacent(gapIndex, tileIndex, gridSize)) {
				moveTile(tileIndex);
			}
		},
		[isDialogOpen, isSolved, grid, gridSize, moveTile],
	);

	// ===== Effects =====
	// Update grid size on window resize
	useEffect(() => {
		const handleResize = () => setGridSizePx(calcBoardSizePx(gridSize));
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [gridSize]);

	// Keyboard listener: works globally regardless of focus
	useEffect(() => {
		const handleKeyDown = (event) => {
			const arrowKeys = [
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight",
			];
			if (!arrowKeys.includes(event.key)) return;

			// Convert arrow key to target tile index
			const gapIndex = getGapIndex(grid);
			const targetTileIndex = getTileIndexFromDirection(
				gapIndex,
				event.key,
				gridSize,
			);

			// Let handleTileSelect do all validation
			if (targetTileIndex !== null) {
				handleTileSelect(targetTileIndex);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [grid, gridSize, handleTileSelect]);

	// ===== Render ===
	// Don't render until we have valid grid
	if (!grid || !Array.isArray(grid)) {
		return <div>Loading grid...</div>;
	}

	return (
		<div
			className={`${styles.grid}${isSolved ? " " + styles.won : ""}`}
				style={{
					width: `${gridSizePx}px`,
					height: `${gridSizePx}px`,
					gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
					gridTemplateRows: `repeat(${gridSize}, 1fr)`,
				}}
		>
			{grid.map((value, index) => {
				const isGap = value === null;

				if (isGap) {
					return <Gap key="gap" />;
				}

				// Determine if tile should show as clickable (for UI/cursor feedback)
				const isClickable =
					!isSolved && isAdjacent(gapIndex, index, gridSize);

				return (
					<Tile
						key={value}
						tileNumber={value}
						isClickable={isClickable}
						hasNumbersShown={hasNumbersShown}
						emojiSvgUrl={emojiSvgUrl}
						gridSize={gridSize}
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
