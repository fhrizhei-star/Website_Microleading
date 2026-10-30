import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Search, Calendar, Clock, MapPin, User, Send, ExternalLink,
  CheckCircle, CheckCircle2, Loader2, UploadCloud, FileText, Image as ImageIcon,
  File, X, AlertCircle, Sparkles, Building, Mail, Phone, Hash, Check, Zap, Download,
  Eye, Printer, Copy, KeyRound, Lock, Unlock, EyeOff,
  CalendarDays, CalendarClock, Repeat, Timer, Radio, Flame, Ticket, Medal, ShieldAlert,
  BadgeCheck, ShieldOff, ShieldCheck, ClipboardCheck, Hourglass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import {
  getAllWorkshops, getWorkshops, getAttendance, submitAttendance,
  findRegistrationByNimOrCode, getWorkshopAttendanceStatus
} from '../store/dataStore';
import GoogleDriveIcon from '../components/common/GoogleDriveIcon';
import PageTransition, { SectionReveal, StaggerContainer, StaggerItem } from '../components/transitions/PageTransition';
import { playClick, playSuccess, playError } from '../utils/audio';
import { showAlert, showToast } from '../components/common/CoolAlert';

// ========================
// Tab Switcher
// ========================
const TABS = [
  { id: 'form', label: 'Formulir Presensi', icon: Award },
  { id: 'cek', label: 'Cek Sertifikat', icon: Search },
  { id: 'jadwal', label: 'Jadwal Workshop', icon: Calendar },
];

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  if (bytes < k) return bytes + ' B';
  if (bytes < k * k) return (bytes / k).toFixed(1) + ' KB';
  return (bytes / (k * k)).toFixed(1) + ' MB';
}

function getFileIcon(fileName) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png'].includes(ext)) {
    return <ImageIcon size={20} className="text-emerald-500" />;
  }
  if (ext === 'pdf') {
    return <FileText size={20} className="text-rose-500" />;
  }
  if (['docx', 'doc'].includes(ext)) {
    return <FileText size={20} className="text-blue-500" />;
  }
  return <File size={20} className="text-purple-500" />;
}

