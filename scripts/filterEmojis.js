import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the emoji calendar
const calendarPath = path.join(__dirname, "../data/emoji_calendar.json");
const exclusionPath = path.join(__dirname, "../data/emoji_exclusion_list.json");

const calendar = JSON.parse(fs.readFileSync(calendarPath, "utf8"));
const exclusionList = JSON.parse(fs.readFileSync(exclusionPath, "utf8"));

// Create a set of emoji strings to exclude for faster lookup
const excludeEmojis = new Set(exclusionList.map((item) => item.emoji));

console.log(`Total emojis before filtering: ${calendar.length}`);
console.log(`Emojis to exclude: ${excludeEmojis.size}`);

// Filter out excluded emojis
const filteredCalendar = calendar.filter(
	(item) => !excludeEmojis.has(item.emoji),
);

console.log(`Total emojis after filtering: ${filteredCalendar.length}`);
console.log(`Removed: ${calendar.length - filteredCalendar.length} emojis`);

// Write the filtered calendar back
fs.writeFileSync(calendarPath, JSON.stringify(filteredCalendar, null, 2));

console.log("✓ Emoji calendar updated successfully");
