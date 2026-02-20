/**
 * Google OAuth Authentication Utilities
 * 
 * This module handles Google Sign-In integration for the Slidemoji app.
 * It manages user authentication and provides user profile information.
 */

// Google OAuth Client ID - Replace with your actual client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

let googleAuth = null;
let currentUser = null;

/**
 * Initialize Google Sign-In
 * Call this once when the app loads
 */
export async function initGoogleAuth() {
	if (!GOOGLE_CLIENT_ID) {
		console.warn('Google Client ID not configured. Sign-in will not work.');
		return false;
	}

	try {
		// Load the Google Identity Services library
		await loadGoogleScript();
		
		// Initialize the Google Sign-In client
		googleAuth = window.google.accounts.oauth2.initTokenClient({
			client_id: GOOGLE_CLIENT_ID,
			scope: 'email profile',
			callback: handleAuthResponse,
		});

		// Check if user is already signed in
		await checkExistingAuth();
		
		return true;
	} catch (error) {
		console.error('Failed to initialize Google Auth:', error);
		return false;
	}
}

/**
 * Load the Google Identity Services script
 */
function loadGoogleScript() {
	return new Promise((resolve, reject) => {
		// Check if already loaded
		if (window.google && window.google.accounts) {
			resolve();
			return;
		}

		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.defer = true;
		script.onload = resolve;
		script.onerror = reject;
		document.head.appendChild(script);
	});
}

/**
 * Handle the authentication response from Google
 */
async function handleAuthResponse(response) {
	if (response.access_token) {
		// Get user profile information
		const userInfo = await fetchUserProfile(response.access_token);
		
		if (userInfo) {
			currentUser = {
				email: userInfo.email,
				name: userInfo.name,
				picture: userInfo.picture,
				accessToken: response.access_token,
			};

			// Store auth info in localStorage for persistence
			localStorage.setItem('slidemoji_user', JSON.stringify(currentUser));
			
			// Trigger custom event for app to listen to
			window.dispatchEvent(new CustomEvent('authStateChanged', { 
				detail: currentUser 
			}));

			console.log('User signed in:', currentUser.email);
		}
	}
}

/**
 * Fetch user profile from Google API
 */
async function fetchUserProfile(accessToken) {
	try {
		const response = await fetch(
			'https://www.googleapis.com/oauth2/v2/userinfo',
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (response.ok) {
			return await response.json();
		}
		return null;
	} catch (error) {
		console.error('Failed to fetch user profile:', error);
		return null;
	}
}

/**
 * Check if user has existing valid authentication
 */
async function checkExistingAuth() {
	const stored = localStorage.getItem('slidemoji_user');
	if (stored) {
		try {
			const user = JSON.parse(stored);
			// Verify the token is still valid
			const isValid = await verifyToken(user.accessToken);
			if (isValid) {
				currentUser = user;
				window.dispatchEvent(new CustomEvent('authStateChanged', { 
					detail: currentUser 
				}));
			} else {
				// Token expired, clear it
				localStorage.removeItem('slidemoji_user');
			}
		} catch (error) {
			console.error('Error checking existing auth:', error);
			localStorage.removeItem('slidemoji_user');
		}
	}
}

/**
 * Verify if access token is still valid
 */
async function verifyToken(accessToken) {
	try {
		const response = await fetch(
			`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
		);
		return response.ok;
	} catch {
		return false;
	}
}

/**
 * Sign in with Google
 * Call this when user clicks the "Sign in with Google" button
 */
export function signInWithGoogle() {
	if (!googleAuth) {
		console.error('Google Auth not initialized. Call initGoogleAuth() first.');
		return;
	}

	googleAuth.requestAccessToken();
}

/**
 * Sign out the current user
 */
export function signOut() {
	currentUser = null;
	localStorage.removeItem('slidemoji_user');
	
	// Trigger auth state change event
	window.dispatchEvent(new CustomEvent('authStateChanged', { 
		detail: null 
	}));

	console.log('User signed out');
}

/**
 * Get current signed-in user
 * @returns {Object|null} User object or null if not signed in
 */
export function getCurrentUser() {
	return currentUser;
}

/**
 * Check if user is currently signed in
 * @returns {boolean}
 */
export function isSignedIn() {
	return currentUser !== null;
}
