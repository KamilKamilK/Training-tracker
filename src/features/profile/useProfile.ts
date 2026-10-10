import { useCallback, useEffect, useState } from 'react';
import { UserProfile } from '../../types/index.js';
import { ERROR_MESSAGES } from '../../constants/messages.js';
import { ProfileService } from './profile.service.js';

/** Profile of the signed-in account kept in sync with Firestore; null uid means no subscription. */
export const useProfile = (uid: string | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    return ProfileService.subscribe(
      uid,
      data => {
        setProfile(data);
        setLoadedFor(uid);
      },
      () => {
        setError(ERROR_MESSAGES.loadProfile);
        setLoadedFor(uid);
      },
    );
  }, [uid]);

  /** Runs a write; resolves to true only when Firestore confirmed it. */
  const write = useCallback(async (action: () => Promise<void>, failure: string): Promise<boolean> => {
    try {
      await action();
      setError(null);
      return true;
    } catch {
      setError(failure);
      return false;
    }
  }, []);

  const activate = useCallback(
    (displayName: string) => {
      if (!uid) return Promise.resolve(false);
      return write(() => ProfileService.activate(uid, displayName), ERROR_MESSAGES.saveProfile);
    },
    [uid, write],
  );

  const updateDisplayName = useCallback(
    (displayName: string) => {
      if (!uid) return Promise.resolve(false);
      return write(() => ProfileService.updateDisplayName(uid, displayName), ERROR_MESSAGES.saveProfile);
    },
    [uid, write],
  );

  const withdrawHealthConsent = useCallback(() => {
    if (!uid) return Promise.resolve(false);
    return write(() => ProfileService.withdrawHealthConsent(uid), ERROR_MESSAGES.withdrawConsent);
  }, [uid, write]);

  const clearError = useCallback(() => setError(null), []);

  return {
    profile: uid && loadedFor === uid ? profile : null,
    isLoading: uid !== null && loadedFor !== uid,
    error,
    clearError,
    activate,
    updateDisplayName,
    withdrawHealthConsent,
  };
};