// ========================
// Workshop Card
// ========================
function WorkshopCard({ workshop, onSelect }) {
  const isOpen = workshop.status === 'open';
  const attendanceStatus = getWorkshopAttendanceStatus(workshop);

  return (
    <div className="group relative rounded-3xl p-6 bg-gradient-to-br from-white/95 via-purple-50/30 to-white/90 border border-purple-200/80 shadow-md shadow-purple-900/5 hover:shadow-xl hover:shadow-purple-900/10 hover:border-purple-300 transition-all duration-300 flex flex-col justify-between h-full overflow-hidden">
      {/* Decorative ambient corner glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/15 transition-all" />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-3.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100/90 text-purple-900 text-[10px] font-bold border border-purple-200 shadow-2xs">
              <Calendar size={11} className="text-purple-700" />
              Kegiatan Lab
            </span>

            {/* Model Jadwal Badge */}
            {workshop.schedule_type === 'recurring' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-2xs">
                <Repeat size={11} className="text-indigo-600" />
                Rutin Berkala
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                <CalendarDays size={11} className="text-slate-600" />
                Tanggal Pasti
              </span>
            )}

            {/* Sertifikasi Badge */}
            {workshop.has_certificate !== false ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
                <Medal size={11} className="text-amber-600" />
                Bersertifikat
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs">
                <ClipboardCheck size={11} className="text-blue-600" />
                Presensi Lab
              </span>
            )}

            {/* Pendaftaran Badge */}
            {workshop.require_registration !== false ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                <Ticket size={11} className="text-purple-600" />
                Wajib Daftar
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
                <BadgeCheck size={11} className="text-teal-600" />
                Bebas Absen
              </span>
            )}
          </div>

          {/* Status Presensi Header Pill */}
          <div className="flex items-center gap-1.5">
            {attendanceStatus.allowed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-400/20">
                {attendanceStatus.code === 'OPEN_LIVE' ? (
                  <>
                    <Radio size={11} className="animate-pulse" />
                    LIVE Buka Manual
                  </>
                ) : (
                  <>
                    <Timer size={11} className="animate-pulse" />
                    Presensi Aktif (Sesuai Jam)
                  </>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                <Lock size={10} className="text-amber-700" />
                {attendanceStatus.statusBadge}
              </span>
            )}
          </div>
        </div>

        <h4 className="font-display font-extrabold text-slate-900 text-base mb-2 leading-snug group-hover:text-purple-900 transition-colors">
          {workshop.title}
        </h4>

        <p className="text-xs text-slate-500 mb-4 line-clamp-3 leading-relaxed">
          {workshop.description}
        </p>

        <div className="pt-3.5 border-t border-purple-100/80 text-xs text-slate-600 space-y-2 mb-5 bg-white/60 p-3 rounded-2xl">
          <div className="flex items-center gap-2">
            <User size={13} className="text-purple-600 shrink-0" />
            <span className="truncate"><strong>Narasumber:</strong> {workshop.speaker}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarClock size={13} className="text-purple-600 shrink-0" />
            <span><strong>Waktu:</strong> {workshop.date} ({workshop.time})</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-rose-500 shrink-0" />
            <span className="truncate"><strong>Lokasi:</strong> {workshop.location || 'Lab Microleading FTK'}</span>
          </div>
        </div>
      </div>

      {attendanceStatus.allowed ? (
        <button
          onClick={() => { playClick(); onSelect(workshop); }}
          className="btn-shimmer relative z-10 w-full py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-md shadow-purple-600/25 hover:shadow-lg hover:shadow-purple-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {attendanceStatus.code === 'OPEN_LIVE' ? <Radio size={13} className="animate-pulse" /> : <Timer size={13} />}
          <span>Pilih & Isi Presensi Ini</span>
        </button>
      ) : isOpen ? (
        <div className="space-y-1.5 relative z-10">
          <div className="w-full py-2.5 px-3 rounded-xl font-bold text-[11px] text-amber-900 bg-amber-50/90 border border-amber-200 flex items-center justify-center gap-1.5 text-center shadow-2xs">
            {attendanceStatus.code === 'DAY_LOCKED' ? (
              <CalendarClock size={13} className="text-amber-700 shrink-0" />
            ) : attendanceStatus.code === 'TIME_LOCKED_EARLY' ? (
              <Hourglass size={13} className="text-amber-700 shrink-0" />
            ) : (
              <Lock size={13} className="text-amber-700 shrink-0" />
            )}
            <span>{attendanceStatus.statusBadge}</span>
          </div>
          <p className="text-[10px] text-slate-500 text-center leading-relaxed px-1">
            {attendanceStatus.reason}
          </p>
          {workshop.require_registration !== false && (
            <a
              href={`/pendaftaran?workshop=${workshop.id}`}
              className="w-full py-2 px-3 rounded-xl font-bold text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center justify-center gap-1.5 transition-colors no-underline shadow-2xs"
            >
              <Ticket size={12} />
              <span>Daftar / Ambil E-Ticket Sesi Ini &rarr;</span>
            </a>
          )}
        </div>
      ) : (
        <div className="relative z-10 w-full py-3 rounded-2xl font-bold text-xs text-slate-500 bg-slate-100 border border-slate-200 flex items-center justify-center gap-2">
          <Lock size={12} />
          <span>Kegiatan Selesai / Ditutup</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Helper Shared Functions: Certificate Rendering & File URL
// ============================================================
export const renderCertCanvas = async (record) => {
  const img = new Image();
  const bgUrl = record.cert_bg || '/img/cert-template.jpg';
  if (bgUrl.startsWith('http') && !bgUrl.includes(window.location.host)) {
    img.crossOrigin = 'anonymous';
  }
  img.src = bgUrl;
  await new Promise((res) => {
    img.onload = () => res();
    img.onerror = () => {
      img.crossOrigin = null;
      img.src = '/img/cert-template.jpg';
      img.onload = () => res();
      img.onerror = () => res();
    };
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width || 1400;
  canvas.height = img.naturalHeight || img.height || 990;
  const ctx = canvas.getContext('2d');

  // 1. Gambar latar belakang template (Portrait atau Landscape)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // 2. Gambar nama peserta sesuai koordinat & font dari admin
  const layout = record.cert_layout || {};
  const fontSize = layout.fontSize || 34;
  const scale = canvas.width / 800;
  const computedFontSize = Math.round(fontSize * scale);
  const fontFamily = layout.fontFamily || "'Playfair Display', Georgia, serif";
  const fontWeight = layout.fontWeight || '700';

  const posX = (canvas.width * (layout.left || 50)) / 100;
  const posY = (canvas.height * (layout.top || 48)) / 100;

  // --- SOLUSI 1: AUTO-SCALING FONT UNTUK NAMA PANJANG ---
  // Tentukan batas aman lebar nama agar tidak menabrak bingkai sertifikat
  const marginDistance = Math.min(posX, canvas.width - posX);
  const maxAllowedWidth = Math.min(canvas.width * 0.82, Math.max(marginDistance * 1.85, 300));

  let actualFontSize = computedFontSize;
  ctx.font = `${fontWeight} ${actualFontSize}px ${fontFamily}`;
  ctx.fillStyle = layout.color || '#854d0e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const namaText = String(record.nama || '').trim();
  let textWidth = ctx.measureText(namaText).width;

  // Jika nama peserta panjang dan melebihi batas aman, perkecil font secara otomatis dan proporsional
  if (textWidth > maxAllowedWidth && textWidth > 0) {
    const scaleFactor = maxAllowedWidth / textWidth;
    const minFontSize = Math.round(16 * scale); // batas minimal font agar tetap terbaca jelas
    actualFontSize = Math.max(Math.floor(computedFontSize * scaleFactor), minFontSize);
    ctx.font = `${fontWeight} ${actualFontSize}px ${fontFamily}`;
    textWidth = ctx.measureText(namaText).width;
  }

  // Tuliskan nama peserta (hanya nama peserta yang ditambahkan otomatis)
  ctx.fillText(namaText, posX, posY);

  // Garis bawah (Underline) presisi mengikuti panjang nama yang telah diskalakan
  if (layout.underline && namaText) {
    const finalLineWidth = Math.min(textWidth, maxAllowedWidth);
    ctx.lineWidth = Math.max(2, Math.round(2 * scale));
    ctx.strokeStyle = layout.color || '#854d0e';
    ctx.beginPath();
    ctx.moveTo(posX - finalLineWidth / 2, posY + actualFontSize / 2 + (4 * scale));
    ctx.lineTo(posX + finalLineWidth / 2, posY + actualFontSize / 2 + (4 * scale));
    ctx.stroke();
  }
  return canvas;
};

export const downloadCertPdf = async (record) => {
  playClick();
  try {
    const canvas = await renderCertCanvas(record);
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    // Deteksi orientasi otomatis: Portrait jika tinggi > lebar atau diset portrait
    const isPortrait = canvas.height > canvas.width || record.cert_layout?.orientation === 'portrait';
    const orientation = isPortrait ? 'portrait' : 'landscape';

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    pdf.save(`Sertifikat - ${record.nama || 'Peserta'}.pdf`);
    playSuccess();
  } catch (err) {
    console.warn('Gagal unduh sertifikat PDF:', err);
  }
};

export const downloadCertFile = async (record, format = 'pdf') => {
  if (format === 'pdf') {
    return downloadCertPdf(record);
  }
  playClick();
  try {
    const canvas = await renderCertCanvas(record);
    const url = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sertifikat - ${record.nama || 'Peserta'}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    playSuccess();
  } catch (err) {
    console.warn('Gagal unduh sertifikat JPG:', err);
  }
};

// URL Google Drive terisolasi khusus untuk nama peserta (tidak membuka file peserta lain)
export function getIsolatedDriveUrl(rec) {
  if (rec.drive_file_url) return rec.drive_file_url;
  const folderId = rec.drive_url?.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1]
    || rec.drive_url?.match(/id=([a-zA-Z0-9_-]+)/)?.[1]
    || '1V1kijDnA1rc7f3AXaZOzafOXjtzPeAag';

  if (rec.drive_webhook_url) {
    return `${rec.drive_webhook_url}?action=open&nama=${encodeURIComponent(rec.nama)}&folderId=${folderId}`;
  }
  return `https://drive.google.com/drive/folders/${folderId}?q=name%20contains%20%27${encodeURIComponent(rec.nama)}%27`;
}

// ============================================================
// Modal Pop-Up Menarik: Ucapan Terima Kasih Telah Mengikuti
// ============================================================
function ThankYouModal({ record, onClose, onGoToCek, onDownload }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = () => {
    if (record?.cert_number) {
      navigator.clipboard?.writeText(record.cert_number);
      setCopied(true);
      playClick();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadClick = async () => {
    setDownloading(true);
    await onDownload(record);
    setDownloading(false);
  };

  if (!record) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
        />

        {/* Modal Window Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-lg bg-gradient-to-b from-white via-purple-50/40 to-white rounded-3xl border border-purple-200/90 shadow-2xl p-6 sm:p-8 text-center space-y-5 my-auto overflow-hidden"
        >
          {/* Ambient Lighting Orbs */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close X Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>

          {/* Top Celebration Animated Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-3xl bg-emerald-400/30 animate-ping" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/30 ring-8 ring-emerald-50">
              <CheckCircle size={40} />
            </div>
          </div>

          <div>
            <span className={`inline-block px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2 border ${record.has_certificate !== false ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
              {record.has_certificate !== false ? 'Presensi Resmi Terverifikasi' : 'Presensi Rutin Terverifikasi'}
            </span>
            <h3 className="font-display font-extrabold text-slate-900 text-2xl sm:text-3xl leading-tight">
              {record.has_certificate !== false ? 'Terima Kasih Telah Mengikuti!' : 'Presensi Berhasil Dicatat!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto mt-1.5 leading-relaxed">
              {record.has_certificate !== false
                ? 'Kehadiran dan berkas bukti absensi Anda telah berhasil dicatat dalam basis data resmi Laboratorium MPI FTK UIN Alauddin Makassar.'
                : 'Data kehadiran Anda telah resmi tersimpan dalam arsip rekapitulasi presensi Laboratorium MPI FTK UIN Alauddin Makassar.'}
            </p>
          </div>

          {/* Participant Bento Detail Box */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-purple-50/80 via-white to-purple-50/40 border border-purple-200/80 text-left space-y-3 shadow-xs overflow-hidden">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <User size={18} />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nama Peserta</p>
                <h4 className="font-display font-extrabold text-purple-950 text-sm sm:text-base break-words">
                  {record.nama}
                </h4>
              </div>
            </div>

            <div className="pt-2 border-t border-purple-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="min-w-0 overflow-hidden">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Identitas / NIM</p>
                <p className="font-semibold text-slate-800 break-words">{record.identitas} ({record.instansi})</p>
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Kegiatan</p>
                <p className="font-semibold text-purple-800 break-words">{record.workshop_title}</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-purple-100 flex items-center justify-between gap-2 text-xs font-mono">
              <span className="text-slate-500 min-w-0 truncate text-[11px] sm:text-xs">
                {record.has_certificate !== false ? 'No. Reg: ' : 'No. Presensi: '}
                <strong className="text-purple-950 break-all">{record.cert_number}</strong>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 px-2 py-0.5 rounded-md hover:bg-purple-50 transition-colors shrink-0 cursor-pointer"
              >
                <Copy size={12} />
                <span>{copied ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Privacy & Dedicated Menu Note */}
          {record.has_certificate !== false ? (
            <div className="rounded-2xl p-3.5 bg-amber-50/90 border border-amber-200 text-amber-950 text-xs text-left flex items-start gap-2.5">
              <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Privasi Sertifikat Terjamin:</strong> Sertifikat Anda disiapkan khusus atas nama Anda sendiri. Untuk melihat, mengambil, atau mencetak sertifikat resmi, silakan gunakan tab menu <strong>Cek Sertifikat</strong> kapan saja tanpa membuka akses berkas peserta lain.
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-3.5 bg-blue-50/90 border border-blue-200 text-blue-950 text-xs text-left flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Presensi Kegiatan Rutin Lab:</strong> Kegiatan ini merupakan kegiatan reguler praktikum/rutin laboratorium yang berfokus pada rekapitulasi kehadiran resmi tanpa penerbitan sertifikat. Data Anda aman tercatat di sistem lab.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {record.has_certificate !== false ? (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  onGoToCek(record.nama);
                }}
                className="btn-shimmer w-full py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <Search size={16} />
                <span>Lihat di Menu Cek Sertifikat</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadClick}
                disabled={downloading}
                className="w-full py-3 rounded-2xl text-xs sm:text-sm font-bold text-purple-900 bg-white hover:bg-purple-50 border-2 border-purple-200 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <FileText size={16} className={downloading ? 'animate-bounce text-purple-600' : 'text-purple-600'} />
                <span>{downloading ? 'Menyiapkan Dokumen PDF...' : 'Unduh Langsung Sertifikat (.PDF)'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 py-1 transition-colors cursor-pointer block mx-auto"
              >
                Tutup & Selesai
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="btn-shimmer w-full py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>Presensi Selesai & Tutup</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

// ============================================================
// Modal Ambil & Pratinjau Sertifikat Resmi (Lightbox View)
// ============================================================
function CertificatePreviewModal({ record, onClose }) {
  const [loadingImg, setLoadingImg] = useState(true);
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    let active = true;
    renderCertCanvas(record).then(canvas => {
      if (active) {
        setDataUrl(canvas.toDataURL('image/jpeg', 0.95));
        setLoadingImg(false);
      }
    });
    return () => { active = false; };
  }, [record]);

  if (!record) return null;

  const fileName = `Sertifikat - ${record.nama || 'Peserta'}.pdf`;

  const handlePrint = () => {
    playClick();
    if (!dataUrl) return;
    const isPortrait = record.cert_layout?.orientation === 'portrait';
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${fileName}</title>
            <style>
              @page { size: ${isPortrait ? 'portrait' : 'landscape'}; margin: 0; }
              body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
              img { max-width: 100%; max-height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print();window.close();" />
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex flex-col bg-[#111827]/98 backdrop-blur-md text-white select-none">
        {/* Top Navbar */}
        <div className="h-14 px-4 bg-[#202124] border-b border-white/10 flex items-center justify-between shrink-0 z-10 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Tutup (Kembali)"
            >
              <X size={20} />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Award size={18} className="text-amber-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                {fileName}
              </p>
              <p className="text-[10px] text-slate-400 hidden sm:block truncate">
                E-Sertifikat Resmi • Laboratorium MPI FTK UIN Alauddin Makassar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="p-2 sm:px-3 sm:py-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Cetak Sertifikat Langsung"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              onClick={() => downloadCertFile(record, 'jpg')}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Unduh Format Gambar (.JPG)"
            >
              <ImageIcon size={14} className="text-emerald-400" />
              <span className="hidden sm:inline">Unduh .JPG</span>
            </button>

            <button
              onClick={() => downloadCertPdf(record)}
              className="btn-shimmer inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-md shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              title="Unduh Dokumen Resmi (.PDF)"
            >
              <FileText size={15} className="text-amber-300" />
              <span>Unduh Sertifikat (.PDF)</span>
            </button>
          </div>
        </div>

        {/* Center Preview Image */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden relative">
          {loadingImg ? (
            <div className="text-center space-y-3">
              <Loader2 size={36} className="animate-spin text-purple-400 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Menyiapkan sertifikat resmi...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-lg overflow-hidden border border-white/10"
            >
              <img
                src={dataUrl}
                alt={fileName}
                className="max-w-full max-h-[82vh] object-contain shadow-2xl"
              />
            </motion.div>
          )}
        </div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

// ========================
// Attendance Form Component
// ========================
function AttendanceForm({ workshops, selectedWorkshop, onGoToCek }) {
  const [form, setForm] = useState({
    workshop_id: selectedWorkshop?.id || '',
    nama: '',
    identitas: '',
    instansi: '',
    email: '',
    whatsapp: '',
    kesan: '',
    pin: ''
  });
  const [showPin, setShowPin] = useState(false);

  const [buktiFile, setBuktiFile] = useState(null); // { name, size, type, dataUrl }
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);
  const [successRecord, setSuccessRecord] = useState(null);

  const [fileInputRef] = [useRef(null)];
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupSuccess, setLookupSuccess] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const currentSelectedWs = workshops.find(w => String(w.id) === String(form.workshop_id)) || banner || selectedWorkshop;
  const attendanceAccess = getWorkshopAttendanceStatus(currentSelectedWs);

  const handleAutoFillFromRegistration = async () => {
    if (!lookupQuery.trim()) {
      showToast('Ketik NIM atau Kode Registrasi terlebih dahulu', 'warning');
      return;
    }
    playClick();
    setIsSearching(true);
    try {
      const match = await findRegistrationByNimOrCode(lookupQuery, form.workshop_id || null);
      if (match) {
        setForm(f => ({
          ...f,
          workshop_id: match.workshop_id || f.workshop_id,
          nama: match.nama || f.nama,
          identitas: match.nim_nip || f.identitas,
          instansi: match.instansi || f.instansi,
          whatsapp: match.whatsapp || f.whatsapp,
          email: match.email || f.email,
        }));
        if (match.workshop_id) {
          handleWorkshopChange(match.workshop_id);
        }
        setLookupSuccess(match);
        playSuccess();
        showToast(`Data ${match.nama} ditemukan & diisi otomatis!`, 'success');
      } else {
        playError();
        setLookupSuccess(null);
        showAlert({
          title: 'Data Belum Ditemukan',
          message: `Tidak ditemukan pendaftaran dengan NIM / Kode "${lookupQuery}". Anda dapat melanjutkan dengan mengisi formulir presensi secara manual di bawah.`,
          type: 'info'
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (selectedWorkshop) {
      setForm(f => ({ ...f, workshop_id: selectedWorkshop.id }));
      setBanner(selectedWorkshop);
    }
  }, [selectedWorkshop]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleWorkshopChange = (id) => {
    set('workshop_id', id);
    const ws = workshops.find(w => String(w.id) === String(id));
    setBanner(ws || null);
  };

  const handleProcessFile = (file) => {
    setUploadError('');
    if (!file) return;

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'doc'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      setUploadError('Format file tidak didukung! Harap unggah file JPG, PNG, PDF, atau DOCX.');
      playError();
      return;
    }

    // Otomatis kompres gambar jika file bertipe foto (JPG, PNG, WebP)
    if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png'].includes(fileExt)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1000;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);

          setBuktiFile({
            name: file.name.replace(/\.[^.]+$/, '.jpg'),
            size: compressedSize,
            type: 'image/jpeg',
            dataUrl: compressedDataUrl,
          });
          playSuccess();
        };
        img.onerror = () => {
          setUploadError('Gagal memproses gambar. Harap pilih gambar lain.');
          playError();
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        setUploadError('Gagal membaca file. Silakan pilih kembali.');
        playError();
      };
      reader.readAsDataURL(file);
      return;
    }

    // Untuk dokumen PDF / DOCX, batasi maksimal 800KB agar muat di Cloud Firestore
    if (file.size > 800 * 1024) {
      setUploadError('Ukuran dokumen melebihi 800 KB! Disarankan mengambil foto/screenshot bukti lalu mengunggahnya sebagai gambar JPG/PNG.');
      playError();
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setBuktiFile({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: e.target.result,
      });
      playSuccess();
    };
    reader.onerror = () => {
      setUploadError('Gagal membaca file. Silakan pilih kembali.');
      playError();
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleRemoveFile = () => {
    setBuktiFile(null);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleWhatsAppInput = (val) => {
    let clean = val.replace(/[^\d+]/g, '');
    if (clean.startsWith('62')) clean = '0' + clean.slice(2);
    set('whatsapp', clean);
  };

  const [showThankYouModal, setShowThankYouModal] = useState(false);

  // Otomasi generate & upload sertifikat ke Google Drive Webhook
  const uploadCertToDriveWebhook = async (record) => {
    if (!record?.drive_webhook_url) return;
    try {
      const canvas = await renderCertCanvas(record);
      const base64Data = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
      const folderId = record.drive_url?.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] || '';

      // Kirim ke Google Apps Script Webhook
      fetch(record.drive_webhook_url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          nama: record.nama,
          identitas: record.identitas,
          workshop_title: record.workshop_title,
          cert_number: record.cert_number,
          folderId: folderId,
          base64: base64Data,
          mimeType: 'image/jpeg'
        })
      }).then(() => {
        console.log('🚀 [Google Drive] Berhasil mengirim sertifikat otomatis ke Drive untuk:', record.nama);
      }).catch((err) => {
        console.warn('⚠️ [Google Drive] Gagal upload ke Webhook:', err);
      });
    } catch (err) {
      console.warn('⚠️ [Google Drive] Error pembuatan sertifikat:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.workshop_id) {
      showAlert({
        title: 'Workshop Belum Dipilih',
        message: 'Silakan pilih workshop yang Anda ikuti terlebih dahulu sebelum mengisi kehadiran.',
        type: 'warning',
      });
      return;
    }

    // 0. Evaluasi 3 Lapis Keamanan Presensi
    const access = getWorkshopAttendanceStatus(currentSelectedWs);
    if (!access.allowed) {
      playError();
      showAlert({
        title: 'Presensi Belum Dibuka',
        message: access.reason,
        type: 'warning',
      });
      return;
    }

    if (access.requiresPin) {
      const userPin = (form.pin || '').trim().toUpperCase();
      const expectedPin = (access.pin || '').trim().toUpperCase();
      if (!userPin) {
        playError();
        showAlert({
          title: 'PIN Presensi Diperlukan',
          message: 'Kegiatan ini mewajibkan PIN Presensi. Silakan masukkan PIN resmi yang ditampilkan panitia di slide proyektor ruangan.',
          type: 'warning',
        });
        document.getElementById('input-presensi-pin')?.focus();
        return;
      }
      if (userPin !== expectedPin) {
        playError();
        showAlert({
          title: 'PIN Presensi Salah',
          message: 'PIN yang Anda masukkan tidak sesuai. Silakan periksa kembali PIN resmi yang ditampilkan oleh panitia/pemateri di dalam ruangan.',
          type: 'error',
        });
        return;
      }
    }

    if (!buktiFile) {
      setUploadError('Wajib melampirkan berkas bukti kehadiran (JPG, PNG, PDF, atau DOCX)!');
      playError();
      document.getElementById('section-bukti')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      // 1. Cek kebijakan pendaftaran sebelum presensi
      if (currentSelectedWs && currentSelectedWs.require_registration !== false) {
        const matchReg = await findRegistrationByNimOrCode(form.identitas, form.workshop_id);
        if (!matchReg) {
          setLoading(false);
          playError();
          const goToRegister = await showConfirm({
            title: 'NIM Belum Terdaftar!',
            message: `Kegiatan "${currentSelectedWs.title}" mewajibkan pendaftaran sebelum pengisian presensi.\n\nNIM / Identitas Anda (${form.identitas}) belum ditemukan dalam daftar peserta. Apakah Anda ingin membuka formulir pendaftaran sekarang?`,
            type: 'warning',
            confirmText: 'Daftar Sekarang (Hanya 30 Detik) →',
            cancelText: 'Periksa Kembali NIM',
          });
          if (goToRegister) {
            window.location.href = `/pendaftaran?workshop=${currentSelectedWs.id}`;
          }
          return;
        }
      }

      // 2. Cek duplikasi presensi (Rutin: per hari yang sama | Single: sekali acara)
      const existingAttendance = await getAttendance();
      const isRecurring = currentSelectedWs?.schedule_type === 'recurring';
      const now = new Date();
      const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      if (isRecurring) {
        // Untuk kegiatan rutin berkala, cegah presensi ganda pada tanggal HARI INI
        const duplicateToday = existingAttendance.find(
          (r) =>
            String(r.workshop_id) === String(form.workshop_id) &&
            String(r.identitas).trim().toUpperCase() === String(form.identitas).trim().toUpperCase() &&
            r.timestamp && r.timestamp.startsWith(todayDateStr)
        );

        if (duplicateToday) {
          setLoading(false);
          showAlert({
            title: 'Presensi Hari Ini Sudah Diisi',
            message: `NIM ${form.identitas} sudah tercatat presensi pada hari ini (${todayDateStr}) untuk sesi praktikum ini.`,
            type: 'info',
          });
          setSuccessRecord(duplicateToday);
          return;
        }
      } else {
        // Untuk workshop sekali jalan: 1 NIM hanya 1 kali
        const duplicateRecord = existingAttendance.find(
          (r) =>
            String(r.workshop_id) === String(form.workshop_id) &&
            String(r.identitas).trim().toUpperCase() === String(form.identitas).trim().toUpperCase()
        );

        if (duplicateRecord) {
          setLoading(false);
          showAlert({
            title: 'Presensi Sudah Pernah Diisi',
            message: `NIM ${form.identitas} sudah tercatat presensi pada kegiatan ini dengan nomor referensi ${duplicateRecord.cert_number}.`,
            type: 'info',
          });
          setSuccessRecord(duplicateRecord);
          return;
        }
      }

      const payload = {
        ...form,
        bukti_file: {
          name: buktiFile.name,
          size: buktiFile.size,
          type: buktiFile.type,
          dataUrl: buktiFile.dataUrl,
        },
      };

      const result = await submitAttendance(payload);

      // Trigger upload otomatis ke Google Drive jika admin memasang Webhook URL
      if (result?.drive_webhook_url) {
        uploadCertToDriveWebhook(result);
      }

      playSuccess();
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#0066da', '#00ac47', '#ea4335', '#ffba00', '#9333ea', '#ffffff'],
      });

      // Pop-up Menarik Ucapan Terima Kasih (TIDAK langsung membuka tab baru ke Google Drive)
      setSuccessRecord(result);
      setShowThankYouModal(true);

      // Reset form
      setForm({ workshop_id: '', nama: '', identitas: '', instansi: '', email: '', whatsapp: '', kesan: '', pin: '' });
      setBuktiFile(null);
      setBanner(null);
    } catch (err) {
      playError();
      if (err?.code === 'ALREADY_ATTENDED_TODAY' || err?.code === 'ALREADY_ATTENDED') {
        showAlert({
          title: 'Presensi Sudah Tercatat',
          message: err.message,
          type: 'info',
        });
        if (err.record) setSuccessRecord(err.record);
        return;
      }
      if (err?.code === 'NOT_REGISTERED') {
        const goToRegister = await showConfirm({
          title: 'NIM Belum Terdaftar!',
          message: `${err.message}\n\nIngin membuka formulir pendaftaran sekarang?`,
          type: 'warning',
          confirmText: 'Daftar Sekarang (Hanya 30 Detik) →',
          cancelText: 'Periksa Kembali NIM',
        });
        if (goToRegister) {
          window.location.href = `/pendaftaran?workshop=${currentSelectedWs?.id || form.workshop_id}`;
        }
        return;
      }
      showAlert({
        title: 'Gagal Mengirim Presensi',
        message: err?.message || 'Terjadi kendala saat menyimpan data presensi Anda. Silakan periksa koneksi internet dan coba lagi.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pop-up Menarik Ucapan Terima Kasih Telah Mengikuti */}
      {showThankYouModal && successRecord && (
        <ThankYouModal
          record={successRecord}
          onClose={() => setShowThankYouModal(false)}
          onGoToCek={(name) => {
            setShowThankYouModal(false);
            onGoToCek?.(name);
          }}
          onDownload={(rec) => downloadCertFile(rec)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Quick Auto-Fill from Registration Box */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-100/90 via-indigo-50/80 to-purple-50/90 border-2 border-purple-300/80 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Sudah Mendaftar Workshop Sebelumnya?</h4>
                <p className="text-[11px] text-slate-600">Ketik NIM atau Kode Registrasi Anda untuk mengisi formulir secara otomatis</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={lookupQuery}
                onChange={e => setLookupQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAutoFillFromRegistration(); } }}
                placeholder="Ketik NIM / No. Registrasi..."
                className="px-3.5 py-2 rounded-xl border border-purple-300 text-xs bg-white text-slate-900 focus:outline-none focus:border-purple-600 flex-1 sm:w-56 font-mono"
              />
              <button
                type="button"
                onClick={handleAutoFillFromRegistration}
                disabled={isSearching}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 transition-colors shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Search size={13} />
                <span>{isSearching ? 'Mencari...' : 'Auto-Fill'}</span>
              </button>
            </div>
          </div>

          {lookupSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-2.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span className="truncate">
                  Terdaftar: <strong>{lookupSuccess.nama}</strong> ({lookupSuccess.reg_code}) - Data berhasil diisi otomatis.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLookupSuccess(null)}
                className="text-[10px] text-emerald-700 font-bold hover:underline shrink-0"
              >
                Tutup
              </button>
            </motion.div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECTION 1: Pilih Workshop / Kegiatan (Modern Card Styling)   */}
        {/* ============================================================ */}
        <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-white/90 via-purple-50/20 to-white/80 border border-purple-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-purple-100">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-600/25">
              1
            </div>
            <div>
              <h3 className="font-display font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Pilih Workshop / Kegiatan
              </h3>
              <p className="text-[11px] text-slate-500">Tentukan sesi praktikum atau workshop yang Anda ikuti</p>
            </div>
          </div>

          <div className="relative">
            <select
              value={form.workshop_id}
              onChange={e => handleWorkshopChange(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-purple-200/80 bg-white text-sm text-slate-900 font-semibold focus:border-purple-600 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all cursor-pointer shadow-xs"
              required
            >
              <option value="">-- Pilih Kegiatan yang Diikuti --</option>
              {workshops.filter(w => w.status === 'open' || w.is_attendance_open === true || w.attendance_mode === 'open').map(w => {
                const st = getWorkshopAttendanceStatus(w);
                const statusTag = st.allowed
                  ? (st.code === 'OPEN_LIVE' ? '⚡ [Buka Manual]' : '⏰ [Presensi Aktif]')
                  : `🔒 [${st.statusBadge}]`;
                return (
                  <option key={w.id} value={w.id}>
                    {w.title} ({w.date}) {statusTag}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Selected Workshop Live Banner Card */}
          <AnimatePresence>
            {banner && (
              <motion.div
                className="rounded-2xl p-4 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50 border border-purple-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm leading-tight">{banner.speaker}</p>
                    <p className="text-purple-700 font-semibold text-[11px] mt-0.5">Narasumber / Instruktur Utama</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-slate-600 text-[11px] font-medium pt-2 sm:pt-0 border-t sm:border-t-0 border-purple-100">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-purple-200">
                    <Clock size={11} className="text-purple-600" />
                    {banner.date} ({banner.time})
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-purple-200">
                    <MapPin size={11} className="text-rose-500" />
                    {banner.location || 'Lab Microleading'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Kunci Keamanan Presensi (Date-Lock / Saklar Panitia) */}
          {currentSelectedWs && (
            <AnimatePresence mode="wait">
              {!attendanceAccess.allowed ? (
                <motion.div
                  key="locked-banner"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="p-4 sm:p-5 rounded-2xl bg-amber-50/95 border-2 border-amber-300 text-amber-950 text-xs space-y-2.5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
                      {attendanceAccess.code === 'DAY_LOCKED' ? (
                        <CalendarClock size={20} />
                      ) : attendanceAccess.code === 'TIME_LOCKED_EARLY' ? (
                        <Hourglass size={20} />
                      ) : (
                        <Lock size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h4 className="font-extrabold text-amber-950 text-sm">
                          Sesi Presensi Belum Dibuka
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                          {attendanceAccess.statusBadge}
                        </span>
                      </div>
                      <p className="text-amber-800 text-xs leading-relaxed">
                        {attendanceAccess.reason}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between flex-wrap gap-2 text-[11px] font-semibold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <Ticket size={12} className="text-amber-700" />
                      Simpan nomor tiket registrasi Anda untuk verifikasi pada Hari-H.
                    </span>
                    <a
                      href={`/pendaftaran?tab=cek`}
                      className="inline-flex items-center gap-1 underline hover:text-amber-950 font-bold"
                    >
                      <span>Cek Tiket Pendaftaran</span>
                      <span>&rarr;</span>
                    </a>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="open-banner"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                    attendanceAccess.code === 'OPEN_LIVE'
                      ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300 text-emerald-950'
                      : (currentSelectedWs.has_certificate !== false
                        ? 'bg-gradient-to-r from-purple-50 via-indigo-50/40 to-purple-50 border-purple-300 text-purple-950'
                        : 'bg-gradient-to-r from-blue-50 via-indigo-50/40 to-blue-50 border-blue-300 text-blue-950')
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                      attendanceAccess.code === 'OPEN_LIVE'
                        ? 'bg-emerald-600 text-white'
                        : (currentSelectedWs.has_certificate !== false ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white')
                    }`}>
                      {attendanceAccess.code === 'OPEN_LIVE' ? (
                        <Radio size={16} className="animate-pulse" />
                      ) : (
                        <Timer size={16} />
                      )}
                    </div>
                    <div>
                      <p className="font-extrabold text-sm leading-tight">
                        {attendanceAccess.code === 'OPEN_LIVE'
                          ? 'Presensi DIBUKA MANUAL oleh Panitia di Ruangan'
                          : (currentSelectedWs.has_certificate !== false
                            ? 'Presensi Hari-H Aktif Otomatis — Sesuai Jam Pelaksanaan'
                            : 'Presensi Praktikum Aktif Otomatis — Sesuai Jam Praktikum Lab')}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {attendanceAccess.reason}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold shrink-0 self-start sm:self-center shadow-2xs flex items-center gap-1.5 ${
                    attendanceAccess.code === 'OPEN_LIVE'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : (currentSelectedWs.has_certificate !== false
                        ? 'bg-purple-100 text-purple-900 border border-purple-300'
                        : 'bg-blue-100 text-blue-900 border border-blue-300')
                  }`}>
                    {attendanceAccess.code === 'OPEN_LIVE' ? (
                      <>
                        <Zap size={11} className="text-emerald-700" />
                        BUKA MANUAL
                      </>
                    ) : (
                      <>
                        <Timer size={11} className="text-purple-700" />
                        {currentSelectedWs.has_certificate !== false ? 'SIAP ABSEN' : 'PRESENSI RUTIN'}
                      </>
                    )}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECTION 1.5: PIN Presensi Hari-H (Jika Workshop Memakai PIN) */}
        {/* ============================================================ */}
        {currentSelectedWs && attendanceAccess.allowed && attendanceAccess.requiresPin && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/70 border-2 border-indigo-200 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-indigo-100 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-600/25">
                  <KeyRound size={15} />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    PIN Presensi Hari-H <span className="text-rose-500">*</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Masukkan kode verifikasi yang dibagikan narasumber di ruangan</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-300 flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck size={12} className="text-indigo-700" /> Verifikasi Ruangan Fisik
              </span>
            </div>

            <div className="relative max-w-sm">
              <input
                id="input-presensi-pin"
                type={showPin ? "text" : "password"}
                value={form.pin}
                onChange={e => set('pin', e.target.value.toUpperCase())}
                placeholder="Ketik PIN Presensi..."
                maxLength={12}
                required
                className="w-full pl-4 pr-12 py-3 rounded-2xl border-2 border-indigo-300 bg-white text-base text-indigo-950 font-mono font-extrabold tracking-widest focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-1 cursor-pointer transition-colors"
                title={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-indigo-800 font-medium flex items-center gap-1.5">
              <Sparkles size={12} className="text-indigo-600 shrink-0" />
              PIN rahasia ini ditampilkan di slide proyektor ruangan untuk memastikan kehadiran fisik peserta.
            </p>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* SECTION 2: Data Identitas Peserta (Clean Input Group Icons)  */}
        {/* ============================================================ */}
        <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-white/90 via-purple-50/20 to-white/80 border border-purple-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-purple-100">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-600/25">
              2
            </div>
            <div>
              <h3 className="font-display font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Data Identitas Peserta
              </h3>
              <p className="text-[11px] text-slate-500">Pastikan nama dan nomor identitas sesuai dengan kartu mahasiswa/KTP</p>
            </div>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            {/* Nama Lengkap */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Nama Lengkap & Gelar <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 pointer-events-none" />
                <input
                  type="text"
                  value={form.nama}
                  onChange={e => set('nama', e.target.value)}
                  placeholder="Contoh: Ahmad Rizky Pratama, S.Pd."
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-200/90 bg-white/90 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-purple-600 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* NIM / No Identitas */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                NIM / Nomor Identitas <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 pointer-events-none" />
                <input
                  type="text"
                  value={form.identitas}
                  onChange={e => set('identitas', e.target.value.toUpperCase())}
                  placeholder="Contoh: 20400121045"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-200/90 bg-white/90 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-purple-600 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Institusi / Kampus */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Institusi / Perguruan Tinggi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 pointer-events-none" />
                <input
                  type="text"
                  value={form.instansi}
                  onChange={e => set('instansi', e.target.value)}
                  placeholder="Contoh: UIN Alauddin Makassar"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-200/90 bg-white/90 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-purple-600 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all shadow-xs"
                />
              </div>

            </div>

            {/* Alamat Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Alamat Email Aktif <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-200/90 bg-white/90 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-purple-600 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Nomor WhatsApp */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Nomor WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600 pointer-events-none" />
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={e => handleWhatsAppInput(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-200/90 bg-white/90 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-purple-600 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 3: Unggah Bukti Kehadiran (JPG, PNG, PDF, DOCX)      */}
        {/* ============================================================ */}
        <div id="section-bukti" className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-white/90 via-purple-50/20 to-white/80 border border-purple-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-purple-100 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-600/25">
                3
              </div>
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                  Unggah Bukti Kehadiran <span className="text-rose-500">*</span>
                </h3>
                <p className="text-[11px] text-slate-500">Foto selfie di lokasi, screenshot zoom, atau surat tugas praktikum</p>
              </div>
            </div>

            {/* Format badges */}
            <div className="flex items-center gap-1.5">
              {['JPG', 'PNG', 'PDF', 'DOCX'].map(fmt => (
                <span key={fmt} className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-extrabold border border-purple-200">
                  {fmt}
                </span>
              ))}
            </div>
          </div>

          {/* Interactive Drag & Drop Box */}
          {!buktiFile ? (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 flex flex-col items-center justify-center gap-3 ${isDragging
                  ? 'border-purple-600 bg-purple-100/60 scale-[1.01]'
                  : 'border-purple-300/80 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-500'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.docx,.doc,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-white text-purple-600 flex items-center justify-center shadow-md border border-purple-100">
                <UploadCloud size={28} className="animate-pulse" />
              </div>

              <div>
                <p className="font-bold text-slate-900 text-sm sm:text-base">
                  Klik untuk Memilih File atau Seret & Lepas ke Sini
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Mendukung format <strong>JPG, PNG, PDF, atau DOCX</strong> (Maks. 15MB)
                </p>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-purple-700 text-xs font-bold border border-purple-200 shadow-2xs">
                <Sparkles size={12} />
                Pilih Berkas Bukti
              </span>
            </div>
          ) : (
            /* Uploaded File Selected State */
            <div className="rounded-2xl p-4 bg-white border-2 border-emerald-300 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
                  {getFileIcon(buktiFile.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">{buktiFile.name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>{formatFileSize(buktiFile.size)}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check size={12} /> Siap diunggah
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Hapus dan ganti file"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              <AlertCircle size={15} className="shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECTION 4: Kesan, Pesan & Saran                             */}
        {/* ============================================================ */}
        <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-white/90 via-purple-50/20 to-white/80 border border-purple-200/90 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-purple-100">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-600/25">
              4
            </div>
            <div>
              <h3 className="font-display font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                Kesan, Pesan & Saran <span className="text-slate-400 text-xs font-normal">(Opsional)</span>
              </h3>
              <p className="text-[11px] text-slate-500">Berikan ulasan dan masukan Anda untuk peningkatan praktikum berikutnya</p>
            </div>
          </div>

          <textarea
            value={form.kesan}
            onChange={e => set('kesan', e.target.value)}
            placeholder="Tuliskan pengalaman, masukan materi, atau pesan untuk penyelenggara kegiatan..."
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200/90 bg-white/90 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:border-purple-600 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all resize-none shadow-xs"
          />


        </div>

        {/* ============================================================ */}
        {/* Submit Button (Luxury Shimmer Gradient)                     */}
        {/* ============================================================ */}
        {currentSelectedWs && !attendanceAccess.allowed ? (
          <div className="w-full py-4.5 px-6 rounded-2xl font-display font-extrabold text-sm sm:text-base text-amber-900 bg-amber-100/90 border-2 border-amber-300 flex items-center justify-center gap-2.5 text-center shadow-xs">
            <Lock size={18} className="text-amber-700 shrink-0" />
            <span>Presensi Sesi Ini Belum Dibuka oleh Panitia</span>
          </div>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="btn-shimmer w-full py-4.5 rounded-2xl font-display font-extrabold text-sm sm:text-base text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-xl shadow-purple-600/30 hover:shadow-2xl hover:shadow-purple-600/50 flex items-center justify-center gap-2.5 disabled:opacity-70 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            <span>{loading ? 'Menyimpan Presensi & Mengunggah Bukti...' : 'Kirim Presensi & Ambil Sertifikat'}</span>
          </button>
        )}
      </form>
    </div>
  );
}

// ========================
// Certificate Search
// ========================
function CertSearch({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewRecord, setPreviewRecord] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const search = async (q = query) => {
    setLoading(true);
    try {
      const data = await getAttendance(q);
      setResults(data);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    setQuery(initialQuery);
    search(initialQuery);
  }, [initialQuery]);

  const handleDownload = async (rec) => {
    setDownloadingId(rec.id);
    await downloadCertFile(rec);
    setDownloadingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Pratinjau & Ambil Sertifikat Modal (Fullscreen Lightbox) */}
      {previewRecord && (
        <CertificatePreviewModal
          record={previewRecord}
          onClose={() => setPreviewRecord(null)}
        />
      )}

      {/* Modern Search Input Bar */}
      <div className="flex gap-2 sm:gap-2.5 w-full">
        <div className="relative flex-1 min-w-0">
          <Search size={18} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-purple-600 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search(query)}
            placeholder="Cari nama, NIM, institusi..."
            className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-3 sm:py-3.5 rounded-2xl border-2 border-purple-200/80 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-semibold focus:border-purple-600 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all shadow-xs"
          />
        </div>
        <button
          onClick={() => { playClick(); search(query); }}
          className="btn-shimmer px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/25 hover:shadow-lg hover:shadow-purple-600/35 flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 transition-all cursor-pointer"
        >
          <Search size={15} />
          <span>Cari</span>
        </button>
      </div>

      {loading && (
        <div className="text-center py-10">
          <Loader2 size={32} className="animate-spin text-purple-600 mx-auto mb-2.5" />
          <p className="text-sm font-semibold text-slate-600">Mencari data sertifikat...</p>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-3.5">
        {!loading && results.length === 0 && (
          <div className="text-center py-12 px-4 rounded-3xl bg-white/70 border border-purple-100 text-slate-400">
            <Award size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Tidak ada data ditemukan</p>
            <p className="text-xs text-slate-500 mt-0.5">Silakan ketik nama peserta atau isi formulir presensi untuk menerbitkan sertifikat.</p>
          </div>
        )}

        {results.map(rec => (
          <div
            key={rec.id}
            className="group rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white/95 via-purple-50/20 to-white/90 border border-purple-200/90 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 overflow-hidden w-full"
          >
            <div className="w-full min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                {rec.has_certificate !== false ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] sm:text-[11px] font-bold border border-emerald-200 shrink-0">
                    <Check size={11} /> Sertifikat Terverifikasi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] sm:text-[11px] font-bold border border-blue-200 shrink-0">
                    <Check size={11} /> Presensi Rutin Terdata
                  </span>
                )}
                <span className="font-mono text-[11px] sm:text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-semibold border border-slate-200 break-all">
                  {rec.cert_number}
                </span>
                {rec.bukti_file && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold shrink-0">
                    📎 Bukti Terlampir
                  </span>
                )}
              </div>
              <h4 className="font-display font-extrabold text-slate-900 text-sm sm:text-base mb-1 break-words group-hover:text-purple-900 transition-colors">
                {rec.nama}
              </h4>
              <p className="text-xs text-slate-500 break-words">
                {rec.instansi} • <span className="font-mono text-purple-700 font-semibold">NIM: {rec.identitas}</span>
              </p>
              <p className="text-xs font-bold text-purple-700 mt-1 break-words line-clamp-2">
                🏆 {rec.workshop_title}
              </p>
            </div>

            {/* Action Buttons: Ambil Sertifikat (Membuka Lightbox) & Unduh Langsung */}
            <div className="flex items-center gap-2 w-full lg:w-auto justify-end sm:justify-start shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-purple-100/80">
              {rec.has_certificate !== false ? (
                <>
                  {/* Button 1: Ambil Sertifikat (Membuka Lightbox View) */}
                  <button
                    type="button"
                    onClick={() => { playClick(); setPreviewRecord(rec); }}
                    className="btn-shimmer flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-md shadow-purple-600/25 hover:shadow-lg hover:shadow-purple-600/40 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    title="Buka dan ambil e-sertifikat resmi Anda"
                  >
                    <Award size={15} className="text-amber-300 shrink-0" />
                    <span className="truncate">Ambil Sertifikat</span>
                  </button>

                  {/* Button 2: Unduh Langsung .PDF */}
                  <button
                    type="button"
                    onClick={() => handleDownload(rec)}
                    disabled={downloadingId === rec.id}
                    className="p-2.5 rounded-2xl bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
                    title="Unduh Langsung Sertifikat Resmi (.PDF)"
                  >
                    <Download size={15} className={downloadingId === rec.id ? 'animate-bounce text-purple-600' : ''} />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                  <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                  <span>Presensi Rutin (Non-Sertifikat)</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========================
// Main Presensi Page
// ========================
export default function PresensiPage() {
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const workshopParam = searchParams.get('workshop');

  const [activeTab, setActiveTab] = useState(
    urlTab && ['form', 'cek', 'jadwal'].includes(urlTab) ? urlTab : 'form'
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [workshops, setWorkshops] = useState([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  useEffect(() => {
    getAllWorkshops().then((data) => {
      const list = data || [];
      setWorkshops(list);
      if (workshopParam && list.length > 0) {
        const found = list.find((w) => String(w.id) === String(workshopParam));
        if (found) setSelectedWorkshop(found);
      }
    });
  }, [workshopParam]);

  useEffect(() => {
    if (urlTab && ['form', 'cek', 'jadwal'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleWorkshopSelect = (ws) => {
    setSelectedWorkshop(ws);
    setActiveTab('form');
    setTimeout(() => {
      document.getElementById('presensi-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleGoToCekCert = (name) => {
    setSearchQuery(name || '');
    setActiveTab('cek');
    setTimeout(() => {
      document.getElementById('presensi-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <PageTransition>
      <div className="min-h-screen py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <SectionReveal className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold mb-4 shadow-2xs">
              <Award size={13} className="text-purple-700" />
              PORTAL PRESENSI DIGITAL & VERIFIKASI BUKTI
            </span>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight mb-3">
              Presensi & <span className="gradient-text">E-Sertifikat</span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Silakan isi daftar hadir kegiatan untuk mengonfirmasi keikutsertaan Anda. Setelah Melakukan Presensi, e-sertifikat resmi dapat diperoleh secara otomatis.
            </p>
          </SectionReveal>

          {/* Tab Switcher Pills */}
          <div id="presensi-section" className="flex justify-center mb-8 px-2">
            <div className="bg-white/80 backdrop-blur-xl border border-purple-200/80 rounded-full p-1.5 flex gap-1 shadow-sm max-w-full overflow-x-auto no-scrollbar">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { playClick(); setActiveTab(id); }}
                  className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === id
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50'
                    }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Panes */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'form' && (
                <div className="glass-panel rounded-3xl p-4 sm:p-7 md:p-9 border border-purple-200/90 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-100">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/25 shrink-0">
                      <Award size={20} />
                    </div>
                    <div>
                      <h2 className="font-display font-extrabold text-xl text-slate-900 leading-tight">
                        Formulir Presensi Workshop
                      </h2>
                      <p className="text-xs text-purple-700 font-semibold">
                        Lengkapi 4 langkah data di bawah ini untuk menerbitkan sertifikat resmi Anda
                      </p>
                    </div>
                  </div>

                  <AttendanceForm
                    workshops={workshops}
                    selectedWorkshop={selectedWorkshop}
                    onGoToCek={handleGoToCekCert}
                  />
                </div>
              )}

              {activeTab === 'cek' && (
                <div className="glass-panel rounded-3xl p-4 sm:p-7 md:p-9 border border-purple-200/90 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-100">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/25 shrink-0">
                      <Search size={20} />
                    </div>
                    <div>
                      <h2 className="font-display font-extrabold text-xl text-slate-900 leading-tight">
                        Cari & Ambil E-Sertifikat
                      </h2>
                      <p className="text-xs text-purple-700 font-semibold">
                        Ketik nama atau NIM Anda untuk mengambil e-sertifikat resmi Anda
                      </p>
                    </div>
                  </div>

                  <CertSearch initialQuery={searchQuery} />
                </div>
              )}

              {activeTab === 'jadwal' && (
                <div>
                  <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workshops.length === 0 && (
                      <div className="col-span-3 text-center py-16 text-slate-400 bg-white/70 rounded-3xl border border-purple-100">
                        <Calendar size={42} className="mx-auto mb-3 text-slate-300" />
                        <p className="font-bold text-slate-700">Belum ada workshop yang tersedia saat ini.</p>
                      </div>
                    )}
                    {workshops.map(w => (
                      <StaggerItem key={w.id}>
                        <WorkshopCard workshop={w} onSelect={handleWorkshopSelect} />
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
