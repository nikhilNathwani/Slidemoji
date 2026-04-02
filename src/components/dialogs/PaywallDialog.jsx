import { useCheckout } from "../../hooks/useCheckout";
import Dialog from "./Dialog";
import styles from "./PaywallDialog.module.css";

function PaywallDialog({ isOpen, onClose }) {
	const { startCheckout, isLoading, error } = useCheckout();

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Unlock the Archive">
			<div className={styles.content}>
				<div className={styles.priceHero}>
					<span className={styles.price}>$3</span>
					<span className={styles.priceNote}>one-time · unlocks all past &amp; future puzzles</span>
				</div>

				<ul className={styles.featureList}>
					<li>
						<span className={styles.featureIcon}>📅</span>
						<span>Play any past puzzle, all the way back to day one</span>
					</li>
					<li>
						<span className={styles.featureIcon}>🏆</span>
						<span>Complete your trophy collection on your own schedule</span>
					</li>
					<li>
						<span className={styles.featureIcon}>♾️</span>
						<span>One payment, permanent access — no subscription ever</span>
					</li>
				</ul>

				<button
					className={styles.checkoutButton}
					onClick={startCheckout}
					disabled={isLoading}
				>
					{isLoading ? "Redirecting to checkout…" : "Continue to payment"}
				</button>

				<p className={styles.securityNote}>🔒 Secure payment via Stripe</p>

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
