function Tile({
	tileNumber,
	isMoving,
	isClickable,
	onClick,
	onTouchStart,
	onTouchEnd,
	showNumbers,
	position,
	size,
	animationDuration,
}) {
	const style = {
		position: "absolute",
		transform: `translate(${position.x}px, ${position.y}px)`,
		willChange: isMoving ? "transform" : "auto",
		width: `${size}px`,
		height: `${size}px`,
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
			style={style}
			data-tile-number={tileNumber}
		>
			{showNumbers ? tileNumber : ""}
		</div>
	);
}

export default Tile;
