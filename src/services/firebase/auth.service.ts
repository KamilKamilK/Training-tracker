import { GoogleAuthProvider, User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { clearIndexedDbPersistence, doc, getDoc, terminate } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig.js';

const OWNERS_COLLECTION = 'owners';

export class AuthService {
  static onUserChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  static async signIn(): Promise<void> {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      console.error('AuthService.signIn error:', err);
      throw err;
    }
  }

  /**
   * Signs out and deletes the local Firestore cache, so no data stays on a shared device. The
   * Firestore instance cannot be used afterwards: the caller reloads the app.
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      await terminate(db);
      await clearIndexedDbPersistence(db);
    } catch (err) {
      console.error('AuthService.signOut error:', err);
      throw err;
    }
  }

  /** The data owner is the account whose uid has a document in `owners` (see firestore.rules). */
  static async isOwner(uid: string): Promise<boolean> {
    try {
      const snapshot = await getDoc(doc(db, OWNERS_COLLECTION, uid));
      return snapshot.exists();
    } catch (err) {
      console.error('AuthService.isOwner error:', err);
      throw err;
    }
  }
}
