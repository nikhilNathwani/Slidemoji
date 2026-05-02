import { ReactNode, useEffect, useMemo, useState } from "react";
import { subscribeToFirestoreUserData } from "../services/firestore/userDoc";
import { useAuth } from "../auth/useAuth";
import {
	UserDocContext,
	type UserDoc,
	type UseUserDocResult,
} from "./UserDocContext";

interface UserDocState {
	userId: string | null;
	userData: UserDoc | null;
	error: Error | null;
}

export default function UserDocProvider({ children }: { children: ReactNode }) {
	const { user, isMerging } = useAuth();
	const userId = user?.uid ?? null;
	const [state, setState] = useState<UserDocState>({
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
			onError: (error: Error) => {
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

	const value: UseUserDocResult = useMemo(
		() => ({
			// During a merge (anonymous → Google sign-in) the Google user's Firestore
			// doc hasn't streamed in yet. Show the anonymous user's last-known data to
			// prevent the trophy case from flashing empty while waiting for the new doc.
			userDoc:
				state.userId === userId
					? state.userData
					: isMerging
						? state.userData
						: null,
			isLoading: !!userId && state.userId !== userId,
			error: state.userId === userId ? state.error : null,
		}),
		[state, userId, isMerging],
	);

	return (
		<UserDocContext.Provider value={value}>
			{children}
		</UserDocContext.Provider>
	);
}
