function Tile({ value, isGap, isAdjacentToGap, onClick }) {
	if (isGap) {
		return <div className="tile gap" onClick={onClick}></div>;
	}

	return (
		<div
			className={`tile${isAdjacentToGap ? " clickable" : ""}`}
			onClick={onClick}
			style={{
				cursor: isAdjacentToGap ? "pointer" : "default",
			}}
		>
			{value}
		</div>
	);
}

export default Tile;

