import { useCheckout } from "../../hooks/useCheckout";
import Dialog from "./Dialog";
import styles from "./PaywallDialog.module.css";

function PaywallDialog({ isOpen, onClose }) {
	const { startCheckout, isLoading, error } = useCheckout();

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Unlock the Archive">
			<div className={styles.content}>
				<p className={styles.tagline}>
					Every puzzle, every day — going all the way back.
				</p>

				<ul className={styles.featureList}>
					<li>🗓️ Play any past puzzle from the full archive</li>
					<li>🏆 Earn trophies for every missed puzzle</li>
					<li>⭐ Complete your collection at your own pace</li>
				</ul>

				<button
					className={styles.checkoutButton}
					onClick={startCheckout}
					disabled={isLoading}
				>
					{isLoading ? "Redirecting to checkout…" : "Unlock Archive — $3"}
				</button>

				{error && (
					<p role="alert" className={styles.error}>
						{error}
					</p>
				)}
			</div>
		</Dialog>
	);
}

export default PaywallDialog;
