import { useState, useEffect } from 'react';
import { onAuthChange, signInWithGoogle as firebaseSignIn, signOut as firebaseSignOut } from '../firebase';
import { AuthContext } from './authContext';

/**
 * AuthProvider component - wrap your app with this to provide auth state
 */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes (login/logout)
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setLoading(true);
      const firebaseUser = await firebaseSignIn();
      // User state will be updated by onAuthChange listener
      return firebaseUser;
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut();
      // User state will be updated by onAuthChange listener
    } catch (error) {
      console.error('Sign out error:', error);
      setLoading(false);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
