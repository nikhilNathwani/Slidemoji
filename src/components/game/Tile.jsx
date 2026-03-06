import styles from "./Tile.module.css";
import { motion } from "framer-motion";
import { getTilePosition as calculateTilePixelPosition } from "../../utils/boardHelpers";

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
	tileSizePx,
	emojiSvgUrl,
	boardSize,
	isEntering,
	isGameWon,
	onTransitionEnd,
}) {
	// Calculate position
	const position = calculateTilePixelPosition(
		tileIndex,
		boardSize,
		tileSizePx,
	);

	// Calculate delays from tile index
	const entranceDelay = tileIndex * 0.05; // 50ms stagger in seconds
	const celebrationDelay = tileIndex * 0.06; // 60ms stagger in seconds

	const style = {
		position: "absolute",
		left: `${position.x}px`,
		top: `${position.y}px`,
		width: `${tileSizePx}px`,
		height: `${tileSizePx}px`,
	};

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

	// Framer Motion animation variants
	const variants = {
		entering: {
			opacity: 1,
			scale: 1,
			rotate: 0,
			transition: {
				duration: 0.6,
				delay: entranceDelay,
				ease: "easeOut",
			},
		},
		celebrating: {
			y: [0, -20, -15, 0, 0],
			scale: [1, 1.1, 1.05, 1.02, 1],
			transition: {
				duration: 0.6,
				delay: celebrationDelay,
				ease: "easeInOut",
			},
		},
		normal: {
			opacity: 1,
			scale: 1,
			rotate: 0,
			y: 0,
		},
	};

	// Determine current animation state
	let animateState = "normal";
	if (isEntering) animateState = "entering";
	else if (isGameWon) animateState = "celebrating";

	// Initial state for entrance animation
	const initialState = isEntering
		? { opacity: 0, scale: 0.3, rotate: 180 }
		: false;

	return (
		<motion.div
			layoutId={`tile-${tileNumber}`} // Stable ID for layout animations
			layout // Auto-animates position changes!
			initial={initialState}
			animate={animateState}
			variants={variants}
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
