import React from 'react';
import { Workout } from '../../types/index.js';
import { ExerciseItem } from './ExerciseItem.js';
import { Save } from 'lucide-react';
import { ErrorBanner } from '../common/ErrorBanner.js';

interface WorkoutFormProps {
  workout: Workout;
  isFinishing: boolean;
  error: string | null;
  onDismissError: () => void;
  onAddSet: (exerciseIndex: number) => void;
  onUpdateSet: (
    exIdx: number,
    setIdx: number,
    field: 'weight' | 'reps' | 'rir',
    value: string
  ) => void;
  onRemoveSet: (exIdx: number, setIdx: number) => void;
  onFinishWorkout: () => void;
}

export const WorkoutForm: React.FC<WorkoutFormProps> = ({
  workout,
  isFinishing,
  error,
  onDismissError,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onFinishWorkout,
}) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold mb-4">{workout.type}</h2>

    {workout.exercises.map((ex, i) => (
      <ExerciseItem
        key={i}
        exercise={ex}
        exerciseIndex={i}
        onAddSet={() => onAddSet(i)}
        onUpdateSet={(setIdx, field, val) => onUpdateSet(i, setIdx, field, val)}
        onRemoveSet={setIdx => onRemoveSet(i, setIdx)}
      />
    ))}

    {error && <ErrorBanner message={error} onDismiss={onDismissError} />}

    <div className="mt-6 flex justify-center">
      <button
        onClick={onFinishWorkout}
        disabled={isFinishing}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg flex items-center gap-2"
      >
        <Save size={18} /> {isFinishing ? 'Zapisywanie...' : 'Zakończ trening'}
      </button>
    </div>
  </div>
);