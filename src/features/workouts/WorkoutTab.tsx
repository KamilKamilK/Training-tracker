import React from 'react';
import { Workout } from '../../types/index.js';
import { WorkoutForm } from './WorkoutForm.js';

interface WorkoutTabProps {
  currentWorkout: Workout | null;
  isFinishing: boolean;
  error: string | null;
  onDismissError: () => void;
  onAddSet: (exerciseIndex: number) => void;
  onUpdateSet: (exIdx: number, setIdx: number, field: 'weight' | 'reps' | 'rir', value: string) => void;
  onRemoveSet: (exIdx: number, setIdx: number) => void;
  onFinishWorkout: () => void;
}

export const WorkoutTab: React.FC<WorkoutTabProps> = ({
  currentWorkout,
  isFinishing,
  error,
  onDismissError,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onFinishWorkout,
}) => {
  if (!currentWorkout) {
    return (
      <div className="text-center py-12 text-slate-400">
        🏋️ Brak aktywnego treningu. Wybierz plan na stronie głównej.
      </div>
    );
  }

  return (
    <WorkoutForm
      workout={currentWorkout}
      isFinishing={isFinishing}
      error={error}
      onDismissError={onDismissError}
      onAddSet={onAddSet}
      onUpdateSet={onUpdateSet}
      onRemoveSet={onRemoveSet}
      onFinishWorkout={onFinishWorkout}
    />
  );
};