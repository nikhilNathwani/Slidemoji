import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
import "./styles/buttons.css";
import AuthProvider from "./contexts/AuthProvider";
import UserDocProvider from "./contexts/UserDocProvider";
import "./utils/icons.js"; // Initialize FontAwesome icon library
import { usePreference } from "./hooks/usePreference";

// Prevent arrow keys from scrolling the page globally
window.addEventListener(
	"keydown",
	(event) => {
		if (
			["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
				event.key,
			)
		) {
			event.preventDefault();
		}
	},
	{ passive: false },
);

function applyTheme(isDark) {
	const root = document.documentElement;
	const bg = isDark ? "#121212" : "#f2f2f2";
	root.classList.toggle("dark-theme", isDark);
	root.classList.toggle("light-theme", !isDark);
	// color-scheme is the most reliable browser signal for native UI color
	// (scrollbars, form controls, and browser chrome on iOS/macOS Safari).
	// Must mirror the class change; browser re-reads this property dynamically.
	root.style.colorScheme = isDark ? "dark" : "light";
	// Set both html and body backgrounds synchronously so Safari can read the
	// correct color for the browser toolbar on initial load *and* after a toggle.
	// The .app div handles the visual background via CSS vars; this is only for
	// the browser chrome signal.
	root.style.background = bg;
	document.body.style.background = bg;
	// Remove existing theme-color metas and create a fresh one.
	// Safari iOS only reliably re-reads theme-color on a genuine DOM change in <head>,
	// not when an existing element's attribute is mutated in-place.
	document
		.querySelectorAll('meta[name="theme-color"]')
		.forEach((m) => m.remove());
	const themeMeta = document.createElement("meta");
	themeMeta.name = "theme-color";
	themeMeta.content = bg;
	document.head.appendChild(themeMeta);
}

export function Root() {
	const [darkMode] = usePreference("darkMode");
	// Sync from Firestore-driven React state
	useEffect(() => {
		applyTheme(darkMode);
	}, [darkMode]);
	// Also respond immediately to same-window preference writes (bypasses Firestore round-trip)
	useEffect(() => {
		const handler = (e) => {
			if (e.detail?.key === "darkMode") applyTheme(e.detail.value);
		};
		window.addEventListener("preference-updated", handler);
		return () => window.removeEventListener("preference-updated", handler);
	}, []);
	return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<AuthProvider>
			<UserDocProvider>
				<Root />
			</UserDocProvider>
		</AuthProvider>
	</React.StrictMode>,
);
