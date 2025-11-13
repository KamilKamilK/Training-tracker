import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig.js';
import { Workout } from '../../types/index.js';

const COLLECTION_NAME = 'workouts';

export class WorkoutsService {
  private static collection = collection(db, COLLECTION_NAME);

  static async getAll(): Promise<Workout[]> {
    try {
      const snapshot = await getDocs(this.collection);
      return snapshot.docs.map(doc => {
        const data = doc.data() as Omit<Workout, 'id'>;
        return {
          id: doc.id,
          type: data.type,
          date: data.date,
          exercises: data.exercises || [],
          notes: data.notes || '',
          duration: data.duration,
          completed: data.completed,
        };
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
        const docRef = doc(this.collection, id);
        await updateDoc(docRef, data);
        return id;
      } else {
        const docRef = await addDoc(this.collection, data);
        return docRef.id;
      }
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

  static async update(id: string, data: Partial<Omit<Workout, 'id'>>): Promise<void> {
    try {
      const docRef = doc(this.collection, id);
      await updateDoc(docRef, data);
    } catch (err) {
      console.error('WorkoutsService.update error:', err);
      throw err;
    }
  }
}