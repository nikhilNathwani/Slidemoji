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
 * Creates a warm, wooden slide and click sound
 */
export function playTileMoveSound() {
	try {
		const ctx = getAudioContext();
		const now = ctx.currentTime;

		// Layer 1: Scrabble tile slide (low rumble)
		const lowOsc = ctx.createOscillator();
		const lowGain = ctx.createGain();
		lowOsc.connect(lowGain);
		lowGain.connect(ctx.destination);

		lowOsc.type = "sine";
		lowOsc.frequency.setValueAtTime(120, now);
		lowOsc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

		lowGain.gain.setValueAtTime(0, now);
		lowGain.gain.linearRampToValueAtTime(0.15, now + 0.005);
		lowGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

		lowOsc.start(now);
		lowOsc.stop(now + 0.12);

		// Layer 2: Tile sliding friction (plastic on wood)
		const midOsc = ctx.createOscillator();
		const midGain = ctx.createGain();
		const midFilter = ctx.createBiquadFilter();
		midOsc.connect(midFilter);
		midFilter.connect(midGain);
		midGain.connect(ctx.destination);

		midOsc.type = "sawtooth";
		midOsc.frequency.setValueAtTime(350, now);
		midOsc.frequency.exponentialRampToValueAtTime(200, now + 0.06);

		midFilter.type = "lowpass";
		midFilter.frequency.setValueAtTime(1500, now);

		midGain.gain.setValueAtTime(0, now);
		midGain.gain.linearRampToValueAtTime(0.08, now + 0.01);
		midGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

		midOsc.start(now);
		midOsc.stop(now + 0.08);

		// Layer 3: Crisp click (tile snapping into grid)
		const clickOsc = ctx.createOscillator();
		const clickGain = ctx.createGain();
		const clickFilter = ctx.createBiquadFilter();
		clickOsc.connect(clickFilter);
		clickFilter.connect(clickGain);
		clickGain.connect(ctx.destination);

		clickOsc.type = "square";
		clickOsc.frequency.setValueAtTime(800, now);

		clickFilter.type = "bandpass";
		clickFilter.frequency.setValueAtTime(1200, now);
		clickFilter.Q.setValueAtTime(3, now);

		clickGain.gain.setValueAtTime(0, now);
		clickGain.gain.linearRampToValueAtTime(0.12, now + 0.001);
		clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.025);

		clickOsc.start(now);
		clickOsc.stop(now + 0.025);
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
