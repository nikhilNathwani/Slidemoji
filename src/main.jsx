import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
import "./styles/buttons.css";
import AuthProvider from "./auth/AuthProvider";
import UserDocProvider from "./contexts/UserDocProvider";
import "./utils/icons.js"; // Initialize FontAwesome icon library
import { useTheme } from "./hooks/useTheme";

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
	useTheme();
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
