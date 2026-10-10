import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig.js';
import { WeekPlanDocument } from '../../types/index.js';
import { parseWeekPlanDocument } from '../../utils/parse.utils.js';

const COLLECTION_NAME = 'weekPlans';
const WEEK_PLAN_DOC_ID = 'default_week_plan';

export class WeekPlanService {
  private static docRef = doc(db, COLLECTION_NAME, WEEK_PLAN_DOC_ID);

  /** Streams the plan; null when no plan is saved yet or the saved document has an unexpected shape. */
  static subscribe(onChange: (document: WeekPlanDocument | null) => void, onError: (error: unknown) => void): () => void {
    return onSnapshot(
      this.docRef,
      snapshot => {
        if (!snapshot.exists()) {
          onChange(null);
          return;
        }
        const document = parseWeekPlanDocument(snapshot.data());
        if (!document) {
          console.warn('WeekPlanService.subscribe: invalid document', WEEK_PLAN_DOC_ID);
        }
        onChange(document);
      },
      error => {
        console.error('WeekPlanService.subscribe error:', error);
        onError(error);
      },
    );
  }

  static async save(document: WeekPlanDocument): Promise<void> {
    try {
      await setDoc(this.docRef, document);
    } catch (err) {
      console.error('WeekPlanService.save error:', err);
      throw err;
    }
  }
}
