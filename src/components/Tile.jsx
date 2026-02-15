function Tile({ value, isGap, onClick, boardSize, emoji, tileSize }) {
	if (isGap) {
		return (
			<div
				className="tile gap"
				onClick={onClick}
				style={{
					width: `${tileSize}px`,
					height: `${tileSize}px`,
				}}
			></div>
		);
	}

	// Calculate which portion of the emoji to show based on the tile's VALUE
	// Value 1 = top-left, Value 2 = top-middle, etc.
	const position = value - 1; // Convert 1-8 to 0-7
	const row = Math.floor(position / boardSize);
	const col = position % boardSize;

	// Use percentage-based positioning for pixel-perfect alignment
	// This ensures tiles line up perfectly without subpixel gaps
	const bgSizePercent = boardSize * 100; // 200% for 2x2, 300% for 3x3, 400% for 4x4
	const bgPosXPercent = (col / (boardSize - 1)) * 100;
	const bgPosYPercent = (row / (boardSize - 1)) * 100;

	// Generate mesh gradient background with multiple color blobs
	// This ensures every tile position is unique (no diagonal duplicates)
	const gradientStyle = {
		background: `
			radial-gradient(circle at 0% 0%, #667eea 0%, transparent 50%),
			radial-gradient(circle at 100% 0%, #f093fb 0%, transparent 50%),
			radial-gradient(circle at 100% 100%, #4facfe 0%, transparent 50%),
			radial-gradient(circle at 0% 100%, #764ba2 0%, transparent 50%),
			radial-gradient(circle at 50% 50%, #a8edea 0%, transparent 40%),
			linear-gradient(135deg, #fed6e3 0%, #a8edea 100%)
		`,
		backgroundSize: `${bgSizePercent}% ${bgSizePercent}%`,
		backgroundPosition: `${bgPosXPercent}% ${bgPosYPercent}%`,
	};

	// Create high-resolution SVG emoji (stays at moderate size)
	const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
		<text x="50%" y="50%" font-size="700" text-anchor="middle" dominant-baseline="central">${emoji}</text>
	</svg>`;
	const encodedSvg = encodeURIComponent(svgString);

	return (
		<div
			className="tile"
			onClick={onClick}
			style={{
				width: `${tileSize}px`,
				height: `${tileSize}px`,
				background: gradientStyle.background,
				backgroundSize: `${bgSizePercent}% ${bgSizePercent}%`,
				backgroundPosition: `${bgPosXPercent}% ${bgPosYPercent}%`,
				backgroundRepeat: "no-repeat",
			}}
		>
			<div
				style={{
					width: "100%",
					height: "100%",
					backgroundImage: `url('data:image/svg+xml,${encodedSvg}')`,
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
