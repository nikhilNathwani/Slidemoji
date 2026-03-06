// Simple sound utility using Web Audio API

let audioContext = null;

// Initialize audio context (lazy initialization)
function getAudioContext() {
	if (!audioContext) {
		audioContext = new (window.AudioContext || window.webkitAudioContext)();
	}
	return audioContext;
}

/**
 * Play a tile move sound
 * Creates a pleasant click/pop sound using oscillators
 */
export function playTileMoveSound() {
	try {
		const ctx = getAudioContext();
		const now = ctx.currentTime;

		// Create oscillator for the main tone
		const oscillator = ctx.createOscillator();
		const gainNode = ctx.createGain();

		// Connect nodes
		oscillator.connect(gainNode);
		gainNode.connect(ctx.destination);

		// Configure a pleasant click sound
		oscillator.type = "sine";
		oscillator.frequency.setValueAtTime(800, now); // Start at 800Hz
		oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.05); // Drop to 400Hz

		// Quick attack and decay for a crisp click
		gainNode.gain.setValueAtTime(0, now);
		gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01); // Quick attack
		gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); // Quick decay

		// Start and stop
		oscillator.start(now);
		oscillator.stop(now + 0.1);
	} catch (error) {
		// Silently fail if Web Audio API is not supported
		console.warn("Unable to play sound:", error);
	}
}

/**
 * Play a win celebration sound
 * Creates a cheerful ascending tone sequence
 */
export function playWinSound() {
	try {
		const ctx = getAudioContext();
		const now = ctx.currentTime;

		// Play a cheerful ascending sequence
		const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
		const duration = 0.15;

		frequencies.forEach((freq, index) => {
			const oscillator = ctx.createOscillator();
			const gainNode = ctx.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(ctx.destination);

			oscillator.type = "sine";
			oscillator.frequency.setValueAtTime(freq, now);

			const startTime = now + index * duration;
			gainNode.gain.setValueAtTime(0, startTime);
			gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
			gainNode.gain.exponentialRampToValueAtTime(
				0.01,
				startTime + duration,
			);

			oscillator.start(startTime);
			oscillator.stop(startTime + duration);
		});
	} catch (error) {
		console.warn("Unable to play win sound:", error);
	}
}
