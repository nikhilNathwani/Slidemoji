import PuzzleListItem from "../components/dialogs/PuzzleListItem";
import { FontAwesomeIcon, faCheck, faShieldAlt } from "../utils/icons";
import { useCheckout } from "./useCheckout";
import styles from "./PaywallView.module.css";

function PaywallView({ puzzleList }) {
	const { startCheckout, isRedirecting, error } = useCheckout();
	// Show earliest puzzles first (#001, #002...) — ascending order.
	// Always show exactly 3 items; on day 1 or 2 there may be fewer real
	// puzzles, so pad with synthetic placeholder entries so the preview
	// always looks full (they're locked in isPreviewMode anyway).
	const sorted = [...puzzleList].reverse(); // ascending: #1, #2, #3…
	const previewItems = Array.from({ length: 3 }, (_, i) =>
		sorted[i] ?? { puzzleNum: i + 1, isSolved: false }
	);

	return (
		<div className={styles.paywallContent}>
			{/* Real puzzle list clipped + faded, with CTA overlaid at bottom */}
			<div className={styles.paywallListWrapper}>
				<div className={styles.previewList}>
					{previewItems.map((puzzle) => (
						<PuzzleListItem
							key={puzzle.puzzleNum}
							puzzleNum={puzzle.puzzleNum}
							isSolved={false}
							onClick={() => {}}
							isPreviewMode={true}
						/>
					))}
				</div>
				<div className={styles.paywallOverlay} />
			</div>
			<div className={styles.paywallCta}>
				<p className={styles.paywallCtaHeadline}>
					Access all past puzzles
				</p>
				<p className={styles.paywallCtaNote}>
					One-time purchase · No subscription
				</p>
			</div>
			<ul className={styles.featureList}>
				<li className={styles.featureItem}>
					<FontAwesomeIcon
						icon={faCheck}
						className={styles.featureIcon}
					/>
					<div>
						<div className={styles.featureHeadline}>
							Complete your trophy collection
						</div>
						<div className={styles.featureDetail}>
							Earn trophies for every puzzle, at your own pace.
						</div>
					</div>
				</li>
				<li className={styles.featureItem}>
					<FontAwesomeIcon
						icon={faCheck}
						className={styles.featureIcon}
					/>
					<div>
						<div className={styles.featureHeadline}>
							Permanent access
						</div>
						<div className={styles.featureDetail}>
							One payment unlocks the entire archive, forever.
						</div>
					</div>
				</li>
			</ul>

			<button
				className={`btn btn-solid ${styles.unlockButton}`}
				onClick={startCheckout}
				disabled={isRedirecting}
			>
				{isRedirecting ? "Redirecting…" : "Unlock for $3"}
			</button>

			{error && <p className={styles.error}>{error}</p>}

			<p className={styles.securityNote}>
				<FontAwesomeIcon icon={faShieldAlt} />
				Secure payment via Stripe
			</p>
		</div>
	);
}

export default PaywallView;
