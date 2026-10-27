import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Trash2,
  X,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { playClick, playSuccess, playError } from '../../utils/audio';

// ==========================================
// Global Event Bus for Alert / Confirm / Toast
// ==========================================
const listeners = new Set();

function emit(event) {
  listeners.forEach((listener) => listener(event));
}

/**
 * Show a modern alert dialog (replaces window.alert)
 * @param {string|object} options
 * @param {'warning'|'error'|'info'|'success'} [type='warning']
 * @param {string} [title]
 * @returns {Promise<boolean>}
 */
export function showAlert(options, type = 'warning', title = '') {
  return new Promise((resolve) => {
    let config = {};
    if (typeof options === 'string') {
      config = {
        message: options,
        type: type || 'warning',
        title: title || (type === 'error' ? 'Terjadi Kesalahan' : type === 'success' ? 'Berhasil' : 'Perhatian'),
        confirmText: 'Mengerti',
        isConfirm: false,
      };
    } else {
      config = {
        title: options.title || (options.type === 'error' ? 'Terjadi Kesalahan' : options.type === 'success' ? 'Berhasil' : 'Perhatian'),
        message: options.message || '',
        type: options.type || 'warning',
        confirmText: options.confirmText || 'Mengerti',
        isConfirm: false,
      };
    }

    emit({
      kind: 'dialog',
      data: {
        ...config,
        resolve: () => {
          resolve(true);
        },
      },
    });
  });
}

/**
 * Show a modern confirmation dialog (replaces window.confirm)
 * @param {string|object} options
 * @param {'danger'|'warning'|'info'|'question'} [type='danger']
 * @param {string} [title]
 * @returns {Promise<boolean>}
 */
export function showConfirm(options, type = 'danger', title = '') {
  return new Promise((resolve) => {
    let config = {};
    if (typeof options === 'string') {
      config = {
        message: options,
        type: type || 'danger',
        title: title || (type === 'danger' ? 'Konfirmasi Hapus' : 'Konfirmasi Tindakan'),
        confirmText: type === 'danger' ? 'Ya, Hapus' : 'Lanjutkan',
        cancelText: 'Batal',
        isConfirm: true,
      };
    } else {
      config = {
        title: options.title || (options.type === 'danger' ? 'Konfirmasi Hapus' : 'Konfirmasi'),
        message: options.message || '',
        type: options.type || 'danger',
        confirmText: options.confirmText || (options.type === 'danger' ? 'Ya, Hapus' : 'Lanjutkan'),
        cancelText: options.cancelText || 'Batal',
        isConfirm: true,
      };
    }

    emit({
      kind: 'dialog',
      data: {
        ...config,
        resolve: (val) => {
          resolve(Boolean(val));
        },
      },
    });
  });
}

/**
 * Show a modern floating toast notification
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} [type='success']
 * @param {number} [duration=3500]
 */
export function showToast(message, type = 'success', duration = 3500) {
  emit({
    kind: 'toast',
    data: {
      id: Date.now() + Math.random(),
      message,
      type,
      duration,
    },
  });
}

// Intercept native window.alert to automatically use our cool dialog!
if (typeof window !== 'undefined') {
  window.coolAlert = showAlert;
  window.coolConfirm = showConfirm;
  window.coolToast = showToast;

  // Global override for any direct alert() calls
  window.alert = (msg) => {
    showAlert(typeof msg === 'object' ? JSON.stringify(msg) : String(msg));
  };
}

