import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig.js';
import { Workout } from '../../types/index.js';
import { parseWorkout } from '../../utils/parse.utils.js';

const COLLECTION_NAME = 'sessions';

/** Workouts of one account: users/{uid}/sessions (ADR-0005). */
const sessions = (uid: string) => collection(db, 'users', uid, COLLECTION_NAME);

export class WorkoutsService {
  /**
   * Streams all valid workouts, from the local cache first and then from the server, including
   * writes not yet confirmed. Documents with an unexpected shape are skipped and reported by id.
   */
  static subscribe(
    uid: string,
    onChange: (workouts: Workout[]) => void,
    onError: (error: unknown) => void,
  ): () => void {
    return onSnapshot(
      sessions(uid),
      snapshot => {
        onChange(
          snapshot.docs.flatMap(document => {
            const workout = parseWorkout(document.id, document.data());
            if (!workout) {
              console.warn('WorkoutsService.subscribe: skipped invalid document', document.id);
              return [];
            }
            return [workout];
          }),
        );
      },
      error => {
        console.error('WorkoutsService.subscribe error:', error);
        onError(error);
      },
    );
  }

  /**
   * Writes the workout under its own id, so saving the same workout again (e.g. after a reload
   * while the first write was still queued offline) never creates a duplicate.
   */
  static async save(uid: string, workout: Workout): Promise<void> {
    try {
      const { id, ...data } = workout;
      await setDoc(doc(sessions(uid), id), data);
    } catch (err) {
      console.error('WorkoutsService.save error:', err);
      throw err;
    }
  }

  static async delete(uid: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(sessions(uid), id));
    } catch (err) {
      console.error('WorkoutsService.delete error:', err);
      throw err;
    }
  }
}
