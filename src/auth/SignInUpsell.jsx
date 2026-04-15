import { FontAwesomeIcon, faShieldAlt } from "../utils/icons";
import GoogleSignInButton from "./GoogleSignInButton";
import styles from "./SignInUpsell.module.css";
import "../App.css";

function SignInUpsell({ isCondensed = false }) {
	return isCondensed ? (
		<div className={styles.signInUpsell}>
			<GoogleSignInButton />
			<p className={styles.signInUpsellDescription}>
				Sign in to save your trophies across devices and complete your
				collection!
			</p>
		</div>
	) : (
		<div className={styles.signInUpsell}>
			<h3 className={styles.signInUpsellTitle}>Save Your Trophies</h3>
			<p
				className={
					isCondensed
						? styles.signInUpsellDescription
						: styles.signInUpsellDescriptionLarge
				}
			>
				Sign in to save your trophies across devices and complete your
				collection!
			</p>
			<GoogleSignInButton />
			<p className={styles.privacyNote}>
				<FontAwesomeIcon
					icon={faShieldAlt}
					style={{ position: "relative", top: "0.275em" }}
				/>
				<span>
					Your email is only used to save your progress. Your data is
					never sold or shared.
				</span>
			</p>
		</div>
	);
}

export default SignInUpsell;
