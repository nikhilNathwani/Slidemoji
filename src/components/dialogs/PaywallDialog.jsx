import { useCheckout } from "../../hooks/useCheckout";
import { FontAwesomeIcon } from "../../utils/icons";
import Dialog from "./Dialog";
import styles from "./PaywallDialog.module.css";

// Decorative preview — mimics real archive entries (hardcoded, not live data)
const PREVIEW_ITEMS = [
	{ id: "001", name: "Top Hat", solved: true },
	{ id: "002", name: "Basketball", solved: true },
	{ id: "003", name: "Ocean Wave", solved: true },
	{ id: "004", name: "Lion Face", solved: true },
	{ id: "005", name: "Guitar", solved: false },
	{ id: "006", name: "Pizza Slice", solved: false },
	{ id: "007", name: "Crescent Moon", solved: false },
	{ id: "008", name: "Hibiscus", solved: false },
];

function ArchivePreview() {
	// Doubled for seamless CSS scroll loop
	const doubled = [...PREVIEW_ITEMS, ...PREVIEW_ITEMS];
	return (
		<div className={styles.archivePreview}>
			<div className={styles.archivePreviewTrack}>
				{doubled.map((item, i) => (
					<div
						key={i}
						className={`${styles.archivePreviewItem} ${
							item.solved ? styles.previewSolved : ""
						}`}
					>
						<span className={styles.previewId}>#{item.id}</span>
						<span className={styles.previewName}>{item.name}</span>
						<FontAwesomeIcon
							icon={item.solved ? "check" : "play-circle"}
							className={styles.previewIcon}
						/>
					</div>
				))}
			</div>
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
						one-time purchase · no subscription
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
