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

// Create radial gradient style that expands from center of board
function getGradientStyle(bgSizePercent, bgPosXPercent, bgPosYPercent) {
	return {
		background: `radial-gradient(circle at 50% 50%, #667eea 0%, #764ba2 50%, #2d3748 95%)`,
		backgroundSize: `${bgSizePercent}% ${bgSizePercent}%`,
		backgroundPosition: `${bgPosXPercent}% ${bgPosYPercent}%`,
		backgroundRepeat: "no-repeat",
	};
}

// ===== Component =====

function Tile({
	value,
	isGap,
	isAdjacentToGap,
	onClick,
	boardSize,
	emojiSvgUrl,
}) {
	if (isGap) {
		return <div className="tile gap" onClick={onClick}></div>;
	}

	const { row, col } = getTilePosition(value, boardSize);
	const { bgSizePercent, bgPosXPercent, bgPosYPercent } = getBackgroundStyles(
		row,
		col,
		boardSize,
	);
	const gradientStyle = getGradientStyle(
		bgSizePercent,
		bgPosXPercent,
		bgPosYPercent,
	);

	return (
		<div
			className="tile"
			onClick={onClick}
			style={{
				...gradientStyle,
				cursor: isAdjacentToGap ? "pointer" : "default",
			}}
		>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundImage: `url('${emojiSvgUrl}')`,
					backgroundSize: `${bgSizePercent}% ${bgSizePercent}%`,
					backgroundPosition: `${bgPosXPercent}% ${bgPosYPercent}%`,
					backgroundRepeat: "no-repeat",
				}}
			>
				{value}
			</div>
		</div>
	);
}

export default Tile;
