import { ReactNode, useEffect, useMemo, useState } from "react";
import { subscribeToFirestoreUserData } from "../services/firestore/user";
import { useAuth } from "../hooks/useAuth";
import { UserDocContext, type UserData } from "./UserDocContext";

interface UserDocState {
	userId: string | null;
	userData: UserData | null;
	error: Error | null;
}

export default function UserDocProvider({ children }: { children: ReactNode }) {
	const { user } = useAuth();
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
			onData: (userData: unknown) => {
				setState({
					userId,
					userData: userData as UserData | null,
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

	const value = useMemo(
		() => ({
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
