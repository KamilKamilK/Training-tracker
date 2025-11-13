import React from 'react';
import { Workout } from '../../../types/index.js';
import { Trash2, Eye } from 'lucide-react';
import { formatDate } from '../../../utils/date.utils.js';
import { getTotalSets, getExerciseCount, sortByDateDesc } from '../../../utils/workout.utils.js';
import { useModal } from './../../../hooks/useModels.js';
import { WorkoutModal } from './WorkoutModal.js';

interface HistoryTabProps {
  workouts: Workout[];
  onDelete: (id: string) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ workouts, onDelete }) => {
  const { isOpen, data: selectedWorkout, open, close } = useModal<Workout>();

  if (workouts.length === 0) {
    return <p className="text-slate-400 text-center py-4">Brak treningów w historii.</p>;
  }

  const sortedWorkouts = sortByDateDesc(workouts);

  return (
    <>
      <div className="space-y-3">
        <h2 className="text-2xl font-bold mb-4">📜 Historia Treningów</h2>
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
                  onClick={() => {
                    if (confirm('Czy na pewno chcesz usunąć ten trening?')) {
                      onDelete(workout.id);
                    }
                  }}
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
    </>
  );
};