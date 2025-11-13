import React from 'react';
import { Plus } from 'lucide-react';
import { Measurement } from '../../../types/index.js';
import { formatDate } from '../../../utils/date.utils.js';

interface MeasurementsWidgetProps {
  measurements: Measurement[];
  onAdd: () => void;
}

export const MeasurementsWidget: React.FC<MeasurementsWidgetProps> = ({
  measurements,
  onAdd,
}) => {
  const recent = measurements.slice(-5).reverse();

  return (
    <div className="bg-slate-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Pomiary</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-all"
        >
          <Plus size={16} />
          Dodaj
        </button>
      </div>
      {recent.length === 0 ? (
        <p className="text-slate-400 text-center py-4">Brak pomiarów. Dodaj pierwszy!</p>
      ) : (
        <div className="space-y-2">
          {recent.map((m, idx) => (
            <div key={idx} className="flex justify-between bg-slate-600 p-3 rounded">
              <span>{formatDate(m.date)}</span>
              <span className="font-bold">
                {m.weight} kg | {m.waist} cm
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};