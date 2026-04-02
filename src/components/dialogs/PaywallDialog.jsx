import { useCheckout } from "../../hooks/useCheckout";
import { FontAwesomeIcon } from "../../utils/icons";
import Dialog from "./Dialog";
import styles from "./PaywallDialog.module.css";

// Decorative preview — mimics real archive entries (hardcoded, not live data)
// Static list that fades out at the bottom — creates "locked content" feel
const PREVIEW_ITEMS = [
	{ id: "001", name: "Top Hat" },
	{ id: "002", name: "Basketball" },
	{ id: "003", name: "Ocean Wave" },
	{ id: "004", name: "Lion Face" },
	{ id: "005", name: "Guitar" },
	{ id: "006", name: "Pizza Slice" },
	{ id: "007", name: "Crescent Moon" },
	{ id: "008", name: "Hibiscus" },
];

function ArchivePreview() {
	return (
		<div className={styles.archivePreview}>
			{PREVIEW_ITEMS.slice(0, 6).map((item) => (
				<div key={item.id} className={styles.archivePreviewItem}>
					<span className={styles.previewId}>#{item.id}</span>
					<span className={styles.previewName}>{item.name}</span>
					<FontAwesomeIcon
						icon="play-circle"
						className={styles.previewIcon}
					/>
				</div>
			))}
		</div>
	);
}

function PaywallDialog({ isOpen, onClose }) {
	const { startCheckout, isLoading, error } = useCheckout();

	return (
		<Dialog isOpen={isOpen} onClose={onClose} title="Unlock the Archive">
			<div className={styles.content}>
				{/* Tagline */}
				<p className={styles.tagline}>
					Access every past puzzle, forever.
				</p>

				{/* Archive preview — scrolling mini-list of what they're unlocking */}
				<ArchivePreview />

				{/* Price — shown upfront, no surprises */}
				<div className={styles.priceHero}>
					<span className={styles.price}>$3</span>
					<span className={styles.priceNote}>
						One-time purchase · No subscription
					</span>
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
					{isLoading ? "Redirecting to checkout…" : "Unlock for $3"}
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
