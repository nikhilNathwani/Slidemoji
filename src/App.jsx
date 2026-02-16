import { useState } from "react";
import "./App.css";
import Board from "./components/Board";

function App() {
	const [gridSize, setGridSize] = useState(3); // Default to 3×3

	return (
		<div className="app">
			<header>
				<h1>Slidemoji</h1>
				<p>Slides tiles to unscramble the emoji!</p>
			</header>
			<main>
				<SizeSelector
					selectedSize={gridSize}
					onSizeChange={setGridSize}
				/>
				<Board size={gridSize} />
			</main>
		</div>
	);
}

function SizeSelector({ selectedSize, onSizeChange }) {
	const sizes = [2, 3, 4];

	return (
		<div className="size-selector">
			<label>Grid Size: </label>
			{sizes.map((size) => (
				<button
					key={size}
					className={selectedSize === size ? "active" : ""}
					onClick={() => onSizeChange(size)}
				>
					{size}×{size}
				</button>
			))}
		</div>
	);
}

export default App;
