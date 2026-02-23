import styles from "./Toggle.module.css";

function Toggle({ isOn, onToggle, disabled = false }) {
	return (
		<button
			className={`${styles.toggle} ${isOn ? styles.on : styles.off}`}
			onClick={onToggle}
			disabled={disabled}
		>
			<span className={styles.slider}></span>
			<span className={styles.label}>{isOn ? "ON" : "OFF"}</span>
		</button>
	);
}

export default Toggle;
