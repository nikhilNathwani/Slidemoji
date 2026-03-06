import { motion } from "framer-motion";

function Gap({ onMouseUp }) {
	return (
		<motion.div
			layout
			transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
			className="tile gap"
			onMouseUp={onMouseUp}
		/>
	);
}

export default Gap;
