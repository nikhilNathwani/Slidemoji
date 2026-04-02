import { useCheckout } from "../../hooks/useCheckout";
import { FontAwesomeIcon } from "../../utils/icons";
import Dialog from "./Dialog";
import styles from "./PaywallDialog.module.css";

function PaywallDialog({ isOpen, onClose }) {
	const { startCheckout, isLoading, error } = useCheckout();

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Unlock the Archive">
			<div className={styles.content}>
				{/* Price — shown first so there are no surprises */}
				<div className={styles.priceHero}>
					<span className={styles.price}>$3</span>
					<span className={styles.priceNote}>one-time payment</span>
				</div>

				{/* Feature list — two clear benefits */}
				<ul className={styles.featureList}>
					<li>
						<FontAwesomeIcon
							icon="check"
							className={styles.featureIcon}
						/>
						<div>
							<strong className={styles.featureHeadline}>
								Play any past puzzle
							</strong>
							<span className={styles.featureDetail}>
								Every puzzle back to day one, playable any time
							</span>
						</div>
					</li>
					<li>
						<FontAwesomeIcon
							icon="check"
							className={styles.featureIcon}
						/>
						<div>
							<strong className={styles.featureHeadline}>
								Complete your trophy collection
							</strong>
							<span className={styles.featureDetail}>
								Go back and solve what you missed, at your own
								pace
							</span>
						</div>
					</li>
				</ul>

				<button
					className={styles.checkoutButton}
					onClick={startCheckout}
					disabled={isLoading}
				>
					{isLoading
						? "Redirecting to checkout…"
						: "Continue to payment"}
				</button>

				<p className={styles.securityNote}>
					<FontAwesomeIcon icon="shield-alt" /> Secure payment via
					Stripe
				</p>

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
