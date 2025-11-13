import { collection, doc, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig.js';
import { Measurement } from '../../types/index.js';

const COLLECTION_NAME = 'measurements';

export class MeasurementsService {
  private static collection = collection(db, COLLECTION_NAME);

  static async getAll(): Promise<Measurement[]> {
    try {
      const snapshot = await getDocs(this.collection);
      return snapshot.docs.map(doc => {
        const data = doc.data() as Omit<Measurement, 'id'>;
        return {
          id: doc.id,
          date: data.date,
          weight: data.weight,
          waist: data.waist,
          bodyFat: data.bodyFat,
          photos: data.photos,
        };
      });
    } catch (err) {
      console.error('MeasurementsService.getAll error:', err);
      throw err;
    }
  }

  static async save(measurement: Omit<Measurement, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(this.collection, measurement);
      return docRef.id;
    } catch (err) {
      console.error('MeasurementsService.save error:', err);
      throw err;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.collection, id));
    } catch (err) {
      console.error('MeasurementsService.delete error:', err);
      throw err;
    }
  }
}