// ==========================================
// Cool Alert & Dialog UI Component
// ==========================================
export default function CoolAlertContainer() {
  const [dialog, setDialog] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleEvent = (event) => {
      if (event.kind === 'dialog') {
        // Trigger sound effect
        if (event.data.type === 'error' || event.data.type === 'danger') {
          playError();
        } else if (event.data.type === 'success') {
          playSuccess();
        } else {
          playClick();
        }
        setDialog(event.data);
      } else if (event.kind === 'toast') {
        if (event.data.type === 'success') playSuccess();
        else if (event.data.type === 'error') playError();
        else playClick();

        setToasts((prev) => [...prev, event.data]);

        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== event.data.id));
        }, event.data.duration || 3500);
      }
    };

    listeners.add(handleEvent);
    return () => listeners.delete(handleEvent);
  }, []);

  // Keyboard shortcut listener for Dialog (Esc -> Cancel, Enter -> Confirm)
  useEffect(() => {
    if (!dialog) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleClose(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog]);

  const handleClose = (result) => {
    if (!dialog) return;
    playClick();
    dialog.resolve(result);
    setDialog(null);
  };

  const getDialogTheme = (type) => {
    switch (type) {
      case 'danger':
        return {
          bgGlow: 'bg-rose-500/20',
          borderColor: 'border-rose-200/80',
          iconBg: 'bg-rose-100 border-rose-200 text-rose-600',
          Icon: Trash2,
          btnConfirm: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-rose-600/30',
        };
      case 'error':
        return {
          bgGlow: 'bg-red-500/20',
          borderColor: 'border-red-200/80',
          iconBg: 'bg-red-100 border-red-200 text-red-600',
          Icon: AlertCircle,
          btnConfirm: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-600/30',
        };
      case 'success':
        return {
          bgGlow: 'bg-emerald-500/20',
          borderColor: 'border-emerald-200/80',
          iconBg: 'bg-emerald-100 border-emerald-200 text-emerald-600',
          Icon: CheckCircle2,
          btnConfirm: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/30',
        };
      case 'warning':
        return {
          bgGlow: 'bg-amber-500/20',
          borderColor: 'border-amber-200/80',
          iconBg: 'bg-amber-100 border-amber-200 text-amber-600',
          Icon: AlertTriangle,
          btnConfirm: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-600/30',
        };
      case 'info':
      default:
        return {
          bgGlow: 'bg-purple-500/20',
          borderColor: 'border-purple-200/80',
          iconBg: 'bg-purple-100 border-purple-200 text-purple-600',
          Icon: Info,
          btnConfirm: 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-600/30',
        };
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle size={16} className="text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-500 shrink-0" />;
      default:
        return <Info size={16} className="text-purple-500 shrink-0" />;
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* 1. Modal Dialog (Alert & Confirm) */}
      <AnimatePresence>
        {dialog && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
            {/* Backdrop click dismisses only for alert, not for confirm */}
            <div
              className="fixed inset-0"
              onClick={() => {
                if (!dialog.isConfirm) handleClose(false);
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={`relative bg-white/95 backdrop-blur-2xl rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-7 shadow-2xl border ${
                getDialogTheme(dialog.type).borderColor
              } text-center overflow-hidden z-10 my-auto`}
            >
              {/* Top ambient glow */}
              <div
                className={`absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
                  getDialogTheme(dialog.type).bgGlow
                }`}
              />

              {/* Close 'X' button top right for alerts */}
              {!dialog.isConfirm && (
                <button
                  onClick={() => handleClose(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"
                  title="Tutup"
                >
                  <X size={16} />
                </button>
              )}

              {/* Animated Top Icon */}
              {(() => {
                const theme = getDialogTheme(dialog.type);
                const IconComponent = theme.Icon;
                return (
                  <div className="relative mb-4">
                    <div
                      className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border shadow-lg ${theme.iconBg} relative z-10 animate-bounce-short`}
                    >
                      <IconComponent size={30} strokeWidth={2.2} />
                    </div>
                    <div
                      className={`absolute inset-0 w-16 h-16 mx-auto rounded-2xl animate-ping opacity-25 ${theme.iconBg}`}
                    />
                  </div>
                );
              })()}

              {/* Title & Content */}
              <h3 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 mb-2 leading-snug">
                {dialog.title}
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 whitespace-pre-line px-1">
                {dialog.message}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3">
                {dialog.isConfirm && (
                  <button
                    type="button"
                    onClick={() => handleClose(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer border border-slate-200"
                  >
                    {dialog.cancelText || 'Batal'}
                  </button>
                )}

                <button
                  type="button"
                  autoFocus
                  onClick={() => handleClose(true)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-lg active:scale-95 transition-all cursor-pointer ${
                    getDialogTheme(dialog.type).btnConfirm
                  }`}
                >
                  {dialog.confirmText || (dialog.isConfirm ? 'Lanjutkan' : 'Mengerti')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Floating Toasts */}
      <div className="fixed top-5 right-4 sm:right-6 z-[99999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-purple-200/90 shadow-xl rounded-2xl p-3.5 flex items-start gap-3 relative overflow-hidden"
            >
              <div className="mt-0.5">{getToastIcon(toast.type)}</div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 flex-1 leading-snug">
                {toast.message}
              </p>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>

              {/* Progress bar countdown */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: (toast.duration || 3500) / 1000, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-0.5 ${
                  toast.type === 'error'
                    ? 'bg-rose-500'
                    : toast.type === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-purple-600'
                }`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>,
    document.body
  );
}
