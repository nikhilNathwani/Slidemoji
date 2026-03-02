let fontAwesomeLoaded = false;
let fontAwesomeLoading = false;
const loadCallbacks = [];

export function loadFontAwesome() {
	return new Promise((resolve, reject) => {
		// Already loaded
		if (fontAwesomeLoaded) {
			resolve();
			return;
		}

		// Currently loading, queue callback
		if (fontAwesomeLoading) {
			loadCallbacks.push({ resolve, reject });
			return;
		}

		// Start loading
		fontAwesomeLoading = true;
		loadCallbacks.push({ resolve, reject });

		const script = document.createElement("script");
		script.src = "https://kit.fontawesome.com/caba6ce64c.js";
		script.crossOrigin = "anonymous";

		script.onload = () => {
			fontAwesomeLoaded = true;
			fontAwesomeLoading = false;
			// Resolve all queued promises
			loadCallbacks.forEach((cb) => cb.resolve());
			loadCallbacks.length = 0;
		};

		script.onerror = (error) => {
			fontAwesomeLoading = false;
			// Reject all queued promises
			loadCallbacks.forEach((cb) => cb.reject(error));
			loadCallbacks.length = 0;
		};

		document.head.appendChild(script);
	});
}
