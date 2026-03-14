/**
 * QueryProvider - TanStack Query provider for data fetching
 *
 * Wraps the app to provide React Query functionality:
 * - Automatic caching of Firebase data
 * - Smart refetching and background updates
 * - Built-in loading/error states
 * - Request deduplication
 *
 * Usage: Wrap your app in main.jsx (inside AuthProvider):
 *   <AuthProvider>
 *     <QueryProvider>
 *       <App />
 *     </QueryProvider>
 *   </AuthProvider>
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create QueryClient with sensible defaults
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Don't refetch on window focus for Firebase data (expensive!)
			refetchOnWindowFocus: false,
			// Retry failed requests once (Firebase usually fails for auth/permission reasons)
			retry: 1,
			// Consider data fresh for 5 minutes (reduces Firebase reads)
			staleTime: 5 * 60 * 1000,
		},
	},
});

export default function QueryProvider({ children }) {
	return (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
}
