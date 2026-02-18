function Tile({
	value,
	isGap,
	isAdjacentToGap,
	onClick,
	onTouchStart,
	onTouchEnd,
	showNumbers,
	style,
}) {
	if (isGap) {
		return <div className="tile gap" style={style} onClick={onClick}></div>;
	}

	return (
		<div
			className={`tile${isAdjacentToGap ? " clickable" : ""}`}
			onClick={onClick}
			onTouchStart={onTouchStart}
			onTouchEnd={onTouchEnd}
			style={{
				...style,
				cursor: isAdjacentToGap ? "pointer" : "default",
			}}
		>
			{showNumbers ? value : ""}
		</div>
	);
}

export default Tile;
