import emojiCalendar from "../../data/emoji_calendar.json";

const puzzleCatalogById = emojiCalendar.reduce((acc, entry, index) => {
	acc[index + 1] = {
		emoji: entry.emoji,
		emojiName: entry.name,
	};
	return acc;
}, {});

export function getPuzzleCatalogEntry(puzzleId) {
	if (!Number.isInteger(puzzleId) || puzzleId <= 0) {
		return null;
	}
	return puzzleCatalogById[puzzleId] || null;
}
