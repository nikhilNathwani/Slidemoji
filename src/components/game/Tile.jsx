import styles from "./Tile.module.css";

function getTileStyle(tileNumber, gridSize, emojiSvgUrl) {
	const style = {};

	if (emojiSvgUrl && tileNumber) {
		const position = tileNumber - 1;
		const row = Math.floor(position / gridSize);
		const col = position % gridSize;

		// Calculate background positioning for pixel-perfect emoji alignment
		const bgSizePercent = gridSize * 100;
		const bgPosXPercent = (col / (gridSize - 1)) * 100;
		const bgPosYPercent = (row / (gridSize - 1)) * 100;

		style.backgroundImage = `url('${emojiSvgUrl}')`;
		style.backgroundSize = `${bgSizePercent}% ${bgSizePercent}%`;
		style.backgroundPosition = `${bgPosXPercent}% ${bgPosYPercent}%`;
	}
	return style;
}

function Tile({
	tileNumber,
	gridSize,
	emojiSvgUrl,
	hasNumbersShown,
	isClickable,
	isGap = false,
	x,
	y,
	tileSize,
	onPointerDown,
	celebrating = false,
	celebrationDelay = 0,
}) {
	const classNames = [styles.tile];
	if (isClickable) classNames.push(styles.clickable);
	if (celebrating) classNames.push(styles.celebrating);

	const positionStyle = {
		position: "absolute",
		width: tileSize,
		height: tileSize,
		transform: `translate(${x}px, ${y}px)`,
		// Ease-out: fast start, smooth deceleration, no overshoot — matches
		// the feel of the previous Framer Motion spring (stiffness:400, damping:35)
		transition: isGap
			? "none"
			: "transform 180ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
		willChange: "transform",
	};

	if (isGap) {
		return <div style={positionStyle} className="tile gap" />;
	}

	// Two-div structure: outer handles positioning (transform:translate),
	// inner handles the win celebration (transform:scale via tilePop keyframe).
	// Keeping them separate means the scale animation never clobbers the translate.
	return (
		<div style={positionStyle}>
			<div
				className={classNames.join(" ")}
				{...(isClickable && { onPointerDown })}
				style={{
					width: "100%",
					height: "100%",
					...getTileStyle(tileNumber, gridSize, emojiSvgUrl),
					...(celebrating && {
						animationDelay: `${celebrationDelay}ms`,
						"--celebration-delay": `${celebrationDelay}ms`,
					}),
				}}
				data-tile-number={tileNumber}
			>
				{hasNumbersShown && tileNumber ? (
					<span className={styles.tileNumber}>{tileNumber}</span>
				) : null}
			</div>
		</div>
	);
}

export default Tile;
