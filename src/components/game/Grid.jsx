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

	const [gridSizePx, setGridSizePx] = useState(() =>
		calcBoardSizePx(gridSize),
	);

	const emojiSvgUrl = useMemo(
		() => (emoji ? createEmojiSvgUrl(emoji) : null),
		[emoji],
	);

	const gapIndex = grid ? getGapIndex(grid) : -1;

	const moveTile = useCallback(
		(tileIndex) => {
			const currentGapIndex = getGapIndex(grid);
			const newGrid = swapTiles(grid, tileIndex, currentGapIndex);

			onMove(newGrid);

			if (hasSoundEnabled) {
				playTileMoveSound();
			}

			if (checkWin(newGrid, getSolvedState(gridSize))) {
				onWin();
			}
		},
		[grid, gridSize, onMove, hasSoundEnabled, onWin],
	);

	const handleTileSelect = useCallback(
		(tileIndex) => {
			if (isDialogOpen) return;
			if (isSolved) return;

			const gapIndex = getGapIndex(grid);
			if (isAdjacent(gapIndex, tileIndex, gridSize)) {
				moveTile(tileIndex);
			}
		},
		[isDialogOpen, isSolved, grid, gridSize, moveTile],
	);

	useEffect(() => {
		const handleResize = () => setGridSizePx(calcBoardSizePx(gridSize));
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [gridSize]);

	// Global keyboard controls - arrow keys work regardless of focus
	useEffect(() => {
		const handleKeyDown = (event) => {
			const arrowKeys = [
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight",
			];
			if (!arrowKeys.includes(event.key)) return;

			const gapIndex = getGapIndex(grid);
			const targetTileIndex = getTileIndexFromDirection(
				gapIndex,
				event.key,
				gridSize,
			);

			if (targetTileIndex !== null) {
				handleTileSelect(targetTileIndex);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [grid, gridSize, handleTileSelect]);

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

				const isClickable =
					!isSolved && isAdjacent(gapIndex, index, gridSize);

				return (
					<Tile
						key={value}
						tileNumber={value}
						gridSize={gridSize}
						emojiSvgUrl={emojiSvgUrl}
						isClickable={isClickable}
						hasNumbersShown={hasNumbersShown}
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
