import styles from "./Tile.module.css";
import { motion } from "framer-motion";

// ===== Helper Functions =====

// Calculate which grid position the tile should be in based on its value
function getTilePosition(value, boardSize) {
	const position = value - 1; // Convert 1-8 to 0-7
	const row = Math.floor(position / boardSize);
	const col = position % boardSize;
	return { row, col };
}

// Calculate background positioning percentages for pixel-perfect alignment
function getBackgroundStyles(row, col, boardSize) {
	const bgSizePercent = boardSize * 100; // 200% for 2x2, 300% for 3x3, 400% for 4x4
	const bgPosXPercent = (col / (boardSize - 1)) * 100;
	const bgPosYPercent = (row / (boardSize - 1)) * 100;
	return { bgSizePercent, bgPosXPercent, bgPosYPercent };
}

// ===== Component =====

function Tile({
	tileNumber,
	tileIndex,
	isClickable,
	onClick,
	onTouchStart,
	onTouchEnd,
	onMouseDown,
	showNumbers,
	emojiSvgUrl,
	boardSize,
	isEntering,
	isGameWon,
	onTransitionEnd,
}) {
	// Calculate delays from tile index
	const entranceDelay = tileIndex * 0.05; // 50ms stagger in seconds
	const celebrationDelay = tileIndex * 0.06; // 60ms stagger in seconds

	const style = {};

	// Add emoji background styling
	if (emojiSvgUrl && tileNumber) {
		const { row, col } = getTilePosition(tileNumber, boardSize);
		const { bgSizePercent, bgPosXPercent, bgPosYPercent } =
			getBackgroundStyles(row, col, boardSize);

		style.backgroundImage = `url('${emojiSvgUrl}')`;
		style.backgroundSize = `${bgSizePercent}% ${bgSizePercent}%`;
		style.backgroundPosition = `${bgPosXPercent}% ${bgPosYPercent}%`;
		style.backgroundRepeat = "no-repeat";
		style.backgroundOrigin = "border-box";
		style.backgroundClip = "border-box";
	}

	const classNames = [styles.tile];
	if (isClickable) classNames.push(styles.clickable);

	// Animation configuration
	const entranceAnimation = isEntering
		? {
				opacity: [0, 1],
				scale: [0.3, 1],
				rotate: [180, 0],
				transition: {
					duration: 0.6,
					delay: entranceDelay,
					ease: "easeOut",
				},
			}
		: undefined;

	const celebrationAnimation = isGameWon
		? {
				y: [0, -20, -15, 0, 0],
				scale: [1, 1.1, 1.05, 1.02, 1],
				transition: {
					duration: 0.6,
					delay: celebrationDelay,
					ease: "easeInOut",
				},
			}
		: undefined;

	return (
		<motion.div
			layoutId={`tile-${tileNumber}`}
			layout
			animate={celebrationAnimation || entranceAnimation}
			transition={{
				layout: { duration: 0.3, ease: "easeInOut" },
			}}
			onLayoutAnimationComplete={() => {
				// Called when layout (position) animation completes
				if (!isEntering && !isGameWon && onTransitionEnd) {
					onTransitionEnd();
				}
			}}
			onAnimationComplete={() => {
				// Called when entrance/celebration animation completes
				if ((isEntering || isGameWon) && onTransitionEnd) {
					onTransitionEnd();
				}
			}}
			className={classNames.join(" ")}
			onClick={onClick}
			onTouchStart={onTouchStart}
			onTouchEnd={onTouchEnd}
			onMouseDown={onMouseDown}
			style={style}
			data-tile-number={tileNumber}
		>
			{showNumbers && tileNumber ? tileNumber : ""}
		</motion.div>
	);
}

export default Tile;
