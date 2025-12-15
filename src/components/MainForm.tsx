import { useState, useEffect } from 'react';
import { Send, Loader2, History, Shield } from 'lucide-react';
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

  const helperTexts: Record<string, string> = {
    instagram: 'Escribe tu usuario sin @. Ej: migusto.oficial',
    recipient_name: 'Persona que recibirá el canje. Nombre y apellido.',
    desired_date: 'Selecciona la fecha exacta. Si no la sabes, elige la más aproximada.',
    desired_time: 'Horario estimado para recibir el canje.',
    address: 'Incluye calle, número, ciudad y referencias sencillas.',
    additional_notes: 'Indica gustos, alergias u otros detalles que debamos saber.',
  };

  const completedFields = fields.filter(
    (field) => formData[field.name]?.trim()
  ).length;

  return (
    <div className="relative max-w-4xl mx-auto lg:pr-28">
      {/* Mobile Actions - More visible and accessible */}
      {/* Mobile Actions - More visible and accessible */}
      <div className="lg:hidden flex items-center justify-end gap-3 mb-6 opacity-30 hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={onHistoryClick}
          className="group relative w-12 h-12 rounded-full bg-black/40 border border-gray-400/30 text-gray-200/70 hover:text-gray-50 hover:border-gray-200 transition-all shadow-lg shadow-black/40 backdrop-blur-sm flex items-center justify-center"
          aria-label="Historial"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <History className="relative w-5 h-5 text-gray-300 group-hover:text-gray-200" />
          <span className="absolute -left-32 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.25em] uppercase text-gray-200/70 bg-black/50 border border-gray-400/20 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Historial
          </span>
        </button>
        <button
          onClick={onAdminClick}
          className="group relative w-12 h-12 rounded-full bg-black/40 border border-gray-400/30 text-gray-200/70 hover:text-gray-50 hover:border-gray-200 transition-all shadow-lg shadow-black/40 backdrop-blur-sm flex items-center justify-center"
          aria-label="Admin"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Shield className="relative w-5 h-5 text-gray-300 group-hover:text-gray-200" />
          <span className="absolute -left-28 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.25em] uppercase text-gray-200/70 bg-black/50 border border-gray-400/20 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Admin
          </span>
        </button>
      </div>

      <div className="hidden lg:flex flex-col items-center gap-5 absolute top-12 right-6 opacity-30 hover:opacity-80 transition-opacity">
        <div className="w-px h-10 bg-gradient-to-b from-gray-400/40 via-gray-400/5 to-transparent" />
        <button
          onClick={onHistoryClick}
          className="group relative w-12 h-12 rounded-full bg-black/40 border border-gray-400/30 text-gray-200/70 hover:text-gray-50 hover:border-gray-200 transition-all shadow-lg shadow-black/40 backdrop-blur-sm flex items-center justify-center"
          aria-label="Historial"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <History className="relative w-5 h-5 text-gray-300 group-hover:text-gray-200" />
          <span className="absolute -left-32 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.25em] uppercase text-gray-200/70 bg-black/50 border border-gray-400/20 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            Historial
          </span>
        </button>
        <button
          onClick={onAdminClick}
          className="group relative w-12 h-12 rounded-full bg-black/40 border border-gray-400/30 text-gray-200/70 hover:text-gray-50 hover:border-gray-200 transition-all shadow-lg shadow-black/40 backdrop-blur-sm flex items-center justify-center"
          aria-label="Admin"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Shield className="relative w-5 h-5 text-gray-300 group-hover:text-gray-200" />
          <span className="absolute -left-28 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.25em] uppercase text-gray-200/70 bg-black/50 border border-gray-400/20 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            Admin
          </span>
        </button>
      </div>

      <div className="relative group">
        <div className="relative bg-black/30 backdrop-blur rounded-3xl shadow-2xl overflow-hidden border border-white/5">
          <div className="p-6 md:p-10">
            <div className="text-center mb-8 md:mb-10 space-y-4 md:space-y-6">
              <div className="flex justify-center mb-4 md:mb-6">
                <img
                  src={`${import.meta.env.BASE_URL}Logo Mi Gusto 2025.png`}
                  alt="Logo Mi Gusto"
                  className="w-40 md:w-60 h-auto drop-shadow-[0_0_25px_rgba(255,255,255,0.35)]"
                />
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-yellow-100 leading-tight">
                FORMULARIO DE CANJES
              </h1>
              <p className="text-gray-200 text-sm md:text-lg font-semibold px-4">
                Completa cada respuesta y presiona ENVIAR.
              </p>
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-black/30 rounded-2xl px-5 py-3 text-sm text-yellow-100">
                <p className="uppercase tracking-[0.3em] text-[10px] md:text-xs text-yellow-400">Progreso rápido</p>
                <div className="w-full md:w-auto flex items-center gap-3">
                  <div className="flex-1 bg-yellow-500/10 rounded-full h-3 overflow-hidden min-w-[100px]">
                    <div
                      className="bg-yellow-400 h-3 transition-all"
                      style={{
                        width: fields.length
                          ? `${Math.round((completedFields / fields.length) * 100)}%`
                          : '0%',
                      }}
                    ></div>
                  </div>
                  <span className="text-xs md:text-sm font-semibold whitespace-nowrap">
                    {completedFields}/{fields.length} completados
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  value={formData[field.name] || ''}
                  onChange={(value) => handleFieldChange(field.name, value)}
                  error={errors[field.name]}
                  placeholder={helperTexts[field.name] || field.label}
                />
              ))}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full group/btn"
                >
                  <div className="absolute -inset-0.5 rounded-xl bg-yellow-400 opacity-60 group-hover/btn:opacity-80 transition duration-200"></div>
                  <div className="relative flex items-center justify-center gap-3 px-8 py-4 md:py-5 bg-yellow-500 rounded-xl text-black font-black text-lg md:text-xl tracking-wide shadow-lg transition-all duration-200 group-hover/btn:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-6 h-6 md:w-7 md:h-7 animate-spin" />
                        <span>ENVIANDO...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-6 h-6 md:w-7 md:h-7" />
                        <span>ENVIAR FORMULARIO</span>
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
                  <p className="text-yellow-400 font-bold text-lg text-center">
                    ¡Formulario enviado con éxito!
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
