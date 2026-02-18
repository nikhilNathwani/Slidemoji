function Tile({
	value,
	isGap,
	isAdjacentToGap,
	isMoving,
	onClick,
	onTouchStart,
	onTouchEnd,
	showNumbers,
	position,
	size,
}) {
	const style = {
		position: "absolute",
		left: `${position.x}px`,
		top: `${position.y}px`,
		width: `${size}px`,
		height: `${size}px`,
	};

	if (isGap) {
		return <div className="tile gap" style={style} onClick={onClick}></div>;
	}

	// Build className - moving tiles and tiles that are animating should not be clickable
	const isClickable = isAdjacentToGap && !isMoving;
	const className = `tile${isClickable ? " clickable" : ""}${isMoving ? " moving" : ""}`;

	return (
		<div
			className={className}
			onClick={onClick}
			onTouchStart={onTouchStart}
			onTouchEnd={onTouchEnd}
			style={style}
		>
			{showNumbers ? value : ""}
		</div>
	);
}

export default Tile;
