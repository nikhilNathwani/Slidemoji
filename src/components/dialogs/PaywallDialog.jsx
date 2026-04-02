import { useCheckout } from "../../hooks/useCheckout";
import Dialog from "./Dialog";
import styles from "./PaywallDialog.module.css";

function PaywallDialog({ isOpen, onClose }) {
	const { startCheckout, isLoading, error } = useCheckout();

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Unlock the Archive">
			<div className={styles.content}>
				<div className={styles.hero}>
					<span className={styles.heroEmoji}>🗓️</span>
					<p className={styles.heroText}>
						Every puzzle, every day —<br />
						<strong>going all the way back to day one.</strong>
					</p>
				</div>

				<ul className={styles.featureList}>
					<li>
						<span className={styles.featureIcon}>🏆</span>
						<span>Earn trophies for every puzzle you solve</span>
					</li>
					<li>
						<span className={styles.featureIcon}>⭐</span>
						<span>Complete your collection at your own pace</span>
					</li>
					<li>
						<span className={styles.featureIcon}>♾️</span>
						<span>1,000+ puzzles and counting — one unlock, forever</span>
					</li>
				</ul>

				<div className={styles.priceRow}>
					<span className={styles.price}>$3</span>
					<span className={styles.priceNote}>one-time · no subscription</span>
				</div>

				<button
					className={styles.checkoutButton}
					onClick={startCheckout}
					disabled={isLoading}
				>
					{isLoading ? "Redirecting to checkout…" : "Unlock Archive"}
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
