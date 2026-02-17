function Dialog({ isOpen, onClose, title, children }) {
	if (!isOpen) return null;

	return (
		<div className="dialog-overlay" onClick={onClose}>
			<div
				className="dialog-content"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="dialog-header">
					<h2>{title}</h2>
					<button className="dialog-close" onClick={onClose}>
						×
					</button>
				</div>
				<div className="dialog-body">{children}</div>
			</div>
		</div>
	);
}

export default Dialog;
