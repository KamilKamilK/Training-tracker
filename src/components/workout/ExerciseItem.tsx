import React from 'react';
import { Exercise } from '../../types/index.js';
import { SetInput } from './SetInput.js';
import { Plus } from 'lucide-react';

interface ExerciseItemProps {
  exercise: Exercise;
  exerciseIndex: number;
  onAddSet: () => void;
  onUpdateSet: (setIdx: number, field: 'weight' | 'reps' | 'rir', value: string) => void;
  onRemoveSet: (setIdx: number) => void;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
}) => (
  <div className="bg-slate-700 rounded-lg p-4 mb-4">
    <h3 className="font-bold text-lg mb-2">{exercise.name}</h3>

    {exercise.sets.length === 0 ? (
      <p className="text-slate-400 text-sm mb-2">Brak serii — dodaj pierwszą</p>
    ) : (
      exercise.sets.map((set, idx) => (
        <SetInput
          key={idx}
          setIndex={idx}
          weight={set.weight}
          reps={set.reps}
          rir={set.rir}
          onChange={(field, value) => onUpdateSet(idx, field, value)}
          onRemove={() => onRemoveSet(idx)}
        />
      ))
    )}

    <button
      onClick={onAddSet}
      className="mt-2 flex items-center gap-1 text-blue-400 hover:text-blue-600 text-sm"
    >
      <Plus size={14} /> Dodaj serię
    </button>
  </div>
);