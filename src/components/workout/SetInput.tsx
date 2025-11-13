import React from 'react';

interface SetInputProps {
  setIndex: number;
  weight: string;
  reps: string;
  rir: string;
  onChange: (field: 'weight' | 'reps' | 'rir', value: string) => void;
  onRemove: () => void;
}

export const SetInput: React.FC<SetInputProps> = ({
  setIndex,
  weight,
  reps,
  rir,
  onChange,
  onRemove,
}) => (
  <div className="flex gap-2 items-center mb-2">
    <span className="text-sm opacity-70 w-6">{setIndex + 1}.</span>
    <input
      value={weight}
      onChange={e => onChange('weight', e.target.value)}
      placeholder="kg"
      className="bg-slate-600 p-2 rounded w-20 text-center outline-none focus:ring-2 focus:ring-blue-500"
    />
    <input
      value={reps}
      onChange={e => onChange('reps', e.target.value)}
      placeholder="powt."
      className="bg-slate-600 p-2 rounded w-20 text-center outline-none focus:ring-2 focus:ring-blue-500"
    />
    <input
      value={rir}
      onChange={e => onChange('rir', e.target.value)}
      placeholder="RIR"
      className="bg-slate-600 p-2 rounded w-20 text-center outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button
      onClick={onRemove}
      className="text-red-400 hover:text-red-600 text-xs font-bold px-2"
    >
      ✕
    </button>
  </div>
);