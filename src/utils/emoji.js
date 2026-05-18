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

// Generate SVG data URL for emoji (to be created once and reused by all tiles).
// When showGradient is true, a two-axis colour gradient is baked behind the emoji
// so that every tile position shows a unique region of the shared gradient image.
// Blue (horizontal) and teal (vertical) are analogous colours — their intersection
// produces teal, not grey. 3.6:1 V:H opacity ratio guarantees no two (row, col)
// positions produce the same combined tonal value in both 3×3 and 4×4 grids.
export function createEmojiSvgUrl(
	emoji,
	showGradient = false,
	bgColor = "#ffffff",
) {
	const gradientMarkup = showGradient
		? `<defs>
			<linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="0%">
				<stop offset="0%" stop-color="#5ba3e0" stop-opacity="0"/>
				<stop offset="100%" stop-color="#5ba3e0" stop-opacity="0.55"/>
			</linearGradient>
			<linearGradient id="vg" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" stop-color="#3dc9a0" stop-opacity="0"/>
				<stop offset="100%" stop-color="#3dc9a0" stop-opacity="0.50"/>
			</linearGradient>
		</defs>
		<rect width="${EMOJI_SVG_SIZE}" height="${EMOJI_SVG_SIZE}" fill="${bgColor}"/>
		<rect width="${EMOJI_SVG_SIZE}" height="${EMOJI_SVG_SIZE}" fill="url(#hg)"/>
		<rect width="${EMOJI_SVG_SIZE}" height="${EMOJI_SVG_SIZE}" fill="url(#vg)"/>`
		: "";

	const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${EMOJI_SVG_SIZE} ${EMOJI_SVG_SIZE}" width="${EMOJI_SVG_SIZE}" height="${EMOJI_SVG_SIZE}">
		${gradientMarkup}
		<text x="50%" y="50%" font-size="${EMOJI_SVG_FONT_SIZE}" text-anchor="middle" dominant-baseline="central">${emoji}</text>
	</svg>`;
	const encodedSvg = encodeURIComponent(svgString);
	return `data:image/svg+xml,${encodedSvg}`;
}
