import styles from "./TrophyCaseTitle.module.css";
import { FontAwesomeIcon, faTrophy } from "../../utils/icons";

function TrophyCaseTitle({
	numEarnedTrophies,
	numTotalTrophies,
	isDialogHeader,
}) {
	const Wrapper = isDialogHeader ? "span" : "h2";
	return (
		<Wrapper className={styles.trophyCaseTitle}>
			<FontAwesomeIcon icon={faTrophy} className={styles.titleIcon} />
			Trophy Case{" "}
			<span className={styles.trophyCountPill}>
				{numEarnedTrophies}
				<span className={styles.trophyCountDenominator}>
					<span className={styles.trophyCountSlash}>⁄</span>
					{numTotalTrophies}
				</span>
			</span>
		</Wrapper>
	);
}

export default TrophyCaseTitle;
