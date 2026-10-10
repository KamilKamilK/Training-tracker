import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Measurement } from '../../types/index.js';
import {
  MeasurementInput,
  MeasurementInputErrors,
  validateMeasurementInput,
} from './measurement.utils.js';

interface MeasurementFormProps {
  onSubmit: (measurement: Omit<Measurement, 'id'>) => Promise<boolean>;
  onCancel: () => void;
}

const today = () => new Date().toLocaleDateString('sv-SE');

const fields: { key: keyof MeasurementInput; label: string; type: string; inputMode?: 'decimal' }[] = [
  { key: 'date', label: 'Data pomiaru', type: 'date' },
  { key: 'weight', label: 'Waga (kg)', type: 'text', inputMode: 'decimal' },
  { key: 'waist', label: 'Obwód talii (cm)', type: 'text', inputMode: 'decimal' },
];

export const MeasurementForm: React.FC<MeasurementFormProps> = ({ onSubmit, onCancel }) => {
  const [input, setInput] = useState<MeasurementInput>({ date: today(), weight: '', waist: '' });
  const [errors, setErrors] = useState<MeasurementInputErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateMeasurementInput(input);
    if ('errors' in result) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setIsSaving(true);
    const saved = await onSubmit(result.measurement);
    setIsSaving(false);
    if (saved) onCancel();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {fields.map(({ key, label, type, inputMode }) => (
        <div key={key}>
          <label htmlFor={`measurement-${key}`} className="block text-sm text-slate-300 mb-1">
            {label}
          </label>
          <input
            id={`measurement-${key}`}
            type={type}
            inputMode={inputMode}
            value={input[key]}
            onChange={e => setInput(prev => ({ ...prev, [key]: e.target.value }))}
            aria-invalid={errors[key] ? true : undefined}
            aria-describedby={errors[key] ? `measurement-${key}-error` : undefined}
            className="w-full bg-slate-700 p-2 rounded outline-none focus:ring-2 focus:ring-purple-500"
          />
          {errors[key] && (
            <p id={`measurement-${key}-error`} className="text-red-400 text-sm mt-1">
              {errors[key]}
            </p>
          )}
        </div>
      ))}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500">
          Anuluj
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-lg"
        >
          <Save size={16} />
          {isSaving ? 'Zapisywanie...' : 'Zapisz pomiar'}
        </button>
      </div>
    </form>
  );
};
