import React from 'react';
import { Plus } from 'lucide-react';
import { Workout, Measurement, WorkoutTemplate } from './../../types/index.js';

interface DashboardTabProps {
  workouts: Workout[];
  measurements: Measurement[];
  templates: WorkoutTemplate[];
  onStartWorkout: (template: WorkoutTemplate) => void;
  // onSaveData: (workout: Workout) => Promise<void>;
  onAddMeasurement: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  workouts,
  measurements,
  templates,
  onStartWorkout,
  // onSaveData,
  onAddMeasurement
}) => {
  const getLastWorkout = (templateName: string): Workout | undefined => {
    return workouts.filter(w => w.type === templateName).slice(-1)[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Rozpocznij Trening</h2>
        {/* <button
          onClick={onSaveData}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-all"
        >
          <Save size={18} />
          Zapisz Dane
        </button> */}
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        {templates.map(template => {
          const last = getLastWorkout(template.name);
          return (
            <div 
              key={template.id} 
              className={`${template.color} rounded-lg p-4 hover:opacity-90 transition-all cursor-pointer`}
              onClick={() => onStartWorkout(template)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{template.icon}</span>
                <h3 className="text-xl font-bold">{template.name}</h3>
              </div>
              <p className="text-sm opacity-90 mb-2">{template.description}</p>
              {last && (
                <p className="text-xs opacity-75 mb-3">
                  Ostatnio: {new Date(last.date).toLocaleDateString('pl-PL')}
                </p>
              )}
              <div className="flex gap-2 text-xs opacity-75">
                <span>⏱️ {template.estimatedDuration} min</span>
                <span>•</span>
                <span>📊 {template.exercises.length} ćw.</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-700 rounded-lg p-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Pomiary</h3>
          <button
            onClick={onAddMeasurement}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-all"
          >
            <Plus size={16} />
            Dodaj
          </button>
        </div>
        {measurements.length === 0 ? (
          <p className="text-slate-400 text-center py-4">Brak pomiarów. Dodaj pierwszy!</p>
        ) : (
          <div className="space-y-2">
            {measurements.slice(-5).reverse().map((m, idx) => (
              <div key={idx} className="flex justify-between bg-slate-600 p-3 rounded">
                <span>{new Date(m.date).toLocaleDateString('pl-PL')}</span>
                <span className="font-bold">{m.weight} kg | {m.waist} cm</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};