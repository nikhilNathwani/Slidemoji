// Get daily emoji based on current date
export function getDailyEmoji() {
	const emojis = [
		{ emoji: "🛝", name: "Playground Slide" },
		{ emoji: "😀", name: "Grinning Face" },
		{ emoji: "🎉", name: "Party Popper" },
		{ emoji: "🌟", name: "Star" },
		{ emoji: "🎨", name: "Artist Palette" },
		{ emoji: "🚀", name: "Rocket" },
		{ emoji: "🌈", name: "Rainbow" },
		{ emoji: "🎭", name: "Performing Arts" },
		{ emoji: "🎸", name: "Guitar" },
		{ emoji: "🍕", name: "Pizza" },
		{ emoji: "🌺", name: "Hibiscus" },
		{ emoji: "🦄", name: "Unicorn" },
		{ emoji: "🎯", name: "Direct Hit" },
		{ emoji: "🔥", name: "Fire" },
		{ emoji: "💎", name: "Gem Stone" },
		{ emoji: "🌙", name: "Crescent Moon" },
		{ emoji: "☀️", name: "Sun" },
		{ emoji: "🌊", name: "Water Wave" },
		{ emoji: "🍔", name: "Hamburger" },
		{ emoji: "🎮", name: "Video Game" },
		{ emoji: "📚", name: "Books" },
		{ emoji: "⚡", name: "High Voltage" },
		{ emoji: "🎪", name: "Circus Tent" },
		{ emoji: "🌸", name: "Cherry Blossom" },
		{ emoji: "🎵", name: "Musical Note" },
		{ emoji: "🏆", name: "Trophy" },
		{ emoji: "🎂", name: "Birthday Cake" },
		{ emoji: "🌍", name: "Earth" },
		{ emoji: "🎁", name: "Wrapped Gift" },
		{ emoji: "🔮", name: "Crystal Ball" },
		{ emoji: "🌻", name: "Sunflower" },
	];

	// Get day of year (0-365)
	const now = new Date();
	const start = new Date(now.getFullYear(), 0, 0);
	const diff = now - start;
	const oneDay = 1000 * 60 * 60 * 24;
	const dayOfYear = Math.floor(diff / oneDay);

	// Pick emoji based on day of year
	return emojis[dayOfYear % emojis.length];
}

// Generate SVG data URL for emoji (to be created once and reused by all tiles)
export function createEmojiSvgUrl(emoji) {
	// Increased resolution for crisp, clear emoji rendering
	const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
		<text x="50%" y="50%" font-size="800" text-anchor="middle" dominant-baseline="central">${emoji}</text>
	</svg>`;
	const encodedSvg = encodeURIComponent(svgString);
	return `data:image/svg+xml,${encodedSvg}`;
}
