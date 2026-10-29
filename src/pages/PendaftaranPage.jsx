import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, User, Mail, Phone, Building, BookOpen, Calendar,
  Clock, MapPin, CheckCircle2, AlertCircle, Sparkles, Download, Copy,
  ArrowRight, Check, Share2, Award, Shield, ChevronRight, Hash,
  Search, RefreshCw
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  getAllWorkshops, submitRegistration, getRegistrations,
  findRegistrationByNimOrCode
} from '../store/dataStore';
import { downloadRegistrationCardJPEG } from '../utils/cardGenerator';
import PageTransition, { SectionReveal } from '../components/transitions/PageTransition';
import { playClick, playSuccess, playError } from '../utils/audio';
import { showAlert, showConfirm, showToast } from '../components/common/CoolAlert';

function formatIndoDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// ==========================================
// Digital Registration Ticket Modal Pass
// ==========================================
function RegistrationTicketModal({ ticket, onClose }) {
  const [copied, setCopied] = useState(false);
  const [downloadingJpeg, setDownloadingJpeg] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (!ticket) return;
    const qrData = `LAB-MPI|${ticket.reg_code || ''}|${ticket.nim_nip || ''}|${ticket.nama || ''}|${ticket.workshop_id || ''}`;
    QRCode.toDataURL(qrData, {
      width: 250,
      margin: 1,
      color: { dark: '#1e1b4b', light: '#ffffff' }
    })
      .then(url => setQrUrl(url))
      .catch(() => {
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${encodeURIComponent(qrData)}`);
      });
  }, [ticket]);

  if (!ticket) return null;

  const handleCopyCode = () => {
    try {
      navigator.clipboard?.writeText(ticket.reg_code);
      setCopied(true);
      playClick();
      setTimeout(() => setCopied(false), 2500);
      showToast(`Kode ${ticket.reg_code} disalin ke clipboard!`, 'success');
    } catch {}
  };

  const handleDownloadJPEG = async () => {
    if (downloadingJpeg) return;
    playClick();
    setDownloadingJpeg(true);

    try {
      await downloadRegistrationCardJPEG(ticket);
      playSuccess();
      showToast('Kartu registrasi (JPEG) berhasil diunduh!', 'success');
    } catch (err) {
      console.error('Gagal membuat kartu JPEG:', err);
      playError();
      showAlert({
        title: 'Gagal Mengunduh Kartu',
        message: err.message || 'Terjadi kendala saat menghasilkan gambar kartu registrasi. Silakan coba lagi.',
        type: 'error',
      });
    } finally {
      setDownloadingJpeg(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-lg w-full bg-white rounded-3xl shadow-2xl border-2 border-purple-300 overflow-hidden z-10 my-auto"
        >
          {/* Card Node View */}
          <div className="w-full bg-white overflow-hidden">
            {/* Header Ticket Pattern */}
            <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 p-6 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <Sparkles size={11} className="text-amber-300" />
                  Bukti Pendaftaran Resmi Digital
                </div>
                <h3 className="font-display font-extrabold text-xl text-white">E-Ticket Workshop Lab MPI</h3>
                <p className="text-xs text-purple-200/90 mt-0.5">Fakultas Tarbiyah dan Keguruan UIN Alauddin Makassar</p>

                {/* Big Registration Code Box */}
                <div className="mt-4 p-2.5 sm:p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-between gap-2 max-w-full">
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-[10px] text-purple-200 uppercase font-semibold">Nomor Registrasi:</p>
                    <p className="text-sm sm:text-lg font-mono font-extrabold text-amber-300 tracking-wider truncate">
                      {ticket.reg_code}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-html2canvas-ignore="true"
                    onClick={handleCopyCode}
                    className="px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                    title="Salin Kode Registrasi"
                  >
                    {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Ticket Body with Cutout Circles */}
            <div className="relative p-4 sm:p-6 space-y-4 bg-white overflow-hidden">
              {/* Left and right notch cutouts */}
              <div
                data-html2canvas-ignore="true"
                className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-slate-950/85"
              />
              <div
                data-html2canvas-ignore="true"
                className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-slate-950/85"
              />

              {/* QR Code & Identity Grid */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 p-4 rounded-2xl bg-purple-50/60 border border-purple-100 overflow-hidden">
                <div className="w-28 h-28 sm:w-32 sm:h-32 p-2 bg-white rounded-xl shadow-xs border border-purple-200 shrink-0 flex items-center justify-center">
                  <img
                    src={qrUrl}
                    crossOrigin="anonymous"
                    alt={`QR Code ${ticket.reg_code}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="min-w-0 space-y-1.5 text-center sm:text-left flex-1 w-full overflow-hidden">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Nama Peserta:</span>
                    <p className="font-bold text-slate-900 text-sm leading-snug break-words">{ticket?.nama || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">NIM / NIP:</span>
                    <p className="font-mono text-xs font-bold text-purple-700 break-all">{ticket?.nim_nip || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Instansi:</span>
                    <p className="text-xs text-slate-600 break-words">{ticket?.instansi || 'UIN Alauddin Makassar'}</p>
                  </div>
                </div>
              </div>

              {/* Workshop Session Details */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs overflow-hidden">
                <p className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">Detail Sesi Kegiatan:</p>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug break-words">{ticket?.workshop_title || 'Workshop Pelatihan'}</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    <User size={13} className="text-purple-600 shrink-0" />
                    <span className="truncate">{ticket?.speaker || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    <Calendar size={13} className="text-purple-600 shrink-0" />
                    <span className="truncate">{formatIndoDate(ticket?.workshop_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    <Clock size={13} className="text-purple-600 shrink-0" />
                    <span className="truncate">{ticket?.workshop_time || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    <MapPin size={13} className="text-rose-500 shrink-0" />
                    <span className="truncate">{ticket?.workshop_location || 'Lab Microleading MPI'}</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2 overflow-hidden">
                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed break-words">
                  <strong>Petunjuk Hari H:</strong> Tunjukkan kartu registrasi ini kepada panitia atau masukkan <strong>NIM {ticket.nim_nip}</strong> di halaman presensi digital untuk klaim E-Sertifikat otomatis.
                </p>
              </div>

              {/* Card Footer Stamp / Verification */}
              <div className="pt-2 border-t border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[10px] text-slate-400">
                <span className="font-semibold text-purple-800 break-words max-w-full">Lab Microleading MPI FTK UIN Alauddin</span>
                <span className="text-emerald-700 font-medium shrink-0">✓ Terverifikasi Digital</span>
              </div>
            </div>
          </div>

          {/* Ticket Footer Action Buttons (Excluded from captured JPEG) */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-purple-100 flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleDownloadJPEG}
              disabled={downloadingJpeg}
              className="btn-shimmer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 shadow-md shadow-purple-600/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Unduh Kartu Registrasi Berformat Gambar JPEG"
            >
              {downloadingJpeg ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Menyiapkan JPEG...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Unduh Kartu (JPEG)</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <Link
                to={`/presensi?workshop=${ticket.workshop_id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all no-underline cursor-pointer"
              >
                <span>Ke Presensi</span>
                <ArrowRight size={13} />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

// ==========================================
// Main PendaftaranPage Component
// ==========================================
export default function PendaftaranPage() {
  const [searchParams] = useSearchParams();
  const urlWorkshopId = searchParams.get('workshop');

  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') === 'cek' ? 'cek' : 'daftar');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundTicket, setFoundTicket] = useState(null);

  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState(null);

  const [form, setForm] = useState({
    workshop_id: '',
    nama: '',
    nim_nip: '',
    instansi: 'UIN Alauddin Makassar',
    email: '',
    whatsapp: '',
    alasan: ''
  });

  // Load active workshops
  useEffect(() => {
    async function init() {
      try {
        const list = await getAllWorkshops();
        const activeList = (list || []).filter(w => w.status === 'open');
        setWorkshops(activeList);

        if (urlWorkshopId) {
          const match = activeList.find(w => String(w.id) === String(urlWorkshopId));
          if (match) {
            setForm(f => ({ ...f, workshop_id: String(match.id) }));
          } else if (activeList.length > 0) {
            setForm(f => ({ ...f, workshop_id: String(activeList[0].id) }));
          }
        } else if (activeList.length > 0) {
          setForm(f => ({ ...f, workshop_id: String(activeList[0].id) }));
        }
      } catch (err) {
        console.error('Error loading workshops for registration:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [urlWorkshopId]);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const selectedWorkshopData = workshops.find(w => String(w.id) === String(form.workshop_id));

  // Search existing ticket by NIM or Code
  const handleSearchTicket = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      showToast('Ketikkan NIM atau Kode Registrasi terlebih dahulu', 'warning');
      return;
    }
    setSearching(true);
    setFoundTicket(null);
    playClick();
    try {
      const found = await findRegistrationByNimOrCode(searchQuery);
      if (found) {
        playSuccess();
        setFoundTicket(found);
        setSuccessTicket(found); // Directly pop up the official confirmation modal!
        showToast('Data pendaftaran ditemukan!', 'success');
      } else {
        playError();
        showAlert({
          title: 'Data Tidak Ditemukan',
          message: `Tidak ditemukan pendaftaran dengan NIM atau Kode "${searchQuery}". Pastikan nomor identitas Anda sudah benar.`,
          type: 'warning'
        });
      }
    } catch (err) {
      playError();
      showAlert({ title: 'Gagal Mencari', message: err.message, type: 'error' });
    } finally {
      setSearching(false);
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    playClick();

    if (!form.workshop_id) {
      showAlert({
        title: 'Pilih Workshop',
        message: 'Silakan pilih kegiatan workshop yang ingin Anda ikuti.',
        type: 'warning'
      });
      return;
    }

    if (!form.nama.trim() || !form.nim_nip.trim() || !form.whatsapp.trim()) {
      showAlert({
        title: 'Lengkapi Data',
        message: 'Nama lengkap, NIM/NIP, dan nomor WhatsApp wajib diisi.',
        type: 'warning'
      });
      return;
    }

    // Interactive confirmation dialog before submit
    const confirmed = await showConfirm({
      title: 'Konfirmasi Data Pendaftaran',
      message: `Pastikan data berikut sudah benar sebelum dikirimkan:\n\n• Nama: ${form.nama}\n• NIM / NIP: ${form.nim_nip}\n• Workshop: ${selectedWorkshopData?.title || 'Workshop Terpilih'}\n• No. WhatsApp: ${form.whatsapp}\n• Instansi: ${form.instansi}\n\nLanjutkan pendaftaran dan terbitkan E-Ticket resmi?`,
      confirmText: 'Ya, Konfirmasi Pendaftaran',
      cancelText: 'Periksa Kembali',
      type: 'primary'
    });

    if (!confirmed) return;

    setSubmitting(true);
    try {
      const result = await submitRegistration(form);
      playSuccess();

      // Trigger Confetti Celebration!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

      setSuccessTicket(result);
      showToast('Pendaftaran berhasil dikonfirmasi! E-Ticket telah terbit.', 'success');
    } catch (err) {
      if (err.alreadyRegistered) {
        playClick();
        showAlert({
          title: 'Sudah Terdaftar',
          message: `NIM "${form.nim_nip}" sudah terdaftar pada kegiatan "${err.alreadyRegistered.workshop_title}". Menampilkan E-Ticket dan laporan resmi Anda:`,
          type: 'info'
        });
        setSuccessTicket(err.alreadyRegistered);
      } else {
        playError();
        showAlert({
          title: 'Pendaftaran Gagal',
          message: err.message || 'Terjadi kesalahan saat memproses pendaftaran Anda.',
          type: 'error'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition motionStyle="smooth">
      <div className="min-h-screen py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <SectionReveal className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold mb-4 shadow-2xs">
              <ClipboardCheck size={13} className="text-purple-700" />
              PORTAL REGISTRASI DIGITAL WORKSHOP & PELATIHAN
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-slate-900 tracking-tight mb-3">
              Pendaftaran <span className="gradient-text">Kegiatan Ilmiah</span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Daftarkan diri Anda untuk mengikuti workshop penulisan ilmiah, praktikum kepemimpinan, dan pelatihan teknologi di Laboratorium Microleading MPI FTK UIN Alauddin Makassar.
            </p>
          </SectionReveal>

          {/* Tab Navigation: Formulir Pendaftaran vs Cek E-Ticket */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              type="button"
              onClick={() => { playClick(); setActiveTab('daftar'); }}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'daftar'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                  : 'bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-900 border border-purple-200'
              }`}
            >
              <ClipboardCheck size={16} />
              <span>Formulir Pendaftaran Baru</span>
            </button>
            <button
              type="button"
              onClick={() => { playClick(); setActiveTab('cek'); }}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'cek'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                  : 'bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-900 border border-purple-200'
              }`}
            >
              <Search size={16} />
              <span>Cek E-Ticket / Kartu Registrasi</span>
            </button>
          </div>

          {activeTab === 'cek' ? (
            <div className="max-w-xl mx-auto">
              <div className="bento-card glow-border rounded-3xl p-6 sm:p-8 border border-purple-200/90 shadow-xl bg-white space-y-5">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Search size={22} />
                  </div>
                  <h3 className="font-display font-extrabold text-slate-900 text-xl">Cek Kartu Registrasi & E-Ticket</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Masukkan NIM, NIP, atau Kode Registrasi Anda yang telah didaftarkan untuk membuka dan mengunduh Kartu Registrasi (JPEG).
                  </p>
                </div>

                <form onSubmit={handleSearchTicket} className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Ketikkan NIM / NIP atau Kode (misal: 20400122001)"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-purple-200 focus:border-purple-600 text-sm font-semibold text-slate-900 bg-purple-50/20 focus:bg-white focus:outline-none transition-all"
                    />
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                  </div>

                  <button
                    type="submit"
                    disabled={searching}
                    className="btn-shimmer w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 disabled:opacity-50"
                  >
                    {searching ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Mencari Data Registrasi...</span>
                      </>
                    ) : (
                      <>
                        <Search size={16} />
                        <span>Cari & Buka Bukti Pendaftaran</span>
                      </>
                    )}
                  </button>
                </form>

                {foundTicket && (
                  <div className="mt-5 p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                        ✓ Data Ditemukan
                      </span>
                      <span className="font-mono text-xs font-extrabold text-purple-700">
                        {foundTicket.reg_code}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{foundTicket.nama}</h4>
                      <p className="text-xs text-slate-600 font-mono mt-0.5">NIM: {foundTicket.nim_nip} • {foundTicket.instansi}</p>
                      <p className="text-xs text-purple-800 font-semibold mt-1">Workshop: {foundTicket.workshop_title}</p>
                    </div>

                    <div className="pt-2 border-t border-purple-200/70">
                      <button
                        type="button"
                        onClick={() => { playClick(); setSuccessTicket(foundTicket); }}
                        className="btn-shimmer w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center gap-2 shadow-md cursor-pointer hover:opacity-95"
                      >
                        <Award size={14} />
                        <span>Buka Kartu & Unduh JPEG</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>

          {loading ? (
            <div className="bento-card rounded-3xl p-8 text-center animate-pulse">
              <div className="h-6 w-48 bg-purple-200 rounded mx-auto mb-4" />
              <div className="h-4 w-72 bg-purple-100 rounded mx-auto" />
            </div>
          ) : workshops.length === 0 ? (
            <div className="bento-card rounded-3xl p-10 text-center border border-purple-200">
              <Calendar size={48} className="mx-auto text-purple-300 mb-3" />
              <h3 className="font-bold text-slate-800 text-lg mb-1">Belum Ada Pendaftaran yang Dibuka</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                Saat ini belum ada jadwal workshop yang membuka pendaftaran peserta. Silakan cek berkala atau lihat warta berita terkini.
              </p>
              <NavLink
                to="/berita"
                className="btn-shimmer inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/25 no-underline"
              >
                <span>Lihat Berita Kegiatan</span>
                <ChevronRight size={14} />
              </NavLink>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form Card (7 Cols) */}
              <div className="lg:col-span-7">
                <form
                  onSubmit={handleSubmit}
                  className="bento-card glow-border rounded-3xl p-6 sm:p-8 border border-purple-200/90 shadow-xl bg-white space-y-5"
                >
                  <div className="border-b border-purple-100 pb-3">
                    <h3 className="font-display font-extrabold text-slate-900 text-lg">Formulir Pendaftaran Peserta</h3>
                    <p className="text-xs text-slate-500">Lengkapi data diri Anda di bawah ini dengan benar untuk validasi E-Ticket.</p>
                  </div>

                  {/* 1. Pilih Workshop */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <BookOpen size={13} className="text-purple-600" />
                      Pilihan Workshop / Pelatihan *
                    </label>
                    <div className="relative">
                      <select
                        value={form.workshop_id}
                        onChange={e => setField('workshop_id', e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-2xl border-2 border-purple-200 bg-white text-sm text-slate-900 font-semibold focus:border-purple-600 focus:outline-none appearance-none cursor-pointer pr-10"
                      >
                        {workshops.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.title} ({w.date})
                          </option>
                        ))}
                      </select>
                      <ChevronRight size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-600 rotate-90 pointer-events-none" />
                    </div>
                  </div>

                  {/* 2. Nama Lengkap */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <User size={13} className="text-purple-600" />
                      Nama Lengkap (dan Gelar jika ada) *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.nama}
                      onChange={e => setField('nama', e.target.value)}
                      placeholder="Contoh: Muhammad Farhan Al-Hafidz, S.Pd."
                      className="w-full px-4 py-3 rounded-2xl border-2 border-purple-100 bg-purple-50/20 text-sm text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  {/* 3. NIM / NIP */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                        <Hash size={13} className="text-purple-600" />
                        NIM / NIP / NIK *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.nim_nip}
                        onChange={e => setField('nim_nip', e.target.value)}
                        placeholder="Contoh: 20400121045"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-purple-100 bg-purple-50/20 text-sm text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                        <Building size={13} className="text-purple-600" />
                        Asal Instansi / Universitas *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.instansi}
                        onChange={e => setField('instansi', e.target.value)}
                        placeholder="Contoh: UIN Alauddin Makassar"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-purple-100 bg-purple-50/20 text-sm text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* 4. Kontak: WhatsApp & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                        <Phone size={13} className="text-purple-600" />
                        No. WhatsApp Aktif *
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.whatsapp}
                        onChange={e => setField('whatsapp', e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-purple-100 bg-purple-50/20 text-sm text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                        <Mail size={13} className="text-purple-600" />
                        Alamat Email Aktif
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setField('email', e.target.value)}
                        placeholder="nama@email.com"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-purple-100 bg-purple-50/20 text-sm text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* 5. Alasan / Harapan */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Alasan / Motivasi Mengikuti Pelatihan
                    </label>
                    <textarea
                      value={form.alasan}
                      onChange={e => setField('alasan', e.target.value)}
                      rows="2"
                      placeholder="Tuliskan harapan atau pokok materi yang ingin Anda pelajari..."
                      className="w-full px-4 py-3 rounded-2xl border-2 border-purple-100 bg-purple-50/20 text-sm text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-shimmer w-full py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <ClipboardCheck size={16} />
                      <span>{submitting ? 'Memproses Pendaftaran...' : 'Konfirmasi & Dapatkan E-Ticket'}</span>
                    </button>
                    <p className="text-[11px] text-slate-400 text-center mt-2.5">
                      🔒 Data pendaftaran Anda aman dan digunakan semata-mata untuk verifikasi sertifikat resmi Lab MPI FTK UINAM.
                    </p>
                  </div>
                </form>
              </div>

              {/* Right Column: Workshop Detail Card Preview (5 Cols) */}
              <div className="lg:col-span-5 space-y-5">
                {selectedWorkshopData ? (
                  <div className="bento-card rounded-3xl p-6 sm:p-7 border border-purple-200/80 shadow-lg bg-gradient-to-br from-white via-purple-50/40 to-white">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-4">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Pendaftaran Dibuka
                    </div>

                    <h3 className="font-display font-extrabold text-slate-900 text-lg leading-snug mb-3">
                      {selectedWorkshopData?.title || 'Workshop'}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed mb-5">
                      {selectedWorkshopData?.description || ''}
                    </p>

                    <div className="p-4 rounded-2xl bg-white border border-purple-100/90 space-y-2.5 text-xs text-slate-600 mb-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <User size={13} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Narasumber / Instruktur</p>
                          <p className="font-bold text-slate-800">{selectedWorkshopData?.speaker || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <Calendar size={13} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Hari & Tanggal</p>
                          <p className="font-bold text-slate-800">{formatIndoDate(selectedWorkshopData?.date)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <Clock size={13} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Waktu Pelaksanaan</p>
                          <p className="font-bold text-slate-800">{selectedWorkshopData?.time || '-'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                          <MapPin size={13} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Lokasi Ruangan</p>
                          <p className="font-bold text-slate-800">{selectedWorkshopData?.location || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-purple-100/60 border border-purple-200/70 text-xs text-purple-900 flex items-center gap-2.5">
                      <Award size={18} className="text-purple-700 shrink-0" />
                      <span>Peserta yang hadir berhak menerima <strong>E-Sertifikat Terverifikasi</strong> resmi Lab Microleading.</span>
                    </div>
                  </div>
                ) : (
                  <div className="bento-card rounded-3xl p-6 text-center text-slate-400">
                    Pilih workshop di formulir untuk melihat informasi sesi kegiatan.
                  </div>
                )}
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </div>

      {/* Ticket Modal Pass */}
      {successTicket && (
        <RegistrationTicketModal
          ticket={successTicket}
          onClose={() => setSuccessTicket(null)}
        />
      )}
    </PageTransition>
  );
}

