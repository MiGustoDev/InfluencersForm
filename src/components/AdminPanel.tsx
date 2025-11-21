import { useState, useEffect, useRef } from 'react';
import { X, Save, Plus, Trash2, Eye, EyeOff, Settings, History } from 'lucide-react';
import { formService } from '../services/formService';
import { FormField } from '../lib/supabase';

interface AdminPanelProps {
  onClose: () => void;
  onShowHistory: () => void;
  onConfigurationUpdated: () => void;
}

export function AdminPanel({ onClose, onShowHistory, onConfigurationUpdated }: AdminPanelProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [configId, setConfigId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasPendingRefresh, setHasPendingRefresh] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const config = await formService.getActiveConfiguration();
      if (config) {
        setFields(config.fields);
        setConfigId(config.id);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const showMessage = (message: string) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    setActionMessage(message);
    messageTimeoutRef.current = setTimeout(() => {
      setActionMessage('');
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await formService.updateConfiguration(configId, fields);
      showMessage('Configuración guardada exitosamente');
      setHasPendingRefresh(true);
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((field, i) => (i === index ? { ...field, ...updates } : field))
    );
  };

  const addField = () => {
    const newField: FormField = {
      name: `field_${Date.now()}`,
      label: 'Nuevo Campo',
      type: 'text',
      required: false,
      enabled: true,
    };
    setFields((prev) => [...prev, newField]);
    showMessage('Campo agregado. Recuerda guardar los cambios.');
  };

  const handleClosePanel = () => {
    if (hasPendingRefresh) {
      onConfigurationUpdated();
      setHasPendingRefresh(false);
    }
    onClose();
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleFieldEnabled = (index: number) => {
    updateField(index, { enabled: !fields[index].enabled });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-black/30 backdrop-blur rounded-3xl shadow-2xl border border-white/10 max-w-6xl w-full max-h-[90vh] overflow-hidden animate-slideUp text-white">
        <div className="border-b border-white/10 bg-white/5 text-yellow-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-black/40 border border-yellow-500/40">
              <Settings className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-yellow-400/70">
                Control del formulario
              </p>
              <h2 className="text-2xl font-black">Panel de Administrador</h2>
            </div>
          </div>
          <button
            onClick={handleClosePanel}
            className="hover:bg-yellow-500/10 p-2 rounded-lg transition-colors border border-transparent hover:border-yellow-500/40"
            aria-label="Cerrar panel administrador"
          >
            <X className="w-6 h-6 text-yellow-200" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 pb-28 lg:pb-10">
          <div className="mb-6 flex flex-wrap gap-3 items-center">
            <button
              onClick={() => {
                if (hasPendingRefresh) {
                  onConfigurationUpdated();
                  setHasPendingRefresh(false);
                }
                onShowHistory();
              }}
              className="inline-flex items-center gap-2 bg-yellow-500 text-black font-semibold px-4 py-2 rounded-2xl shadow-lg shadow-black/40 hover:bg-yellow-400 transition-all"
            >
              <History className="w-4 h-4" />
              Ver Historial
            </button>
            <p className="text-sm text-yellow-200/70">
              Ajusta campos y estados del formulario.
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-4 text-yellow-100">Campos del Formulario</h3>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={index}
                className={`border rounded-2xl p-4 transition-all backdrop-blur-sm ${
                  field.enabled
                    ? 'border-yellow-500/30 bg-white/5 shadow-inner shadow-yellow-500/5'
                    : 'border-zinc-700 bg-black/30 opacity-70'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-yellow-200 mb-1">
                        Etiqueta
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        className="w-full px-3 py-2 border border-yellow-500/30 rounded-lg bg-black/40 text-yellow-50 placeholder-yellow-200/50 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-yellow-200 mb-1">
                        Tipo
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(index, { type: e.target.value as FormField['type'] })
                        }
                        className="w-full px-3 py-2 border border-yellow-500/30 rounded-lg bg-black/40 text-yellow-50 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      >
                        <option value="text">Texto</option>
                        <option value="textarea">Área de texto</option>
                        <option value="date">Fecha</option>
                        <option value="time">Hora</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-yellow-100">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="w-4 h-4 rounded border-yellow-500/40 text-yellow-500 focus:ring-yellow-500/60 bg-black/40"
                        />
                        <span className="text-sm font-semibold">Obligatorio</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex lg:flex-col gap-2">
                    <button
                      onClick={() => toggleFieldEnabled(index)}
                      className={`p-2 rounded-lg transition-colors border bg-zinc-700 text-zinc-400 border-zinc-600 hover:bg-green-500/10 hover:text-green-300 hover:border-green-400/30`}
                      title={field.enabled ? 'Deshabilitar' : 'Habilitar'}
                    >
                      {field.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={() => removeField(index)}
                      className="p-2 bg-zinc-700 text-zinc-400 border-zinc-600 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 rounded-lg transition-colors border"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addField}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/5 border border-dashed border-yellow-500/40 text-yellow-200 hover:bg-white/10 rounded-xl transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Agregar Campo
          </button>

          {actionMessage && (
            <div className="mt-4 relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-black/40 text-yellow-100 p-4">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-red-600/10 to-yellow-500/10 animate-pulse"></div>
              <div className="relative flex items-center justify-center gap-2 text-sm font-semibold tracking-[0.2em] uppercase">
                {actionMessage}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-yellow-500/20 bg-black/50 p-6 flex justify-end gap-3">
          <button
            onClick={handleClosePanel}
            className="px-6 py-2 border border-yellow-500/30 text-yellow-100 hover:bg-white/5 rounded-xl transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-yellow-500 text-black font-black rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/40 hover:bg-yellow-400"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
