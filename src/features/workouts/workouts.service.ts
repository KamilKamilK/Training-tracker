import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig.js';
import { Workout } from '../../types/index.js';
import { parseWorkout } from '../../utils/parse.utils.js';

const COLLECTION_NAME = 'workouts';

export class WorkoutsService {
  private static collection = collection(db, COLLECTION_NAME);

  /**
   * Streams all valid workouts, from the local cache first and then from the server, including
   * writes not yet confirmed. Documents with an unexpected shape are skipped and reported by id.
   */
  static subscribe(onChange: (workouts: Workout[]) => void, onError: (error: unknown) => void): () => void {
    return onSnapshot(
      this.collection,
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
  static async save(workout: Workout): Promise<void> {
    try {
      const { id, ...data } = workout;
      await setDoc(doc(this.collection, id), data);
    } catch (err) {
      console.error('WorkoutsService.save error:', err);
      throw err;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.collection, id));
    } catch (err) {
      console.error('WorkoutsService.delete error:', err);
      throw err;
    }
  }
}
