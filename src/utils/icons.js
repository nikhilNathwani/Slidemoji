/**
 * FontAwesome icon configuration
 * Centralizes all icon imports for the app
 */

import { library } from "@fortawesome/fontawesome-svg-core";
import {
	faRedo,
	faCog,
	faTrophy,
	faUserCircle,
	faSignOutAlt,
	faLock,
	faComment,
	faBug,
	faMagic,
	faShareNodes,
	faShieldAlt,
	faFire,
	faUnlock,
	faChevronLeft,
	faChevronRight,
	faMedal,
} from "@fortawesome/free-solid-svg-icons";

// Add all icons to the library so they can be used throughout the app
library.add(
	faRedo,
	faCog,
	faTrophy,
	faUserCircle,
	faSignOutAlt,
	faLock,
	faComment,
	faBug,
	faMagic,
	faShareNodes,
	faShieldAlt,
	faFire,
	faUnlock,
	faChevronLeft,
	faChevronRight,
	faMedal,
);

// Export FontAwesomeIcon component for use in other files
export { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
