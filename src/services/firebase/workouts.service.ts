import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig.js';
import { Workout } from '../../types/index.js';
import { parseWorkout } from '../../utils/parse.utils.js';

const COLLECTION_NAME = 'workouts';

export class WorkoutsService {
  private static collection = collection(db, COLLECTION_NAME);

  /** Returns valid workouts; documents with an unexpected shape are skipped and reported by id. */
  static async getAll(): Promise<Workout[]> {
    try {
      const snapshot = await getDocs(this.collection);
      return snapshot.docs.flatMap(document => {
        const workout = parseWorkout(document.id, document.data());
        if (!workout) {
          console.warn('WorkoutsService.getAll: skipped invalid document', document.id);
          return [];
        }
        return [workout];
      });
    } catch (err) {
      console.error('WorkoutsService.getAll error:', err);
      throw err;
    }
  }

  static async save(workout: Workout): Promise<string> {
    try {
      const { id, ...data } = workout;

      if (id) {
        await updateDoc(doc(this.collection, id), data);
        return id;
      }
      const docRef = await addDoc(this.collection, data);
      return docRef.id;
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
