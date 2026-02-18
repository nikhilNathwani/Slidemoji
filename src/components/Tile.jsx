function Tile({
	value,
	isGap,
	isAdjacentToGap,
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

	return (
		<div
			className={`tile${isAdjacentToGap ? " clickable" : ""}`}
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
