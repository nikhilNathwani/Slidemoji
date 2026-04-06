import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
import AuthProvider from "./contexts/AuthProvider";
import UserDocProvider from "./contexts/UserDocProvider.jsx";
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

export function Root() {
	const [darkMode] = usePreference("darkMode");
	useEffect(() => {
		const root = document.documentElement;
		root.classList.toggle("dark-theme", darkMode);
		root.classList.toggle("light-theme", !darkMode);
	}, [darkMode]);
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
