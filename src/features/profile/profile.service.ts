import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig.js';
import { HEALTH_CONSENT } from '../../constants/consent.js';
import { UserProfile } from '../../types/index.js';
import { parseUserProfile } from '../../utils/parse.utils.js';

const COLLECTION_NAME = 'users';

const profileRef = (uid: string) => doc(db, COLLECTION_NAME, uid);

/** The rules require the consent time to be the server time of the write. */
const healthConsent = (accepted: boolean) => ({ accepted, version: HEALTH_CONSENT.version, at: serverTimestamp() });

const logged = async (operation: string, uid: string, action: () => Promise<void>): Promise<void> => {
  try {
    await action();
  } catch (err) {
    console.error(`ProfileService.${operation} error:`, uid, err);
    throw err;
  }
};

export class ProfileService {
  /** Streams the profile; a missing or invalid document is reported as null. */
  static subscribe(
    uid: string,
    onChange: (profile: UserProfile | null) => void,
    onError: (error: unknown) => void,
  ): () => void {
    return onSnapshot(
      profileRef(uid),
      snapshot => {
        if (!snapshot.exists()) {
          onChange(null);
          return;
        }
        // A pending write has no server time yet; the estimate keeps the profile valid until it is confirmed.
        const profile = parseUserProfile(snapshot.data({ serverTimestamps: 'estimate' }));
        if (!profile) console.warn('ProfileService.subscribe: invalid profile document', uid);
        onChange(profile);
      },
      error => {
        console.error('ProfileService.subscribe error:', uid, error);
        onError(error);
      },
    );
  }

  /** Creates or replaces the profile with the accepted health consent, which activates the account. */
  static activate(uid: string, displayName: string): Promise<void> {
    return logged('activate', uid, () =>
      setDoc(profileRef(uid), { displayName, consents: { health: healthConsent(true) } }),
    );
  }

  static updateDisplayName(uid: string, displayName: string): Promise<void> {
    return logged('updateDisplayName', uid, () => updateDoc(profileRef(uid), { displayName }));
  }

  /** Deactivates the account; the data stays, but the rules deny access until consent is given again. */
  static withdrawHealthConsent(uid: string): Promise<void> {
    return logged('withdrawHealthConsent', uid, () =>
      updateDoc(profileRef(uid), { 'consents.health': healthConsent(false) }),
    );
  }
}
