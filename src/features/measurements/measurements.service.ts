import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig.js';
import { Measurement } from '../../types/index.js';
import { parseMeasurement } from '../../utils/parse.utils.js';

const COLLECTION_NAME = 'measurements';

/** Measurements of one account: users/{uid}/measurements (ADR-0005). */
const measurements = (uid: string) => collection(db, 'users', uid, COLLECTION_NAME);

export class MeasurementsService {
  /** Streams all valid measurements; documents with an unexpected shape are skipped and reported by id. */
  static subscribe(
    uid: string,
    onChange: (measurements: Measurement[]) => void,
    onError: (error: unknown) => void,
  ): () => void {
    return onSnapshot(
      measurements(uid),
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

  static async save(uid: string, measurement: Omit<Measurement, 'id'>): Promise<void> {
    try {
      await addDoc(measurements(uid), measurement);
    } catch (err) {
      console.error('MeasurementsService.save error:', err);
      throw err;
    }
  }

  static async delete(uid: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(measurements(uid), id));
    } catch (err) {
      console.error('MeasurementsService.delete error:', err);
      throw err;
    }
  }
}
