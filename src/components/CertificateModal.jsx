import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ExternalLink, CheckCircle, User,
  Building, Hash, HardDrive, ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSuccess, playClick } from '../utils/audio';

function fireCelebration() {
  const colors = ['#0066da', '#00ac47', '#ea4335', '#ffba00', '#9333ea', '#ffffff'];
  confetti({
    particleCount: 110,
    spread: 70,
    origin: { y: 0.55 },
    colors,
    startVelocity: 38,
  });
}

// Official Google Drive Icon
export function GoogleDriveIcon({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" className={className}>
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 10.15z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

function getDriveEmbedUrl(url) {
  if (!url) return null;
  // If it's a folder URL: https://drive.google.com/drive/folders/FOLDER_ID
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1] && !folderMatch[1].includes('EXAMPLE')) {
    return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#grid`;
  }
  // If it's a file URL: https://drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }
  return null;
}

export default function CertificateModal({ record, onClose }) {
  if (!record) return null;

  const driveUrl = record.drive_url || 'https://drive.google.com';
  const embedUrl = getDriveEmbedUrl(driveUrl);

  function handleOpenDrive() {
    playClick();
    window.open(driveUrl, '_blank', 'noopener,noreferrer');
  }

  const modalContent = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Modal Window */}
        <motion.div
          className="relative z-10 w-full max-w-3xl max-h-[92vh] overflow-y-auto glass-panel rounded-3xl border border-purple-200/90 shadow-2xl flex flex-col"
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-purple-100 gap-4 bg-white/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 shrink-0">
                <GoogleDriveIcon size={20} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-base sm:text-lg leading-tight">
                  Pratinjau E-Sertifikat Google Drive
                </h3>
                <p className="text-xs text-purple-700 font-semibold">
                  Tersimpan di Cloud Resmi Lab Microleading FTK UIN Alauddin Makassar
                </p>
              </div>
            </div>

            {/* Header Right Action */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenDrive}
                className="btn-shimmer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all"
                title="Buka langsung di Google Drive"
              >
                <GoogleDriveIcon size={15} />
                <span className="hidden sm:inline">Buka di Google Drive</span>
                <ExternalLink size={12} className="text-slate-400" />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors shrink-0"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Google Drive Content View */}
          <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center">
            {embedUrl ? (
              /* Embed Google Drive Iframe if valid file/folder ID */
              <div className="w-full rounded-2xl overflow-hidden border border-purple-200/80 shadow-xl bg-white flex flex-col">
                <div className="bg-slate-100/90 px-4 py-2 border-b border-purple-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold flex items-center gap-1.5 truncate">
                    <GoogleDriveIcon size={14} />
                    Pratinjau Langsung • Sertifikat - {record.nama}.pdf
                  </span>
                  <button
                    onClick={handleOpenDrive}
                    className="text-purple-700 hover:text-purple-900 font-bold inline-flex items-center gap-1 shrink-0 hover:underline"
                  >
                    Buka di Tab Baru <ExternalLink size={11} />
                  </button>
                </div>
                <iframe
                  src={embedUrl}
                  title="Google Drive Certificate Preview"
                  className="w-full h-[450px] sm:h-[500px] border-0"
                  allow="autoplay"
                />
              </div>
            ) : (
              /* Clean Luxury Google Drive Document Card */
              <div className="w-full rounded-3xl p-7 sm:p-9 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white text-center shadow-2xl border border-purple-500/30 relative overflow-hidden">
                {/* Subtle Ambient Orbs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-3xl bg-white/10 p-4 mx-auto mb-4 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl shadow-purple-950/50">
                    <GoogleDriveIcon size={46} />
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-3">
                    <CheckCircle size={13} />
                    Dokumen Cloud Tersedia & Siap Diakses
                  </span>

                  <h4 className="font-display font-extrabold text-xl sm:text-2xl text-white mb-2 leading-snug">
                    Sertifikat — {record.nama}
                  </h4>

                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
                    E-Sertifikat resmi kegiatan <strong>{record.workshop_title || 'Workshop Lab Microleading'}</strong> telah tersimpan di Google Drive resmi Laboratorium MPI.
                  </p>

                  <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleOpenDrive}
                      className="btn-shimmer w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 shadow-xl shadow-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <GoogleDriveIcon size={20} />
                      <span>Buka File di Google Drive</span>
                      <ExternalLink size={15} className="text-slate-500 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Info Badges */}
          <div className="px-5 sm:px-6 pb-6 pt-1">
            <div className="glass-card rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border border-purple-100">
              <div className="flex items-start gap-2">
                <Hash size={14} className="text-purple-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">No. Registrasi</p>
                  <p className="font-bold text-slate-900 truncate">{record.cert_number || 'CERT/MPI/2026/0001'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <User size={14} className="text-purple-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Nama Peserta</p>
                  <p className="font-bold text-slate-900 truncate">{record.nama}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Building size={14} className="text-purple-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Instansi</p>
                  <p className="font-bold text-slate-900 truncate">{record.instansi || 'UIN Alauddin Makassar'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <HardDrive size={14} className="text-green-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Penyimpanan</p>
                  <p className="font-bold text-green-700 truncate">Google Drive Cloud</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

// Hook to trigger celebration on open
export function useCertificateModal() {
  const [record, setRecord] = useState(null);

  function openModal(rec) {
    setRecord(rec);
    playSuccess();
    fireCelebration();
  }

  function closeModal() {
    setRecord(null);
  }

  return { record, openModal, closeModal };
}
