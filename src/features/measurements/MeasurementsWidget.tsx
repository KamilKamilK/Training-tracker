import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Measurement } from '../../types/index.js';
import { formatDate } from '../../utils/date.utils.js';

interface MeasurementsWidgetProps {
  measurements: Measurement[];
  onAdd: () => void;
  onEdit: (measurement: Measurement) => void;
  onDelete: (measurement: Measurement) => void;
}

export const MeasurementsWidget: React.FC<MeasurementsWidgetProps> = ({
  measurements,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [showAll, setShowAll] = useState(false);
  const recent = (showAll ? [...measurements] : measurements.slice(-5)).reverse();

  return (
    <div className="bg-slate-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Pomiary</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-sm text-sm transition-all"
        >
          <Plus size={16} />
          Dodaj
        </button>
      </div>
      {recent.length === 0 ? (
        <p className="text-slate-400 text-center py-4">Brak pomiarów. Dodaj pierwszy!</p>
      ) : (
        <div className="space-y-2">
          {recent.map(m => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 bg-slate-600 p-3 rounded-sm">
              <span>{formatDate(m.date)}</span>
              <span className="font-bold">
                {m.weight} kg | {m.waist} cm
              </span>
              <div className="flex gap-3">
                <button onClick={() => onEdit(m)} disabled={!m.id} title="Edytuj" aria-label={`Edytuj pomiar z ${formatDate(m.date)}`} className="text-blue-300 hover:text-blue-200">
                  <Pencil size={20} />
                </button>
                <button onClick={() => onDelete(m)} disabled={!m.id} title="Usuń" aria-label={`Usuń pomiar z ${formatDate(m.date)}`} className="text-red-300 hover:text-red-200">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {measurements.length > 5 && (
        <button onClick={() => setShowAll(value => !value)} className="mt-3 text-blue-300 hover:text-blue-200 text-sm">
          {showAll ? 'Pokaż ostatnie pomiary' : 'Pokaż wszystkie pomiary'}
        </button>
      )}
    </div>
  );
};
