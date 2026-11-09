import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { clearIndexedDbPersistence, doc, getDoc, terminate, waitForPendingWrites } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig.js';
import { LocalStorageService } from '../../services/storage/localStorage.service.js';
import { STORAGE_KEYS } from '../../constants/config.js';

const OWNERS_COLLECTION = 'owners';
// Writes sent over a working connection are acknowledged well within this time; offline they wait
// for the connection, so the check does not hold up signing out for longer.
const PENDING_WRITES_TIMEOUT_MS = 2000;

/** The part of the Firebase user the app relies on. */
export type AuthUser = Pick<User, 'uid' | 'email' | 'emailVerified' | 'displayName'>;

const logged = async <T>(operation: string, action: () => Promise<T>): Promise<T> => {
  try {
    return await action();
  } catch (err) {
    console.error(`AuthService.${operation} error:`, err);
    throw err;
  }
};

export class AuthService {
  static onUserChanged(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  static signInWithGoogle(): Promise<void> {
    return logged('signInWithGoogle', async () => {
      await signInWithPopup(auth, new GoogleAuthProvider());
    });
  }

  static signInWithEmail(email: string, password: string): Promise<void> {
    return logged('signInWithEmail', async () => {
      await signInWithEmailAndPassword(auth, email, password);
    });
  }

  /** Creates the account and sends the verification e-mail; data stays locked until it is confirmed. */
  static register(email: string, password: string): Promise<void> {
    return logged('register', async () => {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(user);
    });
  }

  static resendVerification(): Promise<void> {
    return logged('resendVerification', async () => {
      if (!auth.currentUser) throw new Error('No signed-in user');
      await sendEmailVerification(auth.currentUser);
    });
  }

  /**
   * Reloads the signed-in user and refreshes the ID token, so a verification confirmed in another
   * tab reaches both the app and the security rules (`email_verified` claim).
   */
  static refreshUser(): Promise<AuthUser | null> {
    return logged('refreshUser', async () => {
      const user = auth.currentUser;
      if (!user) return null;
      await user.reload();
      await user.getIdToken(true);
      return auth.currentUser;
    });
  }

  /** Firebase sends the e-mail only for an existing account and reports no difference to the caller. */
  static sendPasswordReset(email: string): Promise<void> {
    return logged('sendPasswordReset', async () => {
      await sendPasswordResetEmail(auth, email);
    });
  }

  /**
   * Whether Firestore holds writes the server has not acknowledged within the time limit (e.g. made
   * offline). Signing out deletes them together with the local cache.
   */
  static hasPendingWrites(): Promise<boolean> {
    return logged('hasPendingWrites', async () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timedOut = new Promise<boolean>(resolve => {
        timer = setTimeout(() => resolve(true), PENDING_WRITES_TIMEOUT_MS);
      });
      try {
        return await Promise.race([waitForPendingWrites(db).then(() => false), timedOut]);
      } finally {
        clearTimeout(timer);
      }
    });
  }

  /**
   * Signs out and deletes the local Firestore cache and the app's LocalStorage entries (workout
   * draft, legacy templates), so no data stays on a shared device or reaches the next account.
   * Writes not yet sent to the server are deleted too (`hasPendingWrites`). The Firestore instance
   * cannot be used afterwards: the caller reloads the app.
   */
  static signOut(): Promise<void> {
    return logged('signOut', async () => {
      await signOut(auth);
      Object.values(STORAGE_KEYS).forEach(key => LocalStorageService.remove(key));
      await terminate(db);
      await clearIndexedDbPersistence(db);
    });
  }

  /** The data owner is the account whose uid has a document in `owners` (see firestore.rules). */
  static isOwner(uid: string): Promise<boolean> {
    return logged('isOwner', async () => (await getDoc(doc(db, OWNERS_COLLECTION, uid))).exists());
  }
}
