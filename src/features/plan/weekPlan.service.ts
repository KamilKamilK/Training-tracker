import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig.js';
import { WeekPlanDocument } from '../../types/index.js';
import { parseWeekPlanDocument } from '../../utils/parse.utils.js';

const COLLECTION_NAME = 'weekPlans';
const WEEK_PLAN_DOC_ID = 'default_week_plan';

/** The week plan of one account: users/{uid}/weekPlans/default_week_plan (ADR-0005). */
const weekPlan = (uid: string) => doc(db, 'users', uid, COLLECTION_NAME, WEEK_PLAN_DOC_ID);

export class WeekPlanService {
  /** Streams the plan; null when no plan is saved yet or the saved document has an unexpected shape. */
  static subscribe(
    uid: string,
    onChange: (document: WeekPlanDocument | null) => void,
    onError: (error: unknown) => void,
  ): () => void {
    return onSnapshot(
      weekPlan(uid),
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

  static async save(uid: string, document: WeekPlanDocument): Promise<void> {
    try {
      await setDoc(weekPlan(uid), document);
    } catch (err) {
      console.error('WeekPlanService.save error:', err);
      throw err;
    }
  }
}
