import React from 'react';
import { WorkoutTemplate } from '../../../types/index.js';

interface PlanTabProps {
  templates: WorkoutTemplate[];
}

export const PlanTab: React.FC<PlanTabProps> = ({ templates }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">📅 Plan Treningowy</h2>

      {/* Układ tygodniowy */}
      <div className="bg-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-blue-400">Układ Tygodniowy (propozycja)</h3>
        <div className="space-y-3">
          {templates.map((t, idx) => (
            <div key={t.id} className="flex items-center gap-3 bg-slate-600 p-3 rounded">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-sm font-bold">
                {idx + 1}
              </div>
              <span className="font-bold w-40">{t.name}</span>
              <span className="flex-1 text-sm text-slate-300 capitalize">{t.category}</span>
              <span className="text-slate-400 text-sm">⏱️ {t.estimatedDuration} min</span>
              <span className="text-slate-400 text-sm">📊 {t.exercises.length} ćw.</span>
            </div>
          ))}
        </div>
      </div>

      {/* Szczegóły szablonów */}
      <div className="bg-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-3">🔍 Szczegóły Szablonów</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className={`${t.color} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{t.icon}</span>
                <h4 className="font-bold">{t.name}</h4>
              </div>
              <p className="text-sm opacity-90 mb-3">{t.description}</p>
              <div className="space-y-1">
                <p className="text-xs opacity-80 font-semibold">Ćwiczenia:</p>
                <ul className="text-xs opacity-75 space-y-1 ml-2">
                  {t.exercises.slice(0, 3).map((ex, idx) => (
                    <li key={idx}>• {ex}</li>
                  ))}
                  {t.exercises.length > 3 && (
                    <li className="italic">... i więcej ({t.exercises.length - 3})</li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wskazówki */}
      <div className="bg-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-3">💡 Wskazówki</h3>
        <ul className="space-y-2 text-slate-300">
          <li>✅ Staraj się trenować regularnie 3-5 razy w tygodniu</li>
          <li>✅ Rób 1-2 dni przerwy między treningami tej samej partii</li>
          <li>✅ Śledź progresję obciążeń w każdym ćwiczeniu</li>
          <li>✅ Dostosuj RIR (Reps In Reserve) do swojego poziomu</li>
          <li>✅ Pamiętaj o odpowiedniej regeneracji i nawodnieniu</li>
        </ul>
      </div>
    </div>
  );
};