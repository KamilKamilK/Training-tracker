import React from 'react';
import { WorkoutTemplate, Workout } from '../../../types/index.js';
import { getLastWorkout } from '../../../utils/workout.utils.js';
import { formatDate } from '../../../utils/date.utils.js';

interface TemplateGridProps {
  templates: WorkoutTemplate[];
  workouts: Workout[];
  onStart: (template: WorkoutTemplate) => void;
}

export const TemplateGrid: React.FC<TemplateGridProps> = ({ templates, workouts, onStart }) => {
  return (
    <div className="grid md:grid-cols-3 gap-4 mb-6">
      {templates.map(template => {
        const last = getLastWorkout(workouts, template.name);
        return (
          <div
            key={template.id}
            className={`${template.color} rounded-lg p-4 hover:opacity-90 transition-all cursor-pointer`}
            onClick={() => onStart(template)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{template.icon}</span>
              <h3 className="text-xl font-bold">{template.name}</h3>
            </div>
            <p className="text-sm opacity-90 mb-2">{template.description}</p>
            {last && (
              <p className="text-xs opacity-75 mb-3">Ostatnio: {formatDate(last.date)}</p>
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
  );
};