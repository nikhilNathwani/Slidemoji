import styles from "./Tile.module.css";
import { motion } from "framer-motion";

// ===== Helper Functions =====

// Calculate full inline style object for tile
function getTileStyle(tileNumber, gridSize, emojiSvgUrl) {
	const style = {};

	if (emojiSvgUrl && tileNumber) {
		// Convert tile number to grid position (1-8 -> row/col)
		const position = tileNumber - 1;
		const row = Math.floor(position / gridSize);
		const col = position % gridSize;

		// Calculate background positioning percentages for pixel-perfect alignment
		const bgSizePercent = gridSize * 100; // 300% for 3x3, 400% for 4x4
		const bgPosXPercent = (col / (gridSize - 1)) * 100;
		const bgPosYPercent = (row / (gridSize - 1)) * 100;

		style.backgroundImage = `url('${emojiSvgUrl}')`;
		style.backgroundSize = `${bgSizePercent}% ${bgSizePercent}%`;
		style.backgroundPosition = `${bgPosXPercent}% ${bgPosYPercent}%`;
	}
	return style;
}

function Tile({
	tileNumber,
	isClickable,
	onPointerDown,
	hasNumbersShown,
	emojiSvgUrl,
	gridSize,
	onTransitionEnd,
}) {
	const classNames = [styles.tile];
	if (isClickable) classNames.push(styles.clickable);

	return (
		<motion.div
			layoutId={`tile-${tileNumber}`}
			layout
			transition={{
				layout: { duration: 0.3, ease: "easeOut" },
			}}
			onLayoutAnimationComplete={onTransitionEnd}
			className={classNames.join(" ")}}
			{...(isClickable && { onPointerDown })}
			style={getTileStyle(tileNumber, gridSize, emojiSvgUrl)}
			data-tile-number={tileNumber}
		>
			{hasNumbersShown && tileNumber ? tileNumber : ""}
		</motion.div>
	);
}

export default Tile;
