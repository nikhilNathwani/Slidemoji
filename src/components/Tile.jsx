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
