import { db } from '../lib/firebaseConfig.js';
import { collection, addDoc } from 'firebase/firestore';
import { Workout } from '../types/index.js';

export const saveWorkoutToFirebase = async (workout: Workout) => {
  try {
    const colRef = collection(db, 'workouts');
    await addDoc(colRef, workout);
  } catch (err) {
    console.error('❌ Błąd zapisu do Firebase:', err);
  }
};
