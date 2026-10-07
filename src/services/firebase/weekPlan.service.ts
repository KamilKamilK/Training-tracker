import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig.js';
import { WeekPlanDocument } from '../../types/index.js';
import { parseWeekPlanDocument } from '../../utils/parse.utils.js';

const COLLECTION_NAME = 'weekPlans';
const WEEK_PLAN_DOC_ID = 'default_week_plan';

export class WeekPlanService {
  private static docRef = doc(db, COLLECTION_NAME, WEEK_PLAN_DOC_ID);

  /** Returns null when no plan is saved yet or the saved document has an unexpected shape. */
  static async get(): Promise<WeekPlanDocument | null> {
    try {
      const snapshot = await getDoc(this.docRef);
      if (!snapshot.exists()) return null;
      const document = parseWeekPlanDocument(snapshot.data());
      if (!document) {
        console.warn('WeekPlanService.get: invalid document', WEEK_PLAN_DOC_ID);
      }
      return document;
    } catch (err) {
      console.error('WeekPlanService.get error:', err);
      throw err;
    }
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
