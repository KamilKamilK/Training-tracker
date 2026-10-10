import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig.js';
import { Measurement } from '../../types/index.js';
import { parseMeasurement } from '../../utils/parse.utils.js';

const COLLECTION_NAME = 'measurements';

export class MeasurementsService {
  private static collection = collection(db, COLLECTION_NAME);

  /** Streams all valid measurements; documents with an unexpected shape are skipped and reported by id. */
  static subscribe(onChange: (measurements: Measurement[]) => void, onError: (error: unknown) => void): () => void {
    return onSnapshot(
      this.collection,
      snapshot => {
        onChange(
          snapshot.docs.flatMap(document => {
            const measurement = parseMeasurement(document.id, document.data());
            if (!measurement) {
              console.warn('MeasurementsService.subscribe: skipped invalid document', document.id);
              return [];
            }
            return [measurement];
          }),
        );
      },
      error => {
        console.error('MeasurementsService.subscribe error:', error);
        onError(error);
      },
    );
  }

  static async save(measurement: Omit<Measurement, 'id'>): Promise<void> {
    try {
      await addDoc(this.collection, measurement);
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
