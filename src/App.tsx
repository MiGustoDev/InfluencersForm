import { useState } from 'react';
import { MainForm } from './components/MainForm';
import { AdminPanel } from './components/AdminPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { Shield, History, Lock, X, Eye, EyeOff } from 'lucide-react';

type AccessType = 'admin' | 'history' | null;

function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [hasPersistentAccess, setHasPersistentAccess] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mi_gusto_pin_access') === 'true';
  });
  const [pendingAccess, setPendingAccess] = useState<AccessType>(null);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinVisible, setPinVisible] = useState(false);

  const triggerFormRefresh = () => {
    setRefreshToken((prev) => prev + 1);
  };

  const requestAccess = (type: Exclude<AccessType, null>) => {
    if (hasPersistentAccess) {
      if (type === 'admin') {
        setShowAdmin(true);
      } else {
        setShowHistory(true);
      }
      return;
    }
    setPendingAccess(type);
    setPinValue('');
    setPinError('');
    setPinVisible(false);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinValue === '7294' && pendingAccess) {
      setHasPersistentAccess(true);
      localStorage.setItem('mi_gusto_pin_access', 'true');
      if (pendingAccess === 'admin') {
        setShowAdmin(true);
      } else {
        setShowHistory(true);
      }
      setPendingAccess(null);
      setPinValue('');
      setPinError('');
    } else {
      setPinError('Clave incorrecta. Intenta nuevamente.');
    }
  };

  const closePinModal = () => {
    setPendingAccess(null);
    setPinValue('');
    setPinError('');
  };

  return (
    <div className="min-h-screen bg-black relative flex flex-col">
      {/* Fondo con la imagen: debajo de overlays y contenido */}
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: "url('/background-text.jpg')",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        minHeight: '100vh',
        width: '100%',
        height: '100%',
      }} />

      {/* Contenido */}
      <div className="relative z-20 py-12 px-4 pl-24 flex-1">
        <MainForm
          onAdminClick={() => requestAccess('admin')}
          onHistoryClick={() => requestAccess('history')}
          refreshToken={refreshToken}
        />

        {showAdmin && (
          <AdminPanel
            onClose={() => setShowAdmin(false)}
            onShowHistory={() => {
              setShowAdmin(false);
              setShowHistory(true);
            }}
            onConfigurationUpdated={triggerFormRefresh}
          />
        )}

        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}

        {pendingAccess && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-black/30 backdrop-blur rounded-3xl shadow-2xl border border-white/10 max-w-md w-full animate-slideUp text-white">
              <div className="border-b border-white/10 bg-white/5 text-yellow-100 p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-yellow-400/70">Acceso restringido</p>
                  <h3 className="text-2xl font-black text-yellow-100">
                    {pendingAccess === 'admin' ? 'Panel Admin' : 'Historial'}
                  </h3>
                </div>
                <button
                  onClick={closePinModal}
                  className="p-2 rounded-xl border border-white/10 text-yellow-200 hover:bg-yellow-500/10 transition"
                  aria-label="Cerrar solicitud de acceso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePinSubmit} className="px-6 pt-6 pb-2 space-y-5 text-yellow-100">
                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-[0.3em] text-yellow-200/70">
                    Ingresa la clave de 4 dígitos
                  </label>
                  <div className="relative">
                    <input
                      type={pinVisible ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="\d{4}"
                      maxLength={4}
                      value={pinValue}
                      onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setPinVisible((prev) => !prev)}
                      className="absolute inset-y-0 right-3 flex items-center text-yellow-200/70 hover:text-yellow-100"
                      aria-label={pinVisible ? 'Ocultar clave' : 'Mostrar clave'}
                    >
                      {pinVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {pinError && <p className="text-center text-red-400 text-sm">{pinError}</p>}

                <div className="flex items-center justify-between gap-3 pb-6">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-yellow-200/60">
                    {pendingAccess === 'admin' ? (
                      <>
                        <Shield className="w-4 h-4 text-yellow-300" />
                        Acceso Admin
                      </>
                    ) : (
                      <>
                        <History className="w-4 h-4 text-yellow-300" />
                        Acceso Historial
                      </>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={pinValue.length !== 4}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-yellow-500 text-black font-black uppercase tracking-[0.3em] disabled:opacity-50 hover:bg-yellow-400 transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    Entrar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      {/* Footer totalmente integrado, sin division visual */}
      <footer className="relative z-30 w-full flex items-center justify-center py-3 text-xs font-medium text-gray-400 bg-transparent">
        © Desarrollado por el
        <a href="https://waveframe.com.ar/" target="_blank" rel="noopener noreferrer" className="mx-1 text-gray-300 underline hover:text-gray-200 transition-colors">
          Departamento de Sistemas
        </a>
        de Mi Gusto | Todos los derechos reservados.
      </footer>
    </div>
  );
}

export default App;
