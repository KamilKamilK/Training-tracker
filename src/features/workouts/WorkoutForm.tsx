import React, { useState } from 'react';
import { Workout } from '../../types/index.js';
import { ExerciseItem } from './ExerciseItem.js';
import { Save, X } from 'lucide-react';
import { ErrorBanner } from '../../components/common/ErrorBanner.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';

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
  onUpdateNotes: (notes: string) => void;
  onAbandonWorkout: () => void;
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
  onUpdateNotes,
  onAbandonWorkout,
  onFinishWorkout,
}) => {
  const [isAbandonConfirmOpen, setIsAbandonConfirmOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{workout.type}</h2>

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

      <div>
        <label htmlFor="workout-notes" className="block mb-1">Notatki treningu</label>
        <textarea
          id="workout-notes"
          value={workout.notes}
          maxLength={2000}
          onChange={event => onUpdateNotes(event.target.value)}
          className="w-full bg-slate-700 rounded-lg p-2"
        />
      </div>

      {error && <ErrorBanner message={error} onDismiss={onDismissError} />}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setIsAbandonConfirmOpen(true)}
          disabled={isFinishing}
          className="bg-slate-600 hover:bg-slate-500 disabled:bg-gray-600 px-6 py-2 rounded-lg flex items-center gap-2"
        >
          <X size={18} /> Porzuć trening
        </button>
        <button
          onClick={onFinishWorkout}
          disabled={isFinishing}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg flex items-center gap-2"
        >
          <Save size={18} /> {isFinishing ? 'Zapisywanie...' : 'Zakończ trening'}
        </button>
      </div>

      <ConfirmDialog
        isOpen={isAbandonConfirmOpen}
        title="Porzucić trening?"
        confirmLabel="Porzuć trening"
        cancelLabel="Wróć do treningu"
        onConfirm={() => {
          setIsAbandonConfirmOpen(false);
          onAbandonWorkout();
        }}
        onCancel={() => setIsAbandonConfirmOpen(false)}
      >
        <p>
          Trening „{workout.type}” nie zostanie zapisany w Historii. Wpisane serie i notatki zostaną usunięte z tej
          przeglądarki.
        </p>
      </ConfirmDialog>
    </div>
  );
};
