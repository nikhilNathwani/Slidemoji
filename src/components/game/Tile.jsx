import styles from "./Tile.module.css";
import { useRef } from "react";
import { getTilePosition as calculateTilePixelPosition } from "../../utils/boardHelpers";

// ===== Helper Functions =====

// Calculate which grid position the tile should be in based on its value
function getTilePosition(value, boardSize) {
	const position = value - 1; // Convert 1-8 to 0-7
	const row = Math.floor(position / boardSize);
	const col = position % boardSize;
	return { row, col };
}

// Calculate background positioning percentages for pixel-perfect alignment
function getBackgroundStyles(row, col, boardSize) {
	const bgSizePercent = boardSize * 100; // 200% for 2x2, 300% for 3x3, 400% for 4x4
	const bgPosXPercent = (col / (boardSize - 1)) * 100;
	const bgPosYPercent = (row / (boardSize - 1)) * 100;
	return { bgSizePercent, bgPosXPercent, bgPosYPercent };
}

// ===== Component =====

function Tile({
	tileNumber,
	tileIndex,
	isClickable,
	onClick,
	onTouchStart,
	onTouchEnd,
	onMouseDown,
	showNumbers,
	tileSizePx,
	emojiSvgUrl,
	boardSize,
	isEntering,
	isGameWon,
	onTransitionEnd,
}) {
	const tileRef = useRef(null);

	// Calculate delays from tile index
	const entranceDelay = tileIndex * 50; // 50ms stagger for entrance
	const celebrationDelay = tileIndex * 60; // 60ms stagger for celebration

	// Calculate position (CSS transitions will handle smooth movement)
	const position = calculateTilePixelPosition(
		tileIndex,
		boardSize,
		tileSizePx,
	);

	const style = {
		position: "absolute",
		left: `${position.x}px`,
		top: `${position.y}px`,
		width: `${tileSizePx}px`,
		height: `${tileSizePx}px`,
	};

	// Start invisible if entering (before animation starts)
	if (isEntering) {
		style.opacity = 0;
	}

	// Add animation delays via CSS variables
	if (isEntering) {
		style["--entrance-delay"] = `${entranceDelay}ms`;
	}

	if (isGameWon) {
		style["--celebration-delay"] = `${celebrationDelay}ms`;
	}

	// Add emoji background styling
	if (emojiSvgUrl && tileNumber) {
		const { row, col } = getTilePosition(tileNumber, boardSize);
		const { bgSizePercent, bgPosXPercent, bgPosYPercent } =
			getBackgroundStyles(row, col, boardSize);

		style.backgroundImage = `url('${emojiSvgUrl}')`;
		style.backgroundSize = `${bgSizePercent}% ${bgSizePercent}%`;
		style.backgroundPosition = `${bgPosXPercent}% ${bgPosYPercent}%`;
		style.backgroundRepeat = "no-repeat";
		style.backgroundOrigin = "border-box";
		style.backgroundClip = "border-box";
	}

	const classNames = [styles.tile];
	if (isClickable) classNames.push(styles.clickable);
	if (isEntering) classNames.push(styles.entering);
	if (isGameWon) classNames.push(styles.celebrating);

	// Handle animation end (for entrance/celebration)
	const handleAnimationEnd = () => {
		if (onTransitionEnd) {
			onTransitionEnd();
		}
	};

	// Handle transition end (for slide movements)
	const handleTransitionEnd = (e) => {
		// Only call once per move (fires for both left AND top, but we only need one callback)
		if (e.propertyName === "left" && onTransitionEnd) {
			onTransitionEnd();
		}
	};

	return (
		<div
			ref={tileRef}
			className={classNames.join(" ")}
			onClick={onClick}
			onTouchStart={onTouchStart}
			onTouchEnd={onTouchEnd}
			onMouseDown={onMouseDown}
			onAnimationEnd={handleAnimationEnd}
			onTransitionEnd={handleTransitionEnd}
			style={style}
			data-tile-number={tileNumber}
		>
			{showNumbers && tileNumber ? tileNumber : ""}
		</div>
	);
}

export default Tile;
