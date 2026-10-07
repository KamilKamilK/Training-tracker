import { useState, useEffect, useCallback } from 'react';
import { FirebaseError } from 'firebase/app';
import { AuthService } from '../services/firebase/auth.service.js';
import { ERROR_MESSAGES } from '../constants/messages.js';

const CANCELLED_SIGN_IN_CODES = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

export type AuthStatus = 'loading' | 'signedOut' | 'denied' | 'owner';

export const useAuth = () => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = 0;
    const unsubscribe = AuthService.onUserChanged(user => {
      const check = ++current;
      setEmail(user?.email ?? null);
      if (!user) {
        setStatus('signedOut');
        return;
      }
      setStatus('loading');
      AuthService.isOwner(user.uid)
        .then(isOwner => {
          if (check === current) setStatus(isOwner ? 'owner' : 'denied');
        })
        .catch(() => {
          if (check !== current) return;
          setError(ERROR_MESSAGES.checkAccess);
          setStatus('denied');
        });
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      await AuthService.signIn();
    } catch (err) {
      const cancelled = err instanceof FirebaseError && CANCELLED_SIGN_IN_CODES.includes(err.code);
      if (!cancelled) setError(ERROR_MESSAGES.signIn);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await AuthService.signOut();
    } catch {
      setError(ERROR_MESSAGES.signOut);
    }
  }, []);

  return { status, email, error, clearError: () => setError(null), signIn, signOut };
};
