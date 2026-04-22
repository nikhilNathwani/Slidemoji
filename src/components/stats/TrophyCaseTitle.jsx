import styles from "./TrophyCaseTitle.module.css";
import { FontAwesomeIcon, faTrophy } from "../../utils/icons";

function TrophyCaseTitle({ isDialogHeader }) {
	const Wrapper = isDialogHeader ? "span" : "h2";
	return (
		<Wrapper className={styles.trophyCaseTitle}>
			<FontAwesomeIcon icon={faTrophy} className={styles.titleIcon} />
			Trophy Case
		</Wrapper>
	);
}

export default TrophyCaseTitle;
