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
	isMoving,
	isClickable,
	onClick,
	onTouchStart,
	onTouchEnd,
	onMouseDown,
	showNumbers,
	position,
	tileSizePx,
	animationDuration,
	emojiSvgUrl,
	boardSize,
}) {
	const style = {
		position: "absolute",
		transform: `translate(${position.x}px, ${position.y}px)`,
		willChange: isMoving ? "transform" : "auto",
		width: `${tileSizePx}px`,
		height: `${tileSizePx}px`,
	};

	// Set transition duration dynamically when moving
	if (isMoving) {
		style.transition = `transform ${animationDuration}ms ease-out`;
	}

	// Add emoji background styling
	if (emojiSvgUrl && tileNumber) {
		const { row, col } = getTilePosition(tileNumber, boardSize);
		const { bgSizePercent, bgPosXPercent, bgPosYPercent } =
			getBackgroundStyles(row, col, boardSize);

		// Account for 1px border on each tile
		const borderWidth = 1;
		const offsetX = (col * borderWidth * 2) / tileSizePx;
		const offsetY = (row * borderWidth * 2) / tileSizePx;

		style.backgroundImage = `url('${emojiSvgUrl}')`;
		style.backgroundSize = `${bgSizePercent}% ${bgSizePercent}%`;
		style.backgroundPosition = `calc(${bgPosXPercent}% + ${offsetX}px) calc(${bgPosYPercent}% + ${offsetY}px)`;
		style.backgroundRepeat = "no-repeat";
	}

	const className = `tile${isClickable ? " clickable" : ""}${isMoving ? " moving" : ""}`;

	return (
		<div
			className={className}
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
