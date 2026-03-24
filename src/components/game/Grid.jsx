import { useEffect, useState, useMemo, useRef } from "react";
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

	// Grid ref for auto-focus (enables arrow keys without clicking)
	const gridRef = useRef(null);

	// ===== Memoized Values =====
	// Create emoji SVG URL once and memoize it
	const emojiSvgUrl = useMemo(
		() => (emoji ? createEmojiSvgUrl(emoji) : null),
		[emoji],
	);

	// ===== Effects =====
	// Auto-focus grid on mount for immediate arrow key control
	useEffect(() => {
		gridRef.current?.focus();
	}, []);

	// Update grid size on window resize
	useEffect(() => {
		const handleResize = () => setGridSizePx(calcBoardSizePx(size));
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [size]);

	// ===== Tile Movement Logic =====
	// Get gap position (handles null/undefined tiles gracefully)
	const gapIndex = tiles ? getGapIndex(tiles) : -1;

	// Move tile (executes the move, checks for win)
	const moveTile = (tileIndex) => {
		const currentGapIndex = getGapIndex(tiles);
		const newTiles = swapTiles(tiles, tileIndex, currentGapIndex);

		setTiles(newTiles);
		onMove(newTiles);

		if (hasSoundEnabled) {
			playTileMoveSound();
		}

		if (checkWin(newTiles, getSolvedState(size))) {
			setIsSolved(true);
			onWin();
		}
	};

	// Arbiter: validates if move should happen, then executes
	const handleTileSelect = (tileIndex) => {
		if (isSolved) return;

		const gapIndex = getGapIndex(tiles);
		if (isAdjacent(gapIndex, tileIndex, size)) {
			moveTile(tileIndex);
		}
	};

	// Keyboard handler for arrow keys
	const handleKeyDown = (event) => {
		const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
		if (!arrowKeys.includes(event.key)) return;

		// Prevent arrow keys from scrolling the page
		event.preventDefault();

		if (isSolved) return;

		// Convert arrow key to target tile and move if valid
		const gapIndex = getGapIndex(tiles);
		const targetTileIndex = getTileIndexFromDirection(
			gapIndex,
			event.key,
			size,
		);

		if (
			targetTileIndex !== null &&
			isAdjacent(gapIndex, targetTileIndex, size)
		) {
			moveTile(targetTileIndex);
		}
	};

	// ===== Render =====
	// Don't render until we have valid tiles
	if (!tiles || !Array.isArray(tiles)) {
		return <div>Loading grid...</div>;
	}

	return (
		<div
			ref={gridRef}
			className={`${styles.grid}${isSolved ? " " + styles.won : ""}`}
			style={{
				width: `${gridSizePx}px`,
				height: `${gridSizePx}px`,
				gridTemplateColumns: `repeat(${size}, 1fr)`,
				gridTemplateRows: `repeat(${size}, 1fr)`,
			}}
			tabIndex={0}
			onKeyDown={handleKeyDown}
		>
			{tiles.map((value, index) => {
				const isGap = value === null;

				if (isGap) {
					return <Gap key="gap" />;
				}

				// Determine if tile should show as clickable (for UI/cursor feedback)
				const isClickable =
					!isSolved && isAdjacent(gapIndex, index, size);

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
