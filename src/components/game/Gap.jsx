import { motion } from "framer-motion";

function Gap() {
	return (
		<motion.div
			layout
			transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
			className="tile gap"
		/>
	);
}

export default Gap;
