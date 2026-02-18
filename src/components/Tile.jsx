import { forwardRef } from "react";

const Tile = forwardRef(function Tile(
	{ value, isGap, isAdjacentToGap, onClick, showNumbers },
	ref,
) {
	if (isGap) {
		return <div ref={ref} className="tile gap" onClick={onClick}></div>;
	}

	return (
		<div
			ref={ref}
			className={`tile${isAdjacentToGap ? " clickable" : ""}`}
			onClick={onClick}
			style={{
				cursor: isAdjacentToGap ? "pointer" : "default",
			}}
		>
			{showNumbers ? value : ""}
		</div>
	);
});

export default Tile;

