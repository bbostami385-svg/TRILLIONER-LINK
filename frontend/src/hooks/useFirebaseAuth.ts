import { useCallback, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Firebase Authentication Hook
 * Manages Google Sign In/Out and auth state
 */
export function useFirebaseAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({
        user,
        loading: false,
        error: null,
      });
    });

    return unsubscribe;
  }, []);

  // Google Sign In
  const signInWithGoogle = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Get ID token
      const idToken = await result.user.getIdToken();
      
      // Send to backend for session creation
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      setState(prev => ({
        ...prev,
        user: result.user,
        loading: false,
      }));

      return result.user;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Sign in failed');
      setState(prev => ({
        ...prev,
        error: err,
        loading: false,
      }));
      throw err;
    }
  }, []);

  // Sign Out
  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Sign out from backend
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Sign out from Firebase
      await signOut(auth);
      
      setState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Sign out failed');
      setState(prev => ({
        ...prev,
        error: err,
        loading: false,
      }));
      throw err;
    }
  }, []);

  // Get ID Token
  const getIdToken = useCallback(async () => {
    if (!state.user) return null;
    return await state.user.getIdToken();
  }, [state.user]);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signInWithGoogle,
    logout,
    getIdToken,
  };
}
