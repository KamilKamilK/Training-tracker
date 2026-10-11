import React, { useId } from 'react';

export interface PickerOption {
  value: string;
  label: string;
  content: React.ReactNode;
}

interface OptionPickerProps {
  label: string;
  options: PickerOption[];
  value: string;
  onChange: (value: string) => void;
  optionClassName?: (option: PickerOption) => string;
}

/** A labelled group of buttons where exactly one option is selected (radio group semantics). */
export const OptionPicker: React.FC<OptionPickerProps> = ({ label, options, value, onChange, optionClassName }) => {
  const labelId = useId();
  return (
    <div>
      <p className="block text-sm mb-1 text-slate-300" id={labelId}>
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {options.map(option => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              title={option.label}
              onClick={() => onChange(option.value)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl border-2 ${
                selected ? 'border-white' : 'border-transparent hover:border-slate-400'
              } ${optionClassName?.(option) ?? 'bg-slate-800'}`}
            >
              {option.content}
            </button>
          );
        })}
      </div>
    </div>
  );
};
