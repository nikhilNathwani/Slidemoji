import { motion } from "framer-motion";
import { getTilePosition } from "../../utils/boardHelpers";

function Gap({ index, size, tileSizePx, onMouseUp }) {
	const position = getTilePosition(index, size, tileSizePx);
	const style = {
		position: "absolute",
		left: `${position.x}px`,
		top: `${position.y}px`,
		width: `${tileSizePx}px`,
		height: `${tileSizePx}px`,
	};

	return (
		<motion.div
			layout
			transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
			className="tile gap"
			style={style}
			onMouseUp={onMouseUp}
		/>
	);
}

export default Gap;
