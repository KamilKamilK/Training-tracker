import React from 'react';

interface SetInputProps {
  setIndex: number;
  weight: string;
  reps: string;
  rir: string;
  onChange: (field: string, value: string) => void;
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
      className="bg-slate-700 p-1 rounded w-16 text-center"
    />
    <input
      value={reps}
      onChange={e => onChange('reps', e.target.value)}
      placeholder="powt."
      className="bg-slate-700 p-1 rounded w-16 text-center"
    />
    <input
      value={rir}
      onChange={e => onChange('rir', e.target.value)}
      placeholder="RIR"
      className="bg-slate-700 p-1 rounded w-16 text-center"
    />
    <button
      onClick={onRemove}
      className="text-red-400 hover:text-red-600 text-xs font-bold px-2"
    >
      ✕
    </button>
  </div>
);
