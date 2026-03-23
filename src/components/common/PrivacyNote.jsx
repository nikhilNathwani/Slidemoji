import { FontAwesomeIcon } from "../../utils/icons";
import styles from "./PrivacyNote.module.css";

function PrivacyNote() {
	return (
		<p className={styles.privacyNote}>
			<FontAwesomeIcon
				icon="shield-alt"
				style={{ position: "relative", top: "0.275em" }}
			/>
			<span>
				Your email is only used to save your progress. Your data is
				never sold or shared.
			</span>
		</p>
	);
}

export default PrivacyNote;
