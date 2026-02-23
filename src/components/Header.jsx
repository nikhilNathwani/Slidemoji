function Header({ onSettingsClick, onStatsClick, onSignIn }) {
	return (
		<header className="app-header">
			<h1 className="app-title">Slidemoji</h1>
			<div className="header-actions">
				<button
					className="icon-button"
					onClick={onSettingsClick}
					aria-label="Settings"
					title="Settings"
				>
					<i className="fas fa-cog"></i>
				</button>
				<button
					className="icon-button"
					onClick={onStatsClick}
					aria-label="Stats"
					title="Stats"
				>
					<i className="fas fa-trophy"></i>
				</button>
				<button
					className="google-signin-btn"
					onClick={onSignIn}
					aria-label="Sign In"
					title="Sign In with Google"
				>
					<img
						src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
						alt="Google"
						className="google-icon"
					/>
					Sign in
				</button>
			</div>
		</header>
	);
}

export default Header;
