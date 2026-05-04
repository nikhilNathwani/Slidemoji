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
	onTransitionEnd,
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
		// Spring-like cubic-bezier: slight overshoot matches previous Framer spring feel
		transition: isGap
			? "none"
			: "transform 220ms cubic-bezier(0.34, 1.4, 0.64, 1)",
		willChange: "transform",
	};

	if (isGap) {
		return <div style={positionStyle} className="tile gap" />;
	}

	return (
		<div
			className={classNames.join(" ")}
			{...(isClickable && { onPointerDown })}
			onTransitionEnd={onTransitionEnd}
			style={{
				...positionStyle,
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
	);
}

export default Tile;
