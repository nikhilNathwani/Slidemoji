function Toggle({ isOn, onToggle, disabled = false }) {
	return (
		<button
			className={`toggle-switch ${isOn ? "on" : "off"}`}
			onClick={onToggle}
			disabled={disabled}
		>
			<span className="toggle-slider"></span>
			<span className="toggle-label">{isOn ? "ON" : "OFF"}</span>
		</button>
	);
}

export default Toggle;
