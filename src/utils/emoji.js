import emojiCalendar from "../../data/emoji_calendar.json";
import { LAUNCH_DATE } from "./puzzleUtils";

// SVG canvas configuration
const EMOJI_SVG_SIZE = 2048;
const EMOJI_SVG_FONT_SIZE = 1600;

// Get today's emoji based on days elapsed since launch.
export function getDailyEmoji() {
	const startDate = new Date(LAUNCH_DATE);
	const now = new Date();
	const tzOffsetMs = now.getTimezoneOffset() * 60 * 1000;
	const daysSinceStart = Math.floor(
		(now.getTime() - tzOffsetMs - startDate.getTime()) /
			(1000 * 60 * 60 * 24),
	);
	return emojiCalendar[daysSinceStart % emojiCalendar.length];
}

// Generate SVG data URL for emoji (to be created once and reused by all tiles)
export function createEmojiSvgUrl(emoji) {
	// High resolution SVG with proper scaling for crisp rendering
	const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${EMOJI_SVG_SIZE} ${EMOJI_SVG_SIZE}" width="${EMOJI_SVG_SIZE}" height="${EMOJI_SVG_SIZE}">
		<text x="50%" y="50%" font-size="${EMOJI_SVG_FONT_SIZE}" text-anchor="middle" dominant-baseline="central">${emoji}</text>
	</svg>`;
	const encodedSvg = encodeURIComponent(svgString);
	return `data:image/svg+xml,${encodedSvg}`;
}
