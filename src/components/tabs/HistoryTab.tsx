// src/components/tabs/HistoryTab.tsx
import React from 'react';
import type { Workout } from './../../types/index.js';
import { Trash2, Eye } from 'lucide-react';

interface HistoryTabProps {
  workouts: Workout[];
  onView: (workout: Workout) => void;  
  onDelete: (id: string) => void;    
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ workouts, onView, onDelete }) => {
  if (workouts.length === 0) {
    return <p className="text-slate-400 text-center py-4">Brak treningów w historii.</p>;
  }

  return (
    <div className="space-y-3">
      {[...workouts]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((workout) => (
          <div key={workout.id} className="bg-slate-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg">{workout.type}</h3>
                <p className="text-slate-400 text-sm">
                  {new Date(workout.date).toLocaleDateString('pl-PL')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onView(workout)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Eye size={20} />
                </button>
                <button
                  onClick={() => onDelete(workout.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            <div className="text-sm text-slate-400">
              {workout.exercises.filter(e => e.sets.length > 0).length} ćwiczeń ·{' '}
              {workout.exercises.reduce((sum, e) => sum + e.sets.length, 0)} serii
            </div>
          </div>
        ))}
    </div>
  );
};
