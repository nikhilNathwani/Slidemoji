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
	isMoving,
	animationDirection,
	onAnimationEnd,
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
	playingEntranceAnimation,
	entranceDelay,
	celebrating,
	celebrationDelay,
	isWon = false,
}) {
	// Base transform to position tile
	let transform = `translate(${position.x}px, ${position.y}px)`;

	// Add animation transform if tile is moving
	if (isMoving && animationDirection) {
		const directionTransforms = {
			up: "translateY(-100%)",
			down: "translateY(100%)",
			left: "translateX(-100%)",
			right: "translateX(100%)",
		};
		transform += ` ${directionTransforms[animationDirection]}`;
	}

	const style = {
		position: "absolute",
		transform,
		transition: isMoving
			? `transform ${animationDuration}ms ease-out`
			: undefined,
		width: `${tileSizePx}px`,
		height: `${tileSizePx}px`,
		"--tile-x": `${position.x}px`,
		"--tile-y": `${position.y}px`,
	};

	// Start invisible if entering (before animation starts)
	if (playingEntranceAnimation) {
		style.opacity = 0;
	}

	// Add entrance animation delay
	if (playingEntranceAnimation && entranceDelay !== undefined) {
		style.animationDelay = `${entranceDelay}ms`;
	}

	// Add celebration animation delay
	if (celebrating && celebrationDelay !== undefined) {
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
	if (isMoving) classNames.push(styles.moving);
	if (playingEntranceAnimation) classNames.push(styles.entering);
	if (celebrating) classNames.push(styles.celebrating);
	if (isWon) classNames.push(styles.won);

	return (
		<div
			className={classNames.join(" ")}
			onClick={onClick}
			onTouchStart={onTouchStart}
			onTouchEnd={onTouchEnd}
			onMouseDown={onMouseDown}
			onTransitionEnd={
				onAnimationEnd
					? (e) => {
							// Only respond to transform transitions, not other properties
							if (e.propertyName === "transform") {
								onAnimationEnd();
							}
						}
					: undefined
			}
			style={style}
			data-tile-number={tileNumber}
		>
			{showNumbers ? tileNumber : ""}
		</div>
	);
}

export default Tile;
