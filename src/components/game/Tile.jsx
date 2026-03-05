import styles from "./Tile.module.css";

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
	movingDirection,
	isClickable,
	onClick,
	onTouchStart,
	onTouchEnd,
	onMouseDown,
	showNumbers,
	position,
	tileSizePx,
	emojiSvgUrl,
	boardSize,
	isEntering,
	entranceDelay,
	isCelebrating,
	celebrationDelay,
}) {
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

	// Add animation delays via CSS variables (consistent pattern)
	if (isEntering && entranceDelay !== undefined) {
		style["--entrance-delay"] = `${entranceDelay}ms`;
	}

	if (isCelebrating && celebrationDelay !== undefined) {
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
	if (movingDirection) {
		classNames.push(styles.moving);
		if (movingDirection === "up") classNames.push(styles.slidingUp);
		if (movingDirection === "down") classNames.push(styles.slidingDown);
		if (movingDirection === "left") classNames.push(styles.slidingLeft);
		if (movingDirection === "right") classNames.push(styles.slidingRight);
	}
	if (isEntering) classNames.push(styles.entering);
	if (isCelebrating) classNames.push(styles.celebrating);

	return (
		<div
			className={classNames.join(" ")}
			onClick={onClick}
			onTouchStart={onTouchStart}
			onTouchEnd={onTouchEnd}
			onMouseDown={onMouseDown}
			style={style}
			data-tile-number={tileNumber}
		>
			{showNumbers ? tileNumber : ""}
		</div>
	);
}

export default Tile;
