// src/components/tabs/WorkoutCard.tsx
import React from 'react';
import { WorkoutTemplate } from '../../types/index.js';
import { Trash2, Edit, Copy } from 'lucide-react';

interface WorkoutCardProps {
  template: WorkoutTemplate;
  onEdit?: (template: WorkoutTemplate) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onClick?: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  template,
  onEdit,
  onDelete,
  onDuplicate,
  onClick
}) => {
  return (
    <div
      className={`${template.color} rounded-lg p-4 hover:opacity-90 transition-all cursor-pointer flex flex-col justify-between`}
      onClick={onClick}
    >
      {/* Nagłówek: ikona + nazwa */}
      <div className="flex items-center gap-2 mb-2">
        {template.icon && <span className="text-2xl">{template.icon}</span>}
        <h3 className="text-xl font-bold">{template.name}</h3>
      </div>

      {/* Opis */}
      <p className="text-sm opacity-90 mb-2">{template.description}</p>

      {/* Info: czas i liczba ćwiczeń */}
      <div className="flex gap-2 text-xs opacity-75 mb-2">
        <span>⏱️ {template.estimatedDuration} min</span>
        <span>•</span>
        <span>📊 {template.exercises.length} ćw.</span>
      </div>

      {/* Akcje */}
      <div className="flex gap-2 mt-2 justify-end">
        {onDuplicate && (
          <button
            onClick={e => {
              e.stopPropagation();
              onDuplicate(template.id);
            }}
            className="p-1 hover:bg-slate-700 rounded"
            title="Duplikuj"
          >
            <Copy size={16} />
          </button>
        )}
        {onEdit && (
          <button
            onClick={e => {
              e.stopPropagation();
              onEdit(template);
            }}
            className="p-1 hover:bg-slate-700 rounded"
            title="Edytuj"
          >
            <Edit size={16} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={e => {
              e.stopPropagation();
              onDelete(template.id);
            }}
            className="p-1 hover:bg-red-700 rounded"
            title="Usuń"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
