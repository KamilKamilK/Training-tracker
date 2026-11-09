import React, { useId } from 'react';
import { WorkoutTemplate, Workout } from '../../types/index.js';
import { getLastWorkout } from '../workouts/workout.utils.js';
import { formatDate } from '../../utils/date.utils.js';

interface TemplateGridProps {
  templates: WorkoutTemplate[];
  workouts: Workout[];
  onStart: (template: WorkoutTemplate) => void;
}

export const TemplateGrid: React.FC<TemplateGridProps> = ({ templates, workouts, onStart }) => {
  const baseId = useId();

  return (
    <div className="grid md:grid-cols-3 gap-4 mb-6">
      {templates.map((template, index) => {
        const last = getLastWorkout(workouts, template.name);
        const nameId = `${baseId}-${index}-name`;
        const detailsId = `${baseId}-${index}-details`;
        return (
          <button
            key={template.id}
            type="button"
            aria-labelledby={nameId}
            aria-describedby={detailsId}
            className={`${template.color} rounded-lg p-4 hover:opacity-90 transition-all cursor-pointer text-left`}
            onClick={() => onStart(template)}
          >
            <span className="flex items-center gap-2 mb-2">
              <span className="text-2xl" aria-hidden="true">{template.icon}</span>
              <span id={nameId} className="text-xl font-bold">{template.name}</span>
            </span>
            <span id={detailsId} className="block">
              <span className="block text-sm opacity-90 mb-2">{template.description}</span>
              {last && (
                <span className="block text-xs opacity-75 mb-3">Ostatnio: {formatDate(last.date)}</span>
              )}
              <span className="flex gap-2 text-xs opacity-75">
                <span>⏱️ {template.estimatedDuration} min</span>
                <span aria-hidden="true">•</span>
                <span>📊 {template.exercises.length} ćw.</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
