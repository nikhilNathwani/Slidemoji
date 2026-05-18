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
import { useCanonicalMap } from "../../hooks/useEquivalentTiles";
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
	const canonicalMap = useCanonicalMap(emoji, gridSize);
	const isSolved = checkWin(grid, canonicalMap);
	// Tiles the analysis deemed blank (canonical 0) are rendered without the emoji
	// so that even tiny edge slivers don't appear, making the blank status unambiguous.
	const blankTileValues = useMemo(
		() =>
			new Set(
				[...canonicalMap.entries()]
					.filter(([, c]) => c === 0)
					.map(([t]) => t),
			),
		[canonicalMap],
	);

	const [gridSizePx, setGridSizePx] = useState(() =>
		calcBoardSizePx(gridSize),
	);

	// Tracks whether the win happened interactively this session (not on page load)
	const [isJustSolved, setIsJustSolved] = useState(false);
	// True once the user has made at least one move this session. Guards the
	// late-canonicalMap effect from re-triggering a win on page load.
	const [hasMoved, setHasMoved] = useState(false);
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

	// Handle the case where the winning move was made before canvas analysis
	// finished (canonicalMap was empty). When it populates, re-check the current
	// grid. Only fires for new wins this session — hasMoved guards against
	// re-triggering the win animation for a puzzle already solved in a prior session.
	useEffect(() => {
		if (canonicalMap.size === 0) return;
		if (isJustSolved) return;
		if (!hasMoved) return;
		if (grid && checkWin(grid, canonicalMap)) {
			setHadNumbersOnSolve(hasNumbersShown);
			setIsJustSolved(true);
			onWin();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [canonicalMap]);

	const moveTile = useCallback(
		(tileIndex) => {
			const currentGapIndex = getGapIndex(grid);
			const newGrid = swapTiles(grid, tileIndex, currentGapIndex);

			setHasMoved(true);
			onMove(newGrid);

			if (hasSoundEnabled) {
				playTileMoveSound();
			}

			if (checkWin(newGrid, canonicalMap)) {
				setHadNumbersOnSolve(hasNumbersShown);
				setIsJustSolved(true);
				onWin();
			}
		},
		[grid, onMove, hasSoundEnabled, onWin, hasNumbersShown, canonicalMap],
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

	const calcTilePosition = (index) => ({
		x: (index % gridSize) * tileSize,
		y: Math.floor(index / gridSize) * tileSize,
	});

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
			{/* Rendered in stable value order [1…N²-1, gap] so React never reorders
			    DOM nodes — only the transform prop changes, so CSS transitions fire
			    correctly for all directions. key={value} keeps the same DOM node per tile. */}
			{Array.from({ length: gridSize * gridSize - 1 }, (_, i) => i + 1)
				.concat(0)
				.map((value) => {
					const index = grid.indexOf(value);
					const { x, y } = calcTilePosition(index);

					if (value === 0) {
						return (
							<Tile
								key="gap"
								isGap={true}
								x={x}
								y={y}
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
							emojiSvgUrl={
								blankTileValues.has(value) ? null : emojiSvgUrl
							}
							isClickable={isClickable}
							hasNumbersShown={numbersVisible}
							celebrating={celebrating}
							celebrationDelay={
								WIN_TILE_ANIM_START_DELAY_MS +
								index * WIN_TILE_ANIM_STAGGER_MS
							}
							x={x}
							y={y}
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
