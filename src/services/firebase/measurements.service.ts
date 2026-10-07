import { collection, doc, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig.js';
import { Measurement } from '../../types/index.js';
import { parseMeasurement } from '../../utils/parse.utils.js';

const COLLECTION_NAME = 'measurements';

export class MeasurementsService {
  private static collection = collection(db, COLLECTION_NAME);

  /** Returns valid measurements; documents with an unexpected shape are skipped and reported by id. */
  static async getAll(): Promise<Measurement[]> {
    try {
      const snapshot = await getDocs(this.collection);
      return snapshot.docs.flatMap(document => {
        const measurement = parseMeasurement(document.id, document.data());
        if (!measurement) {
          console.warn('MeasurementsService.getAll: skipped invalid document', document.id);
          return [];
        }
        return [measurement];
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
