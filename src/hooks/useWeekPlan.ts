// hooks/useWeekPlan.ts
import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig.js';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface WeekPlan {
  [key: string]: string | null;
}

export interface WeekPlanDocument {
  plan: WeekPlan;
  updatedAt: string;
//   userId?: string; // Opcjonalnie, jeśli masz auth
}

export const useWeekPlan = () => {
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // ID dokumentu - możesz zmienić na userId gdy będziesz mieć auth
  const WEEK_PLAN_DOC_ID = 'default_week_plan';

  useEffect(() => {
    loadWeekPlan();
  }, []);

  const loadWeekPlan = async () => {
    setIsLoading(true);
    try {
      const docRef = doc(db, 'weekPlans', WEEK_PLAN_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as WeekPlanDocument;
        setWeekPlan(data.plan);
        setLastSaved(data.updatedAt);
        console.log('✅ Plan tygodniowy załadowany z Firebase');
      } else {
        console.log('📝 Brak zapisanego planu - używam domyślnego');
      }
    } catch (error) {
      console.error('❌ Błąd wczytywania planu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveWeekPlan = async (plan: WeekPlan): Promise<boolean> => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'weekPlans', WEEK_PLAN_DOC_ID);
      const updatedAt = new Date().toISOString();
      
      const docData: WeekPlanDocument = {
        plan,
        updatedAt
      };

      await setDoc(docRef, docData);
      setLastSaved(updatedAt);
      console.log('✅ Plan zapisany do Firebase');
      return true;
    } catch (error) {
      console.error('❌ Błąd zapisu planu:', error);
      alert('Błąd zapisu planu do bazy danych');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateDay = async (day: DayOfWeek, templateId: string | null) => {
    const updatedPlan = { ...weekPlan, [day]: templateId };
    setWeekPlan(updatedPlan);
    
    // Auto-save do Firebase
    await saveWeekPlan(updatedPlan);
  };

  const clearDay = async (day: DayOfWeek) => {
    return updateDay(day, null);
  };

  const clearAllDays = async () => {
    const emptyPlan: WeekPlan = {
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null
    };
    setWeekPlan(emptyPlan);
    return saveWeekPlan(emptyPlan);
  };

  // Statystyki planu
  const getStats = () => {
    const activeDays = Object.values(weekPlan).filter(v => v !== null).length;
    const restDays = 7 - activeDays;
    
    return {
      activeDays,
      restDays,
      workloadPercentage: Math.round((activeDays / 7) * 100)
    };
  };

  return {
    weekPlan,
    isLoading,
    isSaving,
    lastSaved,
    updateDay,
    clearDay,
    clearAllDays,
    saveWeekPlan: () => saveWeekPlan(weekPlan),
    getStats
  };
};