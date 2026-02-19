function Gap({ position, size }) {
	const style = {
		position: "absolute",
		transform: `translate(${position.x}px, ${position.y}px)`,
		width: `${size}px`,
		height: `${size}px`,
	};

	return <div className="tile gap" style={style}></div>;
}

export default Gap;
