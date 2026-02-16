// Get daily emoji based on current date
export function getDailyEmoji() {
	const emojis = [
		"😀", // Grinning Face
		"🎉", // Party Popper
		"🌟", // Star
		"🎨", // Artist Palette
		"🚀", // Rocket
		"🌈", // Rainbow
		"🎭", // Performing Arts
		"🎸", // Guitar
		"🍕", // Pizza
		"🌺", // Hibiscus
		"🦄", // Unicorn
		"🎯", // Direct Hit
		"🔥", // Fire
		"💎", // Gem Stone
		"🌙", // Crescent Moon
		"☀️", // Sun
		"🌊", // Water Wave
		"🍔", // Hamburger
		"🎮", // Video Game
		"📚", // Books
		"⚡", // High Voltage
		"🎪", // Circus Tent
		"🌸", // Cherry Blossom
		"🎵", // Musical Note
		"🏆", // Trophy
		"🎂", // Birthday Cake
		"🌍", // Earth
		"🎁", // Wrapped Gift
		"🔮", // Crystal Ball
		"🌻", // Sunflower
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
