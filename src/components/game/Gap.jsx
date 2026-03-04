function Gap({ position, tileSizePx, onMouseUp }) {
	const style = {
		position: "absolute",
		transform: `translate(${position.x}px, ${position.y}px)`,
		width: `${tileSizePx}px`,
		height: `${tileSizePx}px`,
	};

	return <div className="tile gap" style={style} onMouseUp={onMouseUp}></div>;
}

export default Gap;
