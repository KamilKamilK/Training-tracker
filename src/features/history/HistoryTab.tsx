import React, { useState } from 'react';
import { Workout } from '../../types/index.js';
import { Trash2, Eye, Pencil } from 'lucide-react';
import { formatDate } from '../../utils/date.utils.js';
import { getTotalSets, getExerciseCount, sortByDateDesc } from '../workouts/workout.utils.js';
import { useModal } from '../../hooks/useModal.js';
import { WorkoutModal } from './WorkoutModal.js';
import { WorkoutEditModal } from './WorkoutEditModal.js';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.js';
import { ErrorBanner } from '../../components/common/ErrorBanner.js';
import { ErrorToast } from '../../components/common/Toasts.js';

interface HistoryTabProps {
  workouts: Workout[];
  onSave: (workout: Workout) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  error: string | null;
  onDismissError: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ workouts, onSave, onDelete, error, onDismissError }) => {
  const { isOpen, data: selectedWorkout, open, close } = useModal<Workout>();
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Workout | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pendingDelete || isDeleting) return;
    setIsDeleting(true);
    const deleted = await onDelete(pendingDelete.id);
    setIsDeleting(false);
    if (deleted) setPendingDelete(null);
  };

  const sortedWorkouts = sortByDateDesc(workouts);

  return (
    <>
      {error && !editingWorkout && !pendingDelete && <ErrorToast message={error} onDismiss={onDismissError} />}
      {workouts.length === 0 && <p className="text-slate-400 text-center py-4">Brak treningów w historii.</p>}
      <div className="space-y-3">
        {workouts.length > 0 && <h2 className="text-2xl font-bold mb-4">📜 Historia Treningów</h2>}
        {sortedWorkouts.map((workout) => (
          <div key={workout.id} className="bg-slate-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg">{workout.type}</h3>
                <p className="text-slate-400 text-sm">{formatDate(workout.date)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => open(workout)}
                  className="text-blue-400 hover:text-blue-300"
                  title="Podgląd"
                >
                  <Eye size={20} />
                </button>
                <button
                  onClick={() => { onDismissError(); setEditingWorkout(workout); }}
                  aria-label={`Edytuj trening ${workout.type} z ${formatDate(workout.date)}`}
                  title="Edytuj"
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Pencil size={20} />
                </button>
                <button
                  onClick={() => { onDismissError(); setPendingDelete(workout); }}
                  aria-label={`Usuń trening ${workout.type} z ${formatDate(workout.date)}`}
                  className="text-red-400 hover:text-red-300"
                  title="Usuń"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            <div className="text-sm text-slate-400">
              {getExerciseCount(workout)} ćwiczeń · {getTotalSets(workout)} serii
            </div>
          </div>
        ))}
      </div>

      {isOpen && selectedWorkout && (
        <WorkoutModal workout={selectedWorkout} onClose={close} />
      )}
      {editingWorkout && (
        <WorkoutEditModal
          key={editingWorkout.id}
          workout={editingWorkout}
          onSave={onSave}
          onClose={() => setEditingWorkout(null)}
          error={error}
          onDismissError={onDismissError}
        />
      )}
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Usunąć trening?"
        confirmLabel="Usuń"
        cancelLabel="Anuluj"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        isPending={isDeleting}
      >
        <p>Trening „{pendingDelete?.type}” z {pendingDelete && formatDate(pendingDelete.date)} zostanie trwale usunięty.</p>
        {error && <ErrorBanner message={error} onDismiss={onDismissError} />}
      </ConfirmDialog>
    </>
  );
};
