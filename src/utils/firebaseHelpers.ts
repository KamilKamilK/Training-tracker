import { db } from '../lib/firebaseConfig.js';
import { collection, addDoc } from 'firebase/firestore';
import { Workout, Measurement } from '../types/index.js';

export const saveWorkoutToFirebase = async (workout: Workout) => {
  try {
    const colRef = collection(db, 'workouts');
    await addDoc(colRef, workout);
  } catch (err) {
    console.error('❌ Błąd zapisu do Firebase:', err);
  }
};

export const saveMeasurementToFirebase = async (measurement: Measurement) => {
  try {
    const colRef = collection(db, 'measurements');
    await addDoc(colRef, measurement);
    console.log('✅ Pomiar zapisany w Firebase');
  } catch (err) {
    console.error('❌ Błąd zapisu pomiaru do Firebase:', err);
  }
};