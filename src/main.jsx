import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
import AuthProvider from "./contexts/AuthProvider.jsx";
import QueryProvider from "./contexts/QueryProvider.jsx";
import "./utils/icons.js"; // Initialize FontAwesome icon library

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<AuthProvider>
			<QueryProvider>
				<App />
			</QueryProvider>
		</AuthProvider>
	</React.StrictMode>,
);
