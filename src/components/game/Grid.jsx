import { useEffect, useState, useMemo, useCallback } from "react";
import Tile from "./Tile";
import {
	isAdjacent,
	getGapIndex,
	swapTiles,
	checkWin,
	getTileIndexFromDirection,
	calcBoardSizePx,
} from "../../utils/gridHelpers";
import { createEmojiSvgUrl } from "../../utils/emoji";
import { playTileMoveSound } from "../../utils/sound";
import {
	WIN_TILE_ANIM_START_DELAY_MS,
	WIN_TILE_ANIM_STAGGER_MS,
	WIN_TILE_ANIM_DURATION_MS,
} from "../../utils/constants";
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
	const isSolved = checkWin(grid);

	const [gridSizePx, setGridSizePx] = useState(() =>
		calcBoardSizePx(gridSize),
	);

	// Tracks whether the win happened interactively this session (not on page load)
	const [isJustSolved, setIsJustSolved] = useState(false);
	// Captures whether numbers were visible at the moment of the win, so spans
	// stay mounted during the numberFade animation instead of disappearing instantly.
	const [hadNumbersOnSolve, setHadNumbersOnSolve] = useState(false);

	// Derive celebrating: if the puzzle was reset (sign-out, restart, difficulty change),
	// isSolved becomes false and this automatically turns off without a setState-in-effect.
	const celebrating = isJustSolved && isSolved;

	// Reset celebrating after all tile pop animations complete.
	// This removes the CSS animation from tiles, releasing their compositing layers
	// so they render at maximum sharpness in the solved state.
	useEffect(() => {
		if (!celebrating) return;
		// Last real tile is at grid index (gridSize²-2) since gap occupies the last index.
		const totalMs =
			WIN_TILE_ANIM_START_DELAY_MS +
			(gridSize * gridSize - 2) * WIN_TILE_ANIM_STAGGER_MS +
			WIN_TILE_ANIM_DURATION_MS +
			150; // buffer
		const id = setTimeout(() => setIsJustSolved(false), totalMs);
		return () => clearTimeout(id);
	}, [celebrating, gridSize]);

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

			if (checkWin(newGrid)) {
				setHadNumbersOnSolve(hasNumbersShown);
				setIsJustSolved(true);
				onWin();
			}
		},
		[grid, onMove, hasSoundEnabled, onWin, hasNumbersShown],
	);

	const handleTileSelect = useCallback(
		(tileIndex) => {
			if (isDialogOpen) return;
			if (isSolved) return;

			const gapIndex = getGapIndex(grid);
			if (isAdjacent(gridSize, gapIndex, tileIndex)) {
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

	// Keep number spans mounted during the win celebration so numberFade can play.
	// Once celebrating ends, spans unmount cleanly.
	const numbersVisible =
		hasNumbersShown || (celebrating && hadNumbersOnSolve);

	// calcBoardSizePx guarantees gridSizePx is divisible by gridSize, so tileSize is always an integer.
	const tileSize = gridSizePx / gridSize;

	// Pre-compute pixel position for every grid index. Derived entirely from
	// tileSize + gridSize so no per-tile math is needed in Tile.
	const positions = Array.from({ length: gridSize * gridSize }, (_, i) => ({
		x: (i % gridSize) * tileSize,
		y: Math.floor(i / gridSize) * tileSize,
	}));

	// Build a map from tile value → current grid index so we can render tiles
	// in stable value order (1…N-1, then gap). Stable DOM order is essential:
	// if tiles render in grid-index order, React moves DOM nodes when a tile
	// shifts to a higher index, which resets the CSS transition and causes the
	// tile to snap instead of animate.
	const valueToIndex = {};
	grid.forEach((value, index) => {
		valueToIndex[value] = index;
	});

	// Stable value list: 1…(N²-1) then 0 (gap) — never changes order.
	const tileValues = Array.from(
		{ length: gridSize * gridSize - 1 },
		(_, i) => i + 1,
	).concat(0);

	if (!grid || !Array.isArray(grid)) {
		return <div>Loading grid...</div>;
	}

	return (
		<div
			className={styles.grid}
			style={{
				width: `${gridSizePx}px`,
				height: `${gridSizePx}px`,
			}}
		>
			{tileValues.map((value) => {
				const index = valueToIndex[value];
				const pos = positions[index];

				if (value === 0) {
					return (
						<Tile
							key="gap"
							isGap={true}
							x={pos.x}
							y={pos.y}
							tileSize={tileSize}
						/>
					);
				}

				const isClickable =
					!isSolved && isAdjacent(gridSize, gapIndex, index);

				return (
					<Tile
						key={value}
						tileNumber={value}
						gridSize={gridSize}
						emojiSvgUrl={emojiSvgUrl}
						isClickable={isClickable}
						hasNumbersShown={numbersVisible}
						celebrating={celebrating}
						celebrationDelay={
							WIN_TILE_ANIM_START_DELAY_MS +
							index * WIN_TILE_ANIM_STAGGER_MS
						}
						x={pos.x}
						y={pos.y}
						tileSize={tileSize}
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
