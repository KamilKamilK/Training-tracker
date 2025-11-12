import React from 'react';
import { WorkoutTemplate } from '../../types/index.js';

interface Props {
  templates?: WorkoutTemplate[];
}

const PlanTab: React.FC<Props> = ({ templates = [] }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Plan Treningowy</h2>

      {/* Układ tygodniowy */}
      <div className="bg-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-blue-400">📅 Układ Tygodniowy (roboczo)</h3>
        <div className="space-y-2">
          {templates.map(t => (
            <div key={t.id} className="flex items-center gap-3 bg-slate-600 p-3 rounded">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              ></div>
              <span className="font-bold w-32">{t.name}</span>
              <span className="flex-1 text-sm text-slate-300">{t.category}</span>
              <span className="text-slate-400 text-sm">{t.estimatedDuration} min</span>
            </div>
          ))}
        </div>
      </div>

      {/* Szczegóły szablonów */}
      <div className="bg-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-3">Szczegóły Szablonów</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className={`${t.color} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{t.icon}</span>
                <h4 className="font-bold">{t.name}</h4>
              </div>
              <p className="text-sm opacity-90 mb-2">{t.description}</p>
              <div className="text-xs opacity-80">
                {t.exercises.length} ćwiczeń · {t.estimatedDuration} min
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlanTab;
