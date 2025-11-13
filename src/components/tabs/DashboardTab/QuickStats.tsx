import React from 'react';
import { Workout, Measurement } from '../../../types/index.js';
import { filterByMonth, filterByWeek } from '../../../utils/workout.utils.js';
import { getLastMeasurement } from '../../../utils/measurement.utils.js';

interface QuickStatsProps {
  workouts: Workout[];
  measurements: Measurement[];
}

export const QuickStats: React.FC<QuickStatsProps> = ({ workouts, measurements }) => {
  const monthlyCount = filterByMonth(workouts).length;
  const weeklyCount = filterByWeek(workouts).length;
  const lastMeasurement = getLastMeasurement(measurements);

  return (
    <div className="grid md:grid-cols-3 gap-4 mb-6">
      <div className="bg-slate-700 rounded-lg p-4">
        <h3 className="text-slate-400 text-sm mb-2">Ten Tydzień</h3>
        <p className="text-3xl font-bold">{weeklyCount}</p>
      </div>
      <div className="bg-slate-700 rounded-lg p-4">
        <h3 className="text-slate-400 text-sm mb-2">Ten Miesiąc</h3>
        <p className="text-3xl font-bold">{monthlyCount}</p>
      </div>
      <div className="bg-slate-700 rounded-lg p-4">
        <h3 className="text-slate-400 text-sm mb-2">Ostatnia Waga</h3>
        <p className="text-3xl font-bold">
          {lastMeasurement ? `${lastMeasurement.weight} kg` : '—'}
        </p>
      </div>
    </div>
  );
};