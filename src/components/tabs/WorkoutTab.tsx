import React from 'react';
import { Workout } from '../../types/index.js';
import { WorkoutForm } from '../workout/WorkoutForm.js';

interface WorkoutTabProps {
  currentWorkout: Workout | null;
  onAddSet: (exerciseIndex: number) => void;
  onUpdateSet: (exIdx: number, setIdx: number, field: string, value: string) => void;
  onRemoveSet: (exIdx: number, setIdx: number) => void;
  onFinishWorkout: () => void;
}

export const WorkoutTab: React.FC<WorkoutTabProps> = ({
  currentWorkout,
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
      onAddSet={onAddSet}
      onUpdateSet={onUpdateSet}
      onRemoveSet={onRemoveSet}
      onFinishWorkout={onFinishWorkout}
    />
  );
};
