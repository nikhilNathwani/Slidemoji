import { useEffect, useMemo, useState } from "react";
import { subscribeToFirestoreUserData } from "../firebase/firestore/user";
import { useAuth } from "./auth";
import { UserDocContext } from "./userDoc";

export default function UserDocProvider({ children }) {
	const { user } = useAuth();
	const userId = user?.uid || null;
	const [state, setState] = useState({
		userId: null,
		userData: null,
		error: null,
	});

	useEffect(() => {
		if (!userId) {
			return;
		}

		const unsubscribe = subscribeToFirestoreUserData(userId, {
			onData: (userData) => {
				setState({
					userId,
					userData,
					error: null,
				});
			},
			onError: (error) => {
				console.error(
					"[UserDocProvider] Error subscribing to user data:",
					error,
				);
				setState({
					userId,
					userData: null,
					error,
				});
			},
		});

		return () => unsubscribe();
	}, [userId]);

	const value = useMemo(
		() => ({
			userId,
			userData: state.userId === userId ? state.userData : null,
			loading: !!userId && state.userId !== userId,
			error: state.userId === userId ? state.error : null,
		}),
		[state, userId],
	);

	return (
		<UserDocContext.Provider value={value}>
			{children}
		</UserDocContext.Provider>
	);
}
