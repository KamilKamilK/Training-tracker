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
import { clearIndexedDbPersistence, doc, getDoc, terminate } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig.js';

const OWNERS_COLLECTION = 'owners';

/** The part of the Firebase user the app relies on. */
export type AuthUser = Pick<User, 'uid' | 'email' | 'emailVerified'>;

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
   * Signs out and deletes the local Firestore cache, so no data stays on a shared device. The
   * Firestore instance cannot be used afterwards: the caller reloads the app.
   */
  static signOut(): Promise<void> {
    return logged('signOut', async () => {
      await signOut(auth);
      await terminate(db);
      await clearIndexedDbPersistence(db);
    });
  }

  /** The data owner is the account whose uid has a document in `owners` (see firestore.rules). */
  static isOwner(uid: string): Promise<boolean> {
    return logged('isOwner', async () => (await getDoc(doc(db, OWNERS_COLLECTION, uid))).exists());
  }
}
