import { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Instagram,
  User,
  FileText,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Undo2,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formService } from '../services/formService';
import { FormSubmission } from '../lib/supabase';

interface HistoryPanelProps {
  onClose: () => void;
}

export function HistoryPanel({ onClose }: HistoryPanelProps) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [editingSubmission, setEditingSubmission] = useState<FormSubmission | null>(null);
  const [editForm, setEditForm] = useState({
    instagram: '',
    recipient_name: '',
    desired_date: '',
    desired_time: '',
    address: '',
    additional_notes: '',
    coupon_code: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FormSubmission | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lastDeleted, setLastDeleted] = useState<FormSubmission | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDownloadingRange, setIsDownloadingRange] = useState(false);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);
  const startDateInputMobileRef = useRef<HTMLInputElement>(null);
  const endDateInputMobileRef = useRef<HTMLInputElement>(null);
  const showActionMessage = (message: string) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    setActionMessage(message);
    messageTimeoutRef.current = setTimeout(() => setActionMessage(''), 4000);
  };

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => {
    loadSubmissions();
  }, [currentPage, searchTerm]);

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      const { data, count } = await formService.getSubmissions(currentPage, itemsPerPage, searchTerm);
      setSubmissions(data);
      setTotalCount(count);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const openEditModal = (submission: FormSubmission) => {
    setEditingSubmission(submission);
    setEditForm({
      instagram: submission.instagram || '',
      recipient_name: submission.recipient_name || '',
      desired_date: submission.desired_date || '',
      desired_time: submission.desired_time || '',
      address: submission.address || '',
      additional_notes: submission.additional_notes || '',
      coupon_code: submission.coupon_code || '',
    });
  };

  const handleEditChange = (field: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubmission) return;
    try {
      setIsSavingEdit(true);
      const updated = await formService.updateSubmission(editingSubmission.id, editForm);
      setSubmissions((prev) =>
        prev.map((submission) => (submission.id === updated.id ? { ...submission, ...updated } : submission))
      );
      setEditingSubmission(null);
      showActionMessage('Registro actualizado correctamente');
    } catch (error) {
      console.error('Error updating submission:', error);
      alert('No se pudo actualizar el registro.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (submissionId: string) => {
    try {
      setDeletingId(submissionId);
      const deleted = await formService.deleteSubmission(submissionId);
      setSubmissions((prev) => prev.filter((submission) => submission.id !== submissionId));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setLastDeleted(deleted);
      showActionMessage('Registro eliminado correctamente');
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('No se pudo eliminar el registro.');
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await handleDelete(pendingDelete.id);
    setPendingDelete(null);
    setDeletingId(null);
  };

  const handleUndoDelete = async () => {
    if (!lastDeleted) return;
    try {
      setIsRestoring(true);
      const restored = await formService.restoreSubmission(lastDeleted);
      setSubmissions((prev) => [restored, ...prev]);
      setTotalCount((prev) => prev + 1);
      setLastDeleted(null);
      showActionMessage('Eliminación deshecha');
    } catch (error) {
      console.error('Error restoring submission:', error);
      alert('No se pudo deshacer la eliminación.');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const downloadSubmission = (submission: FormSubmission) => {
    const headers = [
      'Instagram',
      'Destinatario',
      'Fecha deseada',
      'Hora deseada',
      'Dirección',
      'Cupón',
      'Notas adicionales',
      'Creado el',
    ];
    const values = [
      submission.instagram,
      submission.recipient_name,
      submission.desired_date,
      submission.desired_time,
      submission.address,
      submission.coupon_code || '',
      submission.additional_notes || '',
      new Date(submission.created_at).toLocaleString('es-ES'),
    ];

    const rows = [headers, values];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registro');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registro-${submission.instagram || 'sin-instagram'}-${submission.id.slice(0, 8)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadRange = async () => {
    if (!startDate || !endDate) {
      alert('Por favor selecciona ambas fechas (desde y hasta)');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }

    try {
      setIsDownloadingRange(true);
      const submissions = await formService.getSubmissionsByDateRange(startDate, endDate);

      if (submissions.length === 0) {
        alert('No se encontraron registros en el rango de fechas seleccionado');
        setIsDownloadingRange(false);
        return;
      }

      const headers = [
        'Instagram',
        'Destinatario',
        'Fecha deseada',
        'Hora deseada',
        'Dirección',
        'Cupón',
        'Notas adicionales',
        'Creado el',
      ];

      const rows = submissions.map((submission) => [
        submission.instagram,
        submission.recipient_name,
        submission.desired_date,
        submission.desired_time,
        submission.address,
        submission.coupon_code || '',
        submission.additional_notes || '',
        new Date(submission.created_at).toLocaleString('es-ES'),
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const startFormatted = new Date(startDate).toLocaleDateString('es-ES').replace(/\//g, '-');
      const endFormatted = new Date(endDate).toLocaleDateString('es-ES').replace(/\//g, '-');
      link.download = `registros-${startFormatted}-${endFormatted}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showActionMessage(`Descargados ${submissions.length} registros`);
    } catch (error) {
      console.error('Error downloading range:', error);
      alert('Error al descargar los registros. Por favor intenta de nuevo.');
    } finally {
      setIsDownloadingRange(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-black/30 backdrop-blur rounded-3xl shadow-2xl border border-white/10 max-w-6xl w-full max-h-[90vh] flex flex-col animate-slideUp text-white">
        <div className="border-b border-white/10 bg-white/5 text-yellow-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white/10 border border-white/10">
              <FileText className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-yellow-400/70">
                Envíos recientes
              </p>
              <h2 className="text-2xl font-black text-yellow-100">Historial de Envíos</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/10 p-2 rounded-lg transition-colors border border-transparent hover:border-white/30"
            aria-label="Cerrar historial"
          >
            <X className="w-6 h-6 text-yellow-200" />
          </button>
        </div>

        <div className="p-6 flex flex-col flex-1 min-h-0">
          <div className="mb-6 space-y-4">
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
              {/* Mobile: solo iconos en una fila con labels */}
              <div className="flex md:hidden items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => startDateInputMobileRef.current?.showPicker?.()}
                  className="flex flex-col items-center gap-1 p-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors"
                  title="Fecha desde"
                >
                  <CalendarIcon className="w-5 h-5" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-yellow-400/70">Desde</span>
                </button>
                <button
                  type="button"
                  onClick={() => endDateInputMobileRef.current?.showPicker?.()}
                  className="flex flex-col items-center gap-1 p-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors"
                  title="Fecha hasta"
                >
                  <CalendarIcon className="w-5 h-5" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-yellow-400/70">Hasta</span>
                </button>
                <button
                  onClick={downloadRange}
                  disabled={isDownloadingRange || !startDate || !endDate}
                  className="flex items-center justify-center p-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40"
                  title="Descargar rango de fechas"
                >
                  {isDownloadingRange ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Desktop: con texto completo */}
              <div className="hidden md:flex md:flex-row gap-4 items-end">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.3em] text-yellow-400/70 mb-2">
                      Desde
                    </label>
                    <div className="relative">
                      <input
                        ref={startDateInputRef}
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-12 pr-4 py-2 rounded-xl bg-black/30 text-white placeholder-white/40 focus:ring-2 focus:ring-white border border-transparent [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => startDateInputRef.current?.showPicker?.()}
                        className="absolute inset-y-0 left-3 flex items-center justify-center text-white/70 pointer-events-none"
                        aria-label="Seleccionar fecha inicial"
                      >
                        <CalendarIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.3em] text-yellow-400/70 mb-2">
                      Hasta
                    </label>
                    <div className="relative">
                      <input
                        ref={endDateInputRef}
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-12 pr-4 py-2 rounded-xl bg-black/30 text-white placeholder-white/40 focus:ring-2 focus:ring-white border border-transparent [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => endDateInputRef.current?.showPicker?.()}
                        className="absolute inset-y-0 left-3 flex items-center justify-center text-white/70 pointer-events-none"
                        aria-label="Seleccionar fecha final"
                      >
                        <CalendarIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={downloadRange}
                  disabled={isDownloadingRange || !startDate || !endDate}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-black/40"
                >
                  {isDownloadingRange ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Descargando...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Descargar Rango</span>
                    </>
                  )}
                </button>
              </div>

              {/* Inputs ocultos para mobile (necesarios para el funcionamiento) */}
              <input
                ref={startDateInputMobileRef}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />
              <input
                ref={endDateInputMobileRef}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-200/60 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por Instagram, nombre o dirección..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/30 text-white placeholder-white/40 focus:ring-2 focus:ring-white border border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pr-1 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {isLoading ? (
              <div className="text-center py-12 text-gray-200/70">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-yellow-500/20 border-t-yellow-400"></div>
                <p className="mt-4 text-sm uppercase tracking-[0.3em] text-gray-200">Cargando...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-gray-200/70">
                <p className="text-lg font-medium">No se encontraron envíos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    onClick={() => setSelectedSubmission(submission)}
                    className="border border-white/10 rounded-2xl p-4 bg-white/5 hover:bg-white/10 transition-all cursor-pointer shadow-inner shadow-black/40 relative"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col md:flex-row md:items-center gap-3 relative">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm flex-1 pr-20 md:pr-0">
                          <div className="flex items-center gap-2">
                            <Instagram className="w-4 h-4 text-white-500 flex-shrink-0" />
                            <span className="font-semibold text-yellow-100 truncate">
                              @{submission.instagram}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-200 flex-shrink-0" />
                            <span className="text-gray-200 truncate">
                              {submission.recipient_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-200 flex-shrink-0" />
                            <span className="text-gray-200/80 text-sm">
                              {new Date(submission.created_at).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase tracking-[0.3em] text-yellow-400/70">
                              Cupón:{' '}
                            </span>
                            <span className="text-yellow-100 font-semibold normal-case tracking-normal">
                              {submission.coupon_code?.trim() || 'Sin asignar'}
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex flex-col md:flex-row items-end md:items-center gap-2 absolute right-2 top-2 md:relative md:right-auto md:top-auto md:ml-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => downloadSubmission(submission)}
                            className="inline-flex items-center justify-center p-2.5 md:p-3 rounded-full border border-white/20 text-white hover:bg-green-500/20 hover:border-green-500/40 transition-colors self-end"
                            title="Descargar registro"
                          >
                            <Download className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(submission)}
                            className="inline-flex items-center justify-center p-2.5 md:p-3 rounded-full border border-white/20 text-white hover:bg-yellow-500/20 hover:border-yellow-500/40 transition-colors self-end"
                            title="Editar registro"
                          >
                            <Pencil className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          <button
                            onClick={() => setPendingDelete(submission)}
                            className="inline-flex items-center justify-center p-2.5 md:p-3 rounded-full border border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/40 transition-colors disabled:opacity-40 self-end"
                            title="Eliminar registro"
                            disabled={deletingId === submission.id}
                          >
                            {deletingId === submission.id ? (
                              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-gray-200">
              <p className="text-sm text-gray-200">
                Mostrando {currentPage * itemsPerPage + 1} -{' '}
                {Math.min((currentPage + 1) * itemsPerPage, totalCount)} de {totalCount} envíos
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 border border-yellow-500/30 rounded-xl text-yellow-100 hover:bg-yellow-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-4 py-2 border border-yellow-500/30 rounded-xl text-yellow-100 hover:bg-yellow-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {(actionMessage || lastDeleted) && (
            <div className="mt-6 relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 text-white p-4 flex flex-col gap-3">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-black/10 to-white/10 animate-pulse"></div>
              {actionMessage && (
                <div className="relative flex items-center justify-center gap-2 text-xs uppercase tracking-[0.4em]">
                  {actionMessage}
                </div>
              )}
              {lastDeleted && (
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-3">
                  <p className="text-xs tracking-[0.3em] uppercase text-yellow-200/70">
                    Registro eliminado: @{lastDeleted.instagram}
                  </p>
                  <button
                    onClick={handleUndoDelete}
                    disabled={isRestoring}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/40 text-yellow-50 text-xs uppercase tracking-[0.4em] hover:bg-yellow-500/10 transition-all disabled:opacity-50"
                  >
                    {isRestoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
                    Deshacer eliminación
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedSubmission && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-lg z-60 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="bg-black/30 backdrop-blur rounded-3xl border border-white/10 shadow-2xl max-w-2xl w-full animate-slideUp text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 bg-white/5 p-6 flex items-center justify-between rounded-t-3xl">
              <h3 className="text-xl font-black text-yellow-100">Detalles del Envío</h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-yellow-200" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-yellow-400/70 mb-1">
                    <Instagram className="w-4 h-4 text-pink-500" />
                    <span className="text-sm font-medium">Instagram</span>
                  </div>
                  <p className="font-semibold text-yellow-100">@{selectedSubmission.instagram}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-yellow-400/70 mb-1">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">Destinatario</span>
                  </div>
                  <p className="text-gray-200">{selectedSubmission.recipient_name}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-yellow-400/70 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Fecha deseada</span>
                  </div>
                  <p className="text-gray-200">{formatDate(selectedSubmission.desired_date)}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-yellow-400/70 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Hora deseada</span>
                  </div>
                  <p className="text-gray-200">{formatTime(selectedSubmission.desired_time)}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-yellow-400/70 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Dirección</span>
                </div>
                <p className="text-gray-200">{selectedSubmission.address}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-yellow-400/70 mb-1">
                  <span className="text-sm font-medium">Cupón</span>
                </div>
                <p className="font-semibold text-yellow-100">
                  {selectedSubmission.coupon_code?.trim() || 'Sin asignar'}
                </p>
              </div>

              {selectedSubmission.additional_notes && (
                <div>
                  <div className="flex items-center gap-2 text-yellow-400/70 mb-1">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">Notas adicionales</span>
                  </div>
                  <p className="bg-black/30 border border-white/10 p-3 rounded-2xl text-gray-200">
                    {selectedSubmission.additional_notes}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-white/10 text-sm text-gray-200/70">
                Enviado el {formatDate(selectedSubmission.created_at)} a las{' '}
                {new Date(selectedSubmission.created_at).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div className="border-t border-white/10 bg-black/20 p-4 flex justify-end rounded-b-3xl">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSubmission && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-lg z-60 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setEditingSubmission(null)}
        >
          <div
            className="relative bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] animate-slideUp overflow-y-auto border border-gray-400/20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-yellow-400/70">Acción rápida</p>
                  <h3 className="text-2xl font-black text-yellow-100">Editar registro</h3>
                </div>
                <button
                  onClick={() => setEditingSubmission(null)}
                  className="hover:bg-white/10 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-yellow-200" />
                </button>
              </div>

              <form className="space-y-6" onSubmit={handleEditSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2 tracking-wider uppercase">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={editForm.instagram}
                      onChange={(e) => handleEditChange('instagram', e.target.value)}
                      className="w-full px-5 py-4 rounded-xl bg-black/30 text-gray-100 placeholder-white/50 focus:ring-2 focus:ring-white transition-all font-medium backdrop-blur border border-gray-400/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2 tracking-wider uppercase">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Destinatario
                    </label>
                    <input
                      type="text"
                      value={editForm.recipient_name}
                      onChange={(e) => handleEditChange('recipient_name', e.target.value)}
                      className="w-full px-5 py-4 rounded-xl bg-black/30 text-gray-100 placeholder-white/50 focus:ring-2 focus:ring-white transition-all font-medium backdrop-blur border border-gray-400/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2 tracking-wider uppercase">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Fecha deseada
                    </label>
                    <input
                      type="date"
                      value={editForm.desired_date}
                      onChange={(e) => handleEditChange('desired_date', e.target.value)}
                      className="w-full px-5 py-4 rounded-xl bg-black/30 text-gray-100 focus:ring-2 focus:ring-white transition-all font-medium backdrop-blur border border-gray-400/30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2 tracking-wider uppercase">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      Hora deseada
                    </label>
                    <input
                      type="time"
                      value={editForm.desired_time}
                      onChange={(e) => handleEditChange('desired_time', e.target.value)}
                      className="w-full px-5 py-4 rounded-xl bg-black/30 text-gray-100 focus:ring-2 focus:ring-white transition-all font-medium backdrop-blur border border-gray-400/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2 tracking-wider uppercase">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => handleEditChange('address', e.target.value)}
                    className="w-full px-5 py-4 rounded-xl bg-black/30 text-gray-100 placeholder-white/50 focus:ring-2 focus:ring-white transition-all font-medium backdrop-blur border border-gray-400/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2 tracking-wider uppercase">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Cupón
                  </label>
                  <input
                    type="text"
                    value={editForm.coupon_code}
                    onChange={(e) => handleEditChange('coupon_code', e.target.value.toUpperCase())}
                    placeholder="Ejemplo: MG-1234"
                    className="w-full px-5 py-4 rounded-xl bg-black/30 text-gray-100 placeholder-white/50 focus:ring-2 focus:ring-white transition-all font-medium backdrop-blur border border-gray-400/30 uppercase"
                  />
                  <p className="text-xs text-gray-200/60 mt-1">Deja vacío si todavía no asignaste cupón.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2 tracking-wider uppercase">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Notas adicionales
                  </label>
                  <textarea
                    value={editForm.additional_notes}
                    onChange={(e) => handleEditChange('additional_notes', e.target.value)}
                    rows={3}
                    className="w-full px-5 py-4 rounded-xl bg-black/30 text-gray-100 placeholder-white/50 focus:ring-2 focus:ring-white transition-all font-medium backdrop-blur border border-gray-400/30 min-h-[120px] resize-y"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingSubmission(null)}
                    className="px-5 py-2 border border-yellow-500/30 rounded-xl text-yellow-100 hover:bg-yellow-500/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingEdit ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-lg z-60 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="bg-black/30 backdrop-blur rounded-3xl border border-white/10 shadow-2xl max-w-md w-full animate-slideUp text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 bg-white/5 p-6 rounded-t-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-yellow-400/70">Confirmación</p>
              <h3 className="text-2xl font-black text-yellow-100">Eliminar registro</h3>
            </div>
            <div className="p-6 space-y-3 text-gray-200">
              <p className="text-sm text-gray-200/80">
                ¿Seguro que deseas eliminar el registro de <span className="font-semibold text-yellow-100">@{pendingDelete.instagram}</span>? Esta acción no
                se puede deshacer.
              </p>
            </div>
            <div className="border-t border-white/10 bg-black/20 p-4 flex justify-end gap-3 rounded-b-3xl">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-5 py-2 rounded-xl border border-yellow-500/30 text-yellow-100 hover:bg-yellow-500/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-black flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
