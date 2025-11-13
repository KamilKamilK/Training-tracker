import { useState, useEffect } from 'react';
import { Workout } from '../types/index.js';
import { WorkoutsService } from '../services/firebase/workouts.service.js';
import { sortByDateDesc } from '../utils/workout.utils.js';

export const useFirebaseStorage = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await WorkoutsService.getAll();
        setWorkouts(sortByDateDesc(data));
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
      const id = await WorkoutsService.save(workout);
      const updatedWorkout = { ...workout, id };
      
      setWorkouts(prev => 
        sortByDateDesc([...prev.filter(w => w.id !== id), updatedWorkout])
      );
      
      console.log('💾 Trening zapisany!');
    } catch (err) {
      console.error('Błąd zapisu treningu:', err);
    }
  };

  const deleteWorkout = async (id: string) => {
    try {
      await WorkoutsService.delete(id);
      setWorkouts(prev => prev.filter(w => w.id !== id));
      console.log('🗑️ Trening usunięty!');
    } catch (err) {
      console.error('Błąd usuwania treningu:', err);
    }
  };

  return { workouts, saveWorkout, deleteWorkout, isLoading };
};