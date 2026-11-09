import React from 'react';

type SetField = 'weight' | 'reps' | 'rir';

interface SetInputProps {
  exerciseName: string;
  setIndex: number;
  weight: string;
  reps: string;
  rir: string;
  onChange: (field: SetField, value: string) => void;
  onRemove: () => void;
}

const fields: { key: SetField; label: string; placeholder: string; inputMode: 'decimal' | 'numeric' }[] = [
  { key: 'weight', label: 'Ciężar (kg)', placeholder: 'kg', inputMode: 'decimal' },
  { key: 'reps', label: 'Powtórzenia', placeholder: 'powt.', inputMode: 'numeric' },
  { key: 'rir', label: 'RIR', placeholder: 'RIR', inputMode: 'decimal' },
];

export const SetInput: React.FC<SetInputProps> = ({
  exerciseName,
  setIndex,
  weight,
  reps,
  rir,
  onChange,
  onRemove,
}) => {
  const values: Record<SetField, string> = { weight, reps, rir };
  const setName = `seria ${setIndex + 1}, ${exerciseName}`;

  return (
    <div className="flex gap-2 items-center mb-2">
      <span className="text-sm opacity-70 w-6 shrink-0">{setIndex + 1}.</span>
      {fields.map(({ key, label, placeholder, inputMode }) => (
        <input
          key={key}
          value={values[key]}
          onChange={e => onChange(key, e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          aria-label={`${label}, ${setName}`}
          className="bg-slate-600 p-2 rounded-sm w-20 min-w-0 text-center outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      ))}
      <button
        onClick={onRemove}
        aria-label={`Usuń serię ${setIndex + 1}, ${exerciseName}`}
        title="Usuń serię"
        className="text-red-400 hover:text-red-600 text-xs font-bold px-2 shrink-0"
      >
        ✕
      </button>
    </div>
  );
};
