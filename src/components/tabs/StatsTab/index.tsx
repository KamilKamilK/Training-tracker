import React from 'react';
import { Workout, Measurement } from '../../../types/index.js';
import { filterByMonth, filterByWeek } from '../../../utils/workout.utils.js';
import { formatDate } from '../../../utils/date.utils.js';
import { calculateWeightDiff, calculateWaistDiff } from '../../../utils/measurement.utils.js';

interface StatsTabProps {
  workouts: Workout[];
  measurements: Measurement[];
}

export const StatsTab: React.FC<StatsTabProps> = ({ workouts, measurements }) => {
  const total = workouts.length;
  const thisMonth = filterByMonth(workouts).length;
  const thisWeek = filterByWeek(workouts).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">📊 Twoje Postępy</h2>

      {/* Statystyki treningów */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-700 rounded-lg p-4">
          <h3 className="text-slate-400 text-sm mb-2">Treningi Łącznie</h3>
          <p className="text-3xl font-bold">{total}</p>
        </div>
        <div className="bg-slate-700 rounded-lg p-4">
          <h3 className="text-slate-400 text-sm mb-2">Ten Miesiąc</h3>
          <p className="text-3xl font-bold">{thisMonth}</p>
        </div>
        <div className="bg-slate-700 rounded-lg p-4">
          <h3 className="text-slate-400 text-sm mb-2">Ten Tydzień</h3>
          <p className="text-3xl font-bold">{thisWeek}</p>
        </div>
      </div>

      {/* Progresja pomiarów */}
      {measurements.length > 1 && (
        <div className="bg-slate-700 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-4">📈 Progresja Wagi i Talii</h3>
          <div className="space-y-2">
            {measurements.slice(-10).map((m, idx) => {
              const all = measurements;
              const i = all.indexOf(m);
              const prev = i > 0 ? all[i - 1] : null;
              const weightDiff = prev ? calculateWeightDiff(m, prev) : 0;
              const waistDiff = prev ? calculateWaistDiff(m, prev) : 0;

              return (
                <div key={idx} className="flex justify-between items-center bg-slate-600 p-3 rounded">
                  <span className="text-slate-300">{formatDate(m.date)}</span>
                  <div className="flex gap-4">
                    <span className="font-bold">
                      {m.weight} kg
                      {prev && (
                        <span className={`ml-2 text-sm ${weightDiff < 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {weightDiff > 0 ? '+' : ''}{weightDiff}
                        </span>
                      )}
                    </span>
                    <span className="font-bold">
                      {m.waist} cm
                      {prev && (
                        <span className={`ml-2 text-sm ${waistDiff < 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {waistDiff > 0 ? '+' : ''}{waistDiff}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {measurements.length <= 1 && (
        <div className="bg-slate-700 rounded-lg p-6 text-center text-slate-400">
          <p>Dodaj więcej pomiarów, aby zobaczyć progresję 📊</p>
        </div>
      )}
    </div>
  );
};