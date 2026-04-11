import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
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
	// Keep html background in sync — Safari reads this for browser chrome color
	root.style.background = bg;
	// Update all theme-color meta tags (may be one or two depending on inline-script state)
	document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
		m.removeAttribute("media");
		m.setAttribute("content", bg);
	});
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
