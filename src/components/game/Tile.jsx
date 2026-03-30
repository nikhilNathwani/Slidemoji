import styles from "./Tile.module.css";
import { motion } from "framer-motion";

function getTileStyle(tileNumber, gridSize, emojiSvgUrl) {
	const style = {};

	if (emojiSvgUrl && tileNumber) {
		const position = tileNumber - 1;
		const row = Math.floor(position / gridSize);
		const col = position % gridSize;

		// Calculate background positioning for pixel-perfect emoji alignment
		const bgSizePercent = gridSize * 100;
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
	gridSize,
	emojiSvgUrl,
	hasNumbersShown,
	isClickable,
	isGap = false,
	onPointerDown,
	onTransitionEnd,
}) {
	const classNames = [styles.tile];
	if (isClickable) classNames.push(styles.clickable);

	if (isGap) {
		return (
			<motion.div
				layout
				transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
				className="tile gap"
			/>
		);
	}

	return (
		<motion.div
			layoutId={`tile-${tileNumber}`}
			layout
			transition={{
				layout: { duration: 0.3, ease: "easeOut" },
			}}
			onLayoutAnimationComplete={onTransitionEnd}
			className={classNames.join(" ")}
			{...(isClickable && { onPointerDown })}
			style={getTileStyle(tileNumber, gridSize, emojiSvgUrl)}
			data-tile-number={tileNumber}
		>
			{hasNumbersShown && tileNumber ? tileNumber : ""}
		</motion.div>
	);
}

export default Tile;
