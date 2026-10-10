import { useState, useEffect, useCallback } from 'react';
import { FirebaseError } from 'firebase/app';
import { AuthService, type AuthUser } from './auth.service.js';
import { CANCELLED_SIGN_IN_CODES, authErrorMessage } from './auth.errors.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';

export type AuthStatus = 'loading' | 'signedOut' | 'unverified' | 'denied' | 'owner';

const errorCode = (err: unknown) => (err instanceof FirebaseError ? err.code : undefined);

export const useAuth = () => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const resolveAccess = useCallback((user: AuthUser | null, isCurrent: () => boolean) => {
    setEmail(user?.email ?? null);
    if (!user) {
      setStatus('signedOut');
      return;
    }
    if (!user.emailVerified) {
      setStatus('unverified');
      return;
    }
    setStatus('loading');
    AuthService.isOwner(user.uid)
      .then(isOwner => {
        if (isCurrent()) setStatus(isOwner ? 'owner' : 'denied');
      })
      .catch(() => {
        if (!isCurrent()) return;
        setError(ERROR_MESSAGES.checkAccess);
        setStatus('denied');
      });
  }, []);

  useEffect(() => {
    let current = 0;
    return AuthService.onUserChanged(user => {
      const check = ++current;
      resolveAccess(user, () => check === current);
    });
  }, [resolveAccess]);

  /** Runs an auth action, showing its error; resolves to true when it succeeded. */
  const run = useCallback(async (action: () => Promise<unknown>): Promise<boolean> => {
    setError(null);
    setNotice(null);
    try {
      await action();
      return true;
    } catch (err) {
      const code = errorCode(err);
      if (!code || !CANCELLED_SIGN_IN_CODES.includes(code)) setError(authErrorMessage(code));
      return false;
    }
  }, []);

  const signInWithGoogle = useCallback(() => run(() => AuthService.signInWithGoogle()), [run]);

  const signInWithEmail = useCallback(
    (address: string, password: string) => run(() => AuthService.signInWithEmail(address, password)),
    [run],
  );

  const register = useCallback(
    (address: string, password: string) => run(() => AuthService.register(address, password)),
    [run],
  );

  const sendPasswordReset = useCallback(
    async (address: string) => {
      const sent = await run(() => AuthService.sendPasswordReset(address));
      if (sent) setNotice('Jeśli konto z tym adresem istnieje, wysłaliśmy na nie link do zmiany hasła.');
      return sent;
    },
    [run],
  );

  const resendVerification = useCallback(async () => {
    const sent = await run(() => AuthService.resendVerification());
    if (sent) setNotice('Wysłaliśmy ponownie link potwierdzający. Sprawdź też folder spam.');
    return sent;
  }, [run]);

  /** Checks again whether the address was confirmed (e.g. after clicking the link in another tab). */
  const checkVerification = useCallback(
    () =>
      run(async () => {
        const user = await AuthService.refreshUser();
        if (user && !user.emailVerified) {
          setNotice('Adres nie jest jeszcze potwierdzony. Kliknij link w wiadomości e-mail.');
        }
        resolveAccess(user, () => true);
      }),
    [run, resolveAccess],
  );

  const signOut = useCallback(async () => {
    if (await run(() => AuthService.signOut())) {
      // A fresh page load creates a new Firestore instance with an empty cache.
      window.location.assign('/');
    }
  }, [run]);

  return {
    status,
    email,
    error,
    notice,
    clearError: () => setError(null),
    signInWithGoogle,
    signInWithEmail,
    register,
    sendPasswordReset,
    resendVerification,
    checkVerification,
    signOut,
  };
};
