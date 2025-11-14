import { useState, useEffect } from 'react';
import { Send, Loader2, Flame, Crown, History, Shield } from 'lucide-react';
import { FormField } from './FormField';
import { formService } from '../services/formService';
import { FormField as FormFieldType } from '../lib/supabase';

interface MainFormProps {
  onAdminClick: () => void;
  onHistoryClick: () => void;
  refreshToken: number;
}

export function MainForm({ onAdminClick, onHistoryClick, refreshToken }: MainFormProps) {
  const [fields, setFields] = useState<FormFieldType[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, [refreshToken]);

  const loadConfiguration = async () => {
    try {
      setIsLoading(true);
      const config = await formService.getActiveConfiguration();
      if (config) {
        setFields(config.fields);
        const initialData: Record<string, string> = {};
        config.fields.forEach((field) => {
          initialData[field.name] = '';
        });
        setFormData(initialData);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      if (field.required && field.enabled && !formData[field.name]?.trim()) {
        newErrors[field.name] = 'Este campo es obligatorio';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await formService.submitForm({
        instagram: formData.instagram || '',
        recipient_name: formData.recipient_name || '',
        desired_date: formData.desired_date || '',
        desired_time: formData.desired_time || '',
        address: formData.address || '',
        additional_notes: formData.additional_notes || ''
      });

      setSubmitSuccess(true);

      const initialData: Record<string, string> = {};
      fields.forEach((field) => {
        initialData[field.name] = '';
      });
      setFormData(initialData);
      setErrors({});

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Hubo un error al enviar el formulario. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <Loader2 className="w-16 h-16 animate-spin text-yellow-500" />
          <div className="absolute inset-0 blur-xl">
            <Loader2 className="w-16 h-16 animate-spin text-yellow-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-4xl mx-auto lg:pr-28">
      <div className="lg:hidden absolute top-4 right-4 flex flex-col gap-2 z-40">
        <button
          onClick={onHistoryClick}
          className="w-10 h-10 rounded-full border border-yellow-500/10 bg-black/20 text-yellow-200/60 flex items-center justify-center backdrop-blur-sm opacity-40 hover:opacity-70 transition"
          aria-label="Historial"
        >
          <History className="w-4 h-4" />
        </button>
        <button
          onClick={onAdminClick}
          className="w-10 h-10 rounded-full border border-yellow-500/10 bg-black/20 text-yellow-200/60 flex items-center justify-center backdrop-blur-sm opacity-40 hover:opacity-70 transition"
          aria-label="Admin"
        >
          <Shield className="w-4 h-4" />
        </button>
      </div>
      <div className="hidden lg:flex flex-col items-center gap-5 absolute top-12 right-6 opacity-30 hover:opacity-80 transition-opacity">
        <div className="w-px h-10 bg-gradient-to-b from-yellow-500/40 via-yellow-500/5 to-transparent" />
        <button
          onClick={onHistoryClick}
          className="group relative w-12 h-12 rounded-full bg-black/40 border border-yellow-400/30 text-yellow-100/70 hover:text-yellow-50 hover:border-yellow-300 transition-all shadow-lg shadow-black/40 backdrop-blur-sm flex items-center justify-center"
          aria-label="Historial"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <History className="relative w-5 h-5 text-yellow-300 group-hover:text-yellow-200" />
          <span className="absolute -left-32 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.25em] uppercase text-yellow-200/70 bg-black/50 border border-yellow-500/20 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            Historial
          </span>
        </button>
        <button
          onClick={onAdminClick}
          className="group relative w-12 h-12 rounded-full bg-black/40 border border-yellow-400/30 text-yellow-100/70 hover:text-yellow-50 hover:border-yellow-300 transition-all shadow-lg shadow-black/40 backdrop-blur-sm flex items-center justify-center"
          aria-label="Admin"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Shield className="relative w-5 h-5 text-yellow-300 group-hover:text-yellow-200" />
          <span className="absolute -left-28 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.25em] uppercase text-yellow-200/70 bg-black/50 border border-yellow-500/20 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            Admin
          </span>
        </button>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse"></div>

        <div className="relative bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-3xl border-2 border-yellow-500/30 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-700 to-transparent opacity-30"></div>

          <div className="p-10">
            <div className="text-center mb-10">
              <div className="flex justify-center mb-6">
                <img
                  src="/Logo%20Mi%20Gusto%202025.png"
                  alt="Logo Mi Gusto"
                  className="w-60 h-auto drop-shadow-[0_0_25px_rgba(255,255,255,0.35)]"
                />
              </div>
              <div className="flex items-center justify-center gap-4 mb-4">
                <Crown className="w-12 h-12 text-yellow-500 animate-pulse" />
                <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-transparent bg-clip-text">
                  FORMULARIO DE CANJES
                </h1>
                <Flame className="w-12 h-12 text-red-600 animate-pulse" />
              </div>
              <div className="h-1 w-64 mx-auto bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mb-4"></div>
              <p className="text-gray-400 text-lg font-medium">
                Completa los datos para coordinar tu intercambio
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  value={formData[field.name] || ''}
                  onChange={(value) => handleFieldChange(field.name, value)}
                  error={errors[field.name]}
                />
              ))}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full group/btn"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 rounded-xl blur opacity-50 group-hover/btn:opacity-100 transition duration-200"></div>
                  <div className="relative flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-red-700 via-yellow-600 to-red-700 rounded-xl text-black font-black text-xl tracking-wide shadow-lg transition-all duration-200 group-hover/btn:from-red-600 group-hover/btn:via-yellow-500 group-hover/btn:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-7 h-7 animate-spin" />
                        <span>ENVIANDO...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-7 h-7" />
                        <span>ENVIAR FORMULARIO</span>
                        <Flame className="w-7 h-7" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>

            {submitSuccess && (
              <div className="mt-10 relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-red-600/20 animate-pulse"></div>
                <div className="relative p-5 border-2 border-yellow-500/50 backdrop-blur-sm">
                  <p className="text-yellow-400 font-bold text-lg text-center flex items-center justify-center gap-3">
                    <Flame className="w-6 h-6" />
                    ¡Formulario enviado con éxito!
                    <Flame className="w-6 h-6" />
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
