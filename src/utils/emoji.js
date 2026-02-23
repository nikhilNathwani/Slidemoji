import emojiCalendar from "../../data/emoji_calendar.json";
import { EMOJI_SVG_SIZE, EMOJI_SVG_FONT_SIZE } from "../constants";

// Get daily emoji based on current date
export function getDailyEmoji() {
	// Get day of year (0-365)
	const now = new Date();
	const start = new Date(now.getFullYear(), 0, 0);
	const diff = now - start;
	const oneDay = 1000 * 60 * 60 * 24;
	const dayOfYear = Math.floor(diff / oneDay);

	// Pick emoji based on day of year
	return emojiCalendar[dayOfYear % emojiCalendar.length];
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
