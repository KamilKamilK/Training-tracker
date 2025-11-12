import { useState, useEffect } from 'react';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig.js';
import type { Workout, Measurement } from '../types/index.js';

export const useFirebaseStorage = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const workoutsCol = collection(db, 'workouts');
  const measurementsCol = collection(db, 'measurements');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const workoutsSnap = await getDocs(workoutsCol);
        const workoutsFromFirebase: Workout[] = workoutsSnap.docs.map(doc => {
          const data = doc.data() as Omit<Workout, 'id'>;
          return {
            id: doc.id,
            type: data.type,
            date: data.date,
            exercises: data.exercises || [],
            notes: data.notes || '',
            duration: data.duration,
            completed: data.completed,
          };
        });
        setWorkouts(workoutsFromFirebase.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

        const measurementsSnap = await getDocs(measurementsCol);
        const measurementsFromFirebase: Measurement[] = measurementsSnap.docs.map(doc => {
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
        setMeasurements(measurementsFromFirebase);
      } catch (err) {
        console.error('Firebase fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveWorkout = async (workout: Workout) => {
    try {
      const { id, ...data } = workout;
      if (id) {
        const docRef = doc(workoutsCol, id);
        await updateDoc(docRef, data);
      } else {
        const docRef = await addDoc(workoutsCol, data);
        workout.id = docRef.id;
      }
      // aktualizacja stanu lokalnego natychmiast
      setWorkouts(prev => [...prev.filter(w => w.id !== workout.id), workout].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      console.log('💾 Dane zapisane!');
    } catch (err) {
      console.error('Błąd zapisu treningu:', err);
    }
  };

  const deleteWorkout = async (id: string) => {
    await deleteDoc(doc(workoutsCol, id));
    setWorkouts(prev => prev.filter(w => w.id !== id));
  };

  const saveMeasurement = async (measurement: Measurement) => {
    const docRef = await addDoc(measurementsCol, measurement);
    setMeasurements(prev => [...prev, { ...measurement, id: docRef.id }]);
  };

  return { workouts, measurements, setMeasurements, saveWorkout, deleteWorkout, saveMeasurement, isLoading };
};
