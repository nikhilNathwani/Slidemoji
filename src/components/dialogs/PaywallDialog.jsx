import { useCheckout } from "../../hooks/useCheckout";
import { FontAwesomeIcon } from "../../utils/icons";
import Dialog from "./Dialog";
import styles from "./PaywallDialog.module.css";

function PaywallDialog({ isOpen, onClose }) {
	const { startCheckout, isLoading, error } = useCheckout();

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Unlock the Archive">
			<div className={styles.content}>
				{/* Tagline */}
				<p className={styles.tagline}>
					Every puzzle, back to day one.
				</p>

				{/* Price — upfront, no surprises */}
				<div className={styles.priceHero}>
					<span className={styles.price}>$3</span>
					<span className={styles.priceNote}>one-time payment</span>
				</div>

				{/* Feature list */}
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
								All puzzles back to day one, playable any time
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
								Catch up on missed puzzles at your own pace
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
						: "Unlock for $3"}
				</button>

				<p className={styles.securityNote}>
					<FontAwesomeIcon icon="shield-alt" /> Secure payment via
					Stripe · No subscription
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
