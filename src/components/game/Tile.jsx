import { motion } from "framer-motion";
import styles from "./Tile.module.css";

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
	celebrating = false,
	celebrationDelay = 0,
}) {
	const classNames = [styles.tile];
	if (isClickable) classNames.push(styles.clickable);
	if (celebrating) classNames.push(styles.celebrating);

	const springTransition = {
		layout: { type: "spring", stiffness: 400, damping: 35 },
	};

	if (isGap) {
		return (
			<motion.div
				layout
				transition={springTransition}
				className="tile gap"
			/>
		);
	}

	return (
		<motion.div
			layout
			transition={springTransition}
			onLayoutAnimationComplete={onTransitionEnd}
			className={classNames.join(" ")}
			{...(isClickable && { onPointerDown })}
			style={{
				...getTileStyle(tileNumber, gridSize, emojiSvgUrl),
				...(celebrating && {
					animationDelay: `${celebrationDelay}ms`,
					"--celebration-delay": `${celebrationDelay}ms`,
				}),
			}}
			data-tile-number={tileNumber}
		>
			{hasNumbersShown && tileNumber ? (
				<span className={styles.tileNumber}>{tileNumber}</span>
			) : null}
		</motion.div>
	);
}

export default Tile;
