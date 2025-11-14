import { useRef } from 'react';
import { FormField as FormFieldType } from '../lib/supabase';
import { AlertCircle, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface FormFieldProps {
  field: FormFieldType;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function FormField({ field, value, onChange, error }: FormFieldProps) {
  if (!field.enabled) return null;

  const baseClasses = "w-full px-5 py-4 bg-zinc-950 border-2 rounded-xl text-gray-100 placeholder-gray-600 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all font-medium backdrop-blur-sm";
  const errorClasses = error ? "border-red-600/70" : "border-yellow-500/20 hover:border-yellow-500/40";
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseClasses} ${errorClasses} min-h-[120px] resize-y`}
            required={field.required}
            placeholder={field.label}
          />
        );
      case 'date':
        return (
          <div className="relative group/date">
            <input
              ref={dateInputRef}
              type="date"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`${baseClasses} ${errorClasses} pr-14`}
              required={field.required}
            />
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker?.()}
              className="absolute inset-y-0 right-4 flex items-center justify-center text-yellow-400/70 hover:text-yellow-200 transition-colors"
              aria-label="Seleccionar fecha"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
          </div>
        );
      case 'time':
        return (
          <div className="relative group/time">
            <input
              ref={timeInputRef}
              type="time"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`${baseClasses} ${errorClasses} pr-14`}
              required={field.required}
            />
            <button
              type="button"
              onClick={() => timeInputRef.current?.showPicker?.()}
              className="absolute inset-y-0 right-4 flex items-center justify-center text-yellow-400/70 hover:text-yellow-200 transition-colors"
              aria-label="Seleccionar hora"
            >
              <Clock className="w-5 h-5" />
            </button>
          </div>
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseClasses} ${errorClasses}`}
            required={field.required}
            placeholder={field.label}
          />
        );
    }
  };

  return (
    <div className="animate-fadeIn group">
      <label className="block text-sm font-bold text-yellow-500 mb-3 flex items-center gap-2 tracking-wider uppercase">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        {field.label}
        {field.required && <span className="text-red-600 text-lg ml-1">*</span>}
      </label>
      {renderInput()}
      {error && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-red-950/30 border-l-4 border-red-600 rounded-r-lg animate-shake">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-400 font-semibold">{error}</p>
        </div>
      )}
    </div>
  );
}
