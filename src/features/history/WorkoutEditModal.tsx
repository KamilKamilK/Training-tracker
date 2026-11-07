import { useState } from 'react';
import { Workout, WorkoutSet } from '../../types/index.js';
import { Modal } from '../../components/common/Modal.js';
import { ErrorBanner } from '../../components/common/ErrorBanner.js';
import { ExerciseItem } from '../workouts/ExerciseItem.js';

interface WorkoutEditModalProps {
  workout: Workout;
  error: string | null;
  onDismissError: () => void;
  onSave: (workout: Workout) => Promise<boolean>;
  onClose: () => void;
}

export const WorkoutEditModal = ({ workout, error, onDismissError, onSave, onClose }: WorkoutEditModalProps) => {
  const [draft, setDraft] = useState(() => structuredClone(workout));
  const [isSaving, setIsSaving] = useState(false);

  const updateSets = (exerciseIndex: number, update: (sets: WorkoutSet[]) => WorkoutSet[]) => {
    setDraft(previous => ({
      ...previous,
      exercises: previous.exercises.map((exercise, index) =>
        index === exerciseIndex ? { ...exercise, sets: update(exercise.sets) } : exercise,
      ),
    }));
  };

  const save = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const saved = await onSave(draft);
    setIsSaving(false);
    if (saved) onClose();
  };

  return (
    <Modal isOpen title={`Edytuj trening: ${workout.type}`} onClose={() => { if (!isSaving) onClose(); }}>
      <fieldset disabled={isSaving} className="space-y-4 min-w-0">
        {draft.exercises.map((exercise, index) => (
          <ExerciseItem
            key={index}
            exercise={exercise}
            exerciseIndex={index}
            onAddSet={() => updateSets(index, sets => [...sets, { weight: '', reps: '', rir: '' }])}
            onUpdateSet={(setIndex, field, value) => updateSets(index, sets => sets.map((set, i) =>
              i === setIndex ? { ...set, [field]: value } : set,
            ))}
            onRemoveSet={setIndex => updateSets(index, sets => sets.filter((_, i) => i !== setIndex))}
          />
        ))}
        <div>
          <label htmlFor="workout-edit-notes" className="block mb-1">Notatki treningu</label>
          <textarea
            id="workout-edit-notes"
            value={draft.notes}
            maxLength={2000}
            onChange={event => setDraft(previous => ({ ...previous, notes: event.target.value }))}
            className="w-full bg-slate-700 rounded-lg p-2"
          />
        </div>
        {error && <ErrorBanner message={error} onDismiss={onDismissError} />}
        <div className="flex flex-wrap justify-end gap-3">
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 rounded-lg px-4 py-2">Anuluj</button>
          <button onClick={() => void save()} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg px-4 py-2">
            {isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </div>
      </fieldset>
    </Modal>
  );
};
