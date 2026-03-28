import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
import AuthProvider from "./contexts/AuthProvider.jsx";
import "./utils/icons.js"; // Initialize FontAwesome icon library

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

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<AuthProvider>
			<App />
		</AuthProvider>
	</React.StrictMode>,
);
