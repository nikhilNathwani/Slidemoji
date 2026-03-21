import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
	onWin,
	hasNumbersShown,
	emoji,
	grid, // The grid configuration to display
	onMove,
	hasSoundEnabled,
}) {
	// ===== State =====
	const [tiles, setTiles] = useState(grid);
	const [isGameWon, setIsGameWon] = useState(false);
	const [isInputBlocked, setIsInputBlocked] = useState(false);
	const [gridSizePx, setGridSizePx] = useState(() => calcBoardSizePx(size));

	// Use ref for synchronous blocking (prevents multiple tiles moving before React re-renders)
	const isInputBlockedRef = useRef(false);

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
			setIsGameWon(false);
			setIsInputBlocked(false);
			isInputBlockedRef.current = false; // Reset ref too
		});
	}, [size, grid]);

	// ===== Tile Movement Logic =====
	// Get gap position (handles null/undefined tiles gracefully)
	const gapIndex = tiles ? getGapIndex(tiles) : -1;

	// Move tile - smooth animation via CSS transitions
	const moveTile = useCallback(
		(tileIndex) => {
			// Prevent multiple tiles moving simultaneously during animation
			// Use ref for synchronous check (state updates are async)
			if (isInputBlockedRef.current) {
				return;
			}

			// Block input immediately (synchronous)
			isInputBlockedRef.current = true;
			setIsInputBlocked(true); // Also update state for UI reactivity

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

			// Only process if input is not blocked
			if (!isInputBlocked && !isGameWon) {
				handleTileSelect(null, event.key);
			}
		},
		[handleTileSelect, isInputBlocked, isGameWon],
	);

	// Keyboard listener: Always attached to prevent scroll, but only processes when not blocked
	useEffect(() => {
		window.addEventListener("keydown", handleArrowKeyPress);
		return () => window.removeEventListener("keydown", handleArrowKeyPress);
	}, [handleArrowKeyPress]);

	// ===== Render =====
	return (
		<div
			className={`${styles.grid}${isGameWon ? " " + styles.won : ""}`}
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
						gridSize={size}
						onTransitionEnd={() => {
							isInputBlockedRef.current = false; // Unblock synchronously
							setIsInputBlocked(false); // Update state for UI
						}}
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
