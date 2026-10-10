import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormFieldProps {
  id: string;
  label: string;
  type: 'email' | 'password';
  value: string;
  error?: string;
  hint?: string;
  autoComplete: string;
  onChange: (value: string) => void;
}

/** Labelled input with its error message; password fields get a show/hide toggle. */
export const FormField: React.FC<FormFieldProps> = ({ id, label, type, value, error, hint, autoComplete, onChange }) => {
  const [visible, setVisible] = useState(false);
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="text-left">
      <label htmlFor={id} className="block text-sm text-slate-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type === 'password' && visible ? 'text' : type}
          value={value}
          autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="w-full bg-slate-700 p-2 pr-10 rounded outline-none focus:ring-2 focus:ring-blue-500"
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            aria-label={visible ? 'Ukryj hasło' : 'Pokaż hasło'}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-slate-400 text-xs mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-red-400 text-sm mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
