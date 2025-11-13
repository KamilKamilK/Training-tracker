export interface WorkoutSet {
  weight: string;
  reps: string;
  rir: string;
}

export interface Exercise {
  name: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  type: string;
  date: string;
  exercises: Exercise[];
  notes: string;
  duration?: number;
  completed?: boolean;
}