import { useCheckout } from "../../hooks/useCheckout";
import Dialog from "./Dialog";
import styles from "./PaywallDialog.module.css";

/**
 * PaywallDialog - shown when a user tries to access a premium feature.
 *
 * TODO: Replace the placeholder content with final copy and premium feature highlights.
 * TODO: Add pricing details once the Stripe product/price is configured.
 */
function PaywallDialog({ isOpen, onClose }) {
	const { startCheckout, isLoading, error } = useCheckout();

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Go Premium">
			<div className={styles.content}>
				{/* TODO: Add premium feature highlights here */}
				<p className={styles.description}>
					Unlock premium features to get the most out of Slidemoji.
				</p>

				<button
					className={styles.checkoutButton}
					onClick={startCheckout}
					disabled={isLoading}
				>
					{isLoading ? "Redirecting to checkout…" : "Upgrade to Premium"}
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
