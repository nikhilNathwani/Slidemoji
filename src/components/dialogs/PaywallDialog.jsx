import { useCheckout } from "../../hooks/useCheckout";
import { FontAwesomeIcon } from "../../utils/icons";
import Dialog from "./Dialog";
import styles from "./PaywallDialog.module.css";

// Decorative archive preview — suggests what the archive looks like
// Using fixed puzzle numbers so it's always a clean preview
const PREVIEW_PUZZLES = [
	{ num: "001", solved: true },
	{ num: "002", solved: true },
	{ num: "003", solved: false },
	{ num: "004", solved: false },
	{ num: "005", solved: false },
];

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

				{/* Archive preview — shows what you're unlocking */}
				<div className={styles.archivePreview}>
					<span className={styles.previewLabel}>
						Every past puzzle, unlocked:
					</span>
					<div className={styles.previewPuzzles}>
						{PREVIEW_PUZZLES.map(({ num, solved }) => (
							<span
								key={num}
								className={`${styles.previewBadge} ${solved ? styles.previewBadgeSolved : ""}`}
							>
								#{num}
								{solved && (
									<FontAwesomeIcon
										icon="check"
										className={styles.previewCheck}
									/>
								)}
							</span>
						))}
						<span className={styles.previewEllipsis}>…</span>
					</div>
				</div>

				{/* Feature list */}
				<ul className={styles.featureList}>
					<li>
						<FontAwesomeIcon
							icon="calendar-alt"
							className={styles.featureIcon}
						/>
						<span>
							Play any past puzzle, all the way back to day one
						</span>
					</li>
					<li>
						<FontAwesomeIcon
							icon="trophy"
							className={styles.featureIcon}
						/>
						<span>
							Complete your trophy collection on your own
							schedule
						</span>
					</li>
					<li>
						<FontAwesomeIcon
							icon="infinity"
							className={styles.featureIcon}
						/>
						<span>
							Permanent access — new daily puzzles unlock for
							you automatically, forever
						</span>
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

