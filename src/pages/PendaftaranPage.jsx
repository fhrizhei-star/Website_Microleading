import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, User, Mail, Phone, Building, BookOpen, Calendar,
  Clock, MapPin, CheckCircle2, Sparkles,
  ChevronRight, Hash, Search, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getAllWorkshops, submitRegistration,
  findRegistrationByNimOrCode
} from '../store/dataStore';
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
// Digital Registration Success Modal
// Sederhana, Ramah, & Otomatis Menutup dalam 10 Detik (Tanpa Tombol)
// ==========================================
function RegistrationConfirmationModal({ ticket, onClose }) {
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (!ticket) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [ticket, onClose]);

  if (!ticket) return null;

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / 10) * 100));

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        {/* Backdrop (klik luar untuk menutup langsung) */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-lg w-full bg-white rounded-3xl shadow-2xl border-2 border-purple-200 overflow-hidden z-10 my-auto"
        >
          {/* Header Banner - Ucapan & Status */}
          <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
                <CheckCircle2 size={14} className="text-emerald-300" />
                Pendaftaran Berhasil Diterima
              </div>
              <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                Terima Kasih Telah Mendaftar!
              </h3>
              <p className="text-xs text-purple-200/90 mt-1">
                Kami Tunggu Kehadiran Anda  di Kegiatan Laboratorium Microleading MPI FTK UIN Alauddin Makassar
              </p>

              {/* Registration Code Badge */}
              <div className="mt-4 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center">
                <p className="text-[10px] text-purple-200 uppercase font-semibold">Nomor Registrasi Resmi:</p>
                <p className="text-base sm:text-xl font-mono font-extrabold text-amber-300 tracking-wider">
                  {ticket.reg_code}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Body: Ringkasan Sederhana */}
          <div className="p-5 sm:p-6 space-y-4 bg-white">
            {/* Petunjuk Hari-H: Tidak Perlu Tiket Fisik */}
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-800 uppercase tracking-wide">
                <Sparkles size={14} className="text-amber-600" />
                <span>Petunjuk Kehadiran Hari-H</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-900">
                Saat hari pelaksanaan kegiatan, Anda <strong>cukup memasukkan NIM / NIP ({ticket.nim_nip})</strong> di halaman <strong>Presensi</strong> web ini. Anda tidak perlu mencetak tiket atau membawa berkas fisik apapun.
              </p>
            </div>

            {/* Rincian Peserta & Kegiatan */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Nama Peserta:</span>
                <span className="font-extrabold text-slate-900 text-sm text-right">{ticket.nama}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">NIM / Identitas:</span>
                <span className="font-mono font-bold text-slate-800">{ticket.nim_nip}</span>
              </div>
              <div className="space-y-1 pb-2 border-b border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Kegiatan / Workshop:</span>
                <p className="font-bold text-purple-900 text-xs sm:text-sm leading-snug">
                  {ticket.workshop_title || 'Workshop Lab Microleading'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-purple-600 shrink-0" />
                  <span className="truncate">{formatIndoDate(ticket.workshop_date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-purple-600 shrink-0" />
                  <span className="truncate">{ticket.workshop_time || '-'}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:col-span-2">
                  <MapPin size={13} className="text-rose-500 shrink-0" />
                  <span className="truncate">{ticket.workshop_location || 'Lab Microleading MPI FTK UINAM'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer: Countdown Otomatis 30 Detik (Tanpa Tombol Apapun) */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-purple-100 space-y-2.5 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
              <Clock size={14} className="text-purple-600 animate-pulse" />
              <span>Jendela ini akan menutup otomatis dalam <strong className="text-purple-700 font-mono font-bold text-sm">{timeLeft}</strong> detik</span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              (Klik di luar jendela untuk langsung menutup)
            </p>
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

  // Search existing registration by NIM, NIP, or Code
  const handleSearchTicket = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      showToast('Ketikkan NIM, NIP, atau Kode Registrasi terlebih dahulu', 'warning');
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
        setSuccessTicket(found); // Directly open confirmation modal
        showToast('Data pendaftaran ditemukan!', 'success');
      } else {
        playError();
        showAlert({
          title: 'Data Tidak Ditemukan',
          message: `Tidak ditemukan pendaftaran dengan identitas "${searchQuery}". Pastikan NIM atau NIP Anda sudah benar.`,
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
      message: `Pastikan data berikut sudah benar:\n\n• Nama: ${form.nama}\n• NIM / NIP: ${form.nim_nip}\n• Workshop: ${selectedWorkshopData?.title || 'Workshop Terpilih'}\n• No. WhatsApp: ${form.whatsapp}\n• Instansi: ${form.instansi}\n\nLanjutkan konfirmasi pendaftaran?`,
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
      } catch { }

      setSuccessTicket(result);
      showToast('Pendaftaran berhasil dikonfirmasi!', 'success');
    } catch (err) {
      if (err.alreadyRegistered) {
        playClick();
        showAlert({
          title: 'Sudah Terdaftar',
          message: `NIM/NIP "${form.nim_nip}" sudah terdaftar pada kegiatan "${err.alreadyRegistered.workshop_title}". Menampilkan data pendaftaran Anda:`,
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

          {/* Tab Navigation: Formulir Pendaftaran vs Cek Status */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              type="button"
              onClick={() => { playClick(); setActiveTab('daftar'); }}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'daftar'
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
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'cek'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                : 'bg-white text-slate-600 hover:bg-purple-50 hover:text-purple-900 border border-purple-200'
                }`}
            >
              <Search size={16} />
              <span>Cek Status Pendaftaran</span>
            </button>
          </div>

          {activeTab === 'cek' ? (
            <div className="max-w-xl mx-auto">
              <div className="bento-card glow-border rounded-3xl p-6 sm:p-8 border border-purple-200/90 shadow-xl bg-white space-y-5">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Search size={22} />
                  </div>
                  <h3 className="font-display font-extrabold text-slate-900 text-xl">Cek Status Pendaftaran</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Masukkan NIM, NIP, atau Kode Registrasi Anda untuk melihat rincian kegiatan, jadwal, dan panduan presensi.
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
                        <span>Cari Status Pendaftaran</span>
                      </>
                    )}
                  </button>
                </form>

                {foundTicket && (
                  <div className="mt-5 p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                        ✓ Terdaftar Resmi
                      </span>
                      <span className="font-mono text-xs font-extrabold text-purple-700">
                        {foundTicket.reg_code}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{foundTicket.nama}</h4>
                      <p className="text-xs text-slate-600 font-mono mt-0.5">NIM / NIP: {foundTicket.nim_nip} • {foundTicket.instansi}</p>
                      <p className="text-xs text-purple-800 font-semibold mt-1">Workshop: {foundTicket.workshop_title}</p>
                    </div>

                    <div className="pt-2 border-t border-purple-200/70">
                      <button
                        type="button"
                        onClick={() => { playClick(); setSuccessTicket(foundTicket); }}
                        className="btn-shimmer w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center gap-2 shadow-md cursor-pointer hover:opacity-95"
                      >
                        <CheckCircle2 size={14} />
                        <span>Buka Rincian & Jadwal Lengkap</span>
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
                        <p className="text-xs text-slate-500">Isi data diri Anda di bawah ini. Anda tidak perlu mencetak tiket untuk hari kegiatan.</p>
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
                                {w.has_certificate !== false ? '🏅 ' : '📋 '}
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
                          <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Mail size={13} className="text-purple-600" />
                              Alamat Email (Opsional)
                            </span>
                          </label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={e => setField('email', e.target.value)}
                            placeholder="nama@email.com (opsional)"
                            className="w-full px-4 py-3 rounded-2xl border-2 border-purple-100 bg-purple-50/20 text-sm text-slate-900 focus:border-purple-600 focus:bg-white focus:outline-none transition-all"
                          />
                          <p className="text-[10px] text-slate-400">
                            Data kontak tambahan untuk arsip panitia laboratorium.
                          </p>
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
                          <span>{submitting ? 'Memproses Pendaftaran...' : 'Konfirmasi Pendaftaran'}</span>
                        </button>
                        <p className="text-[11px] text-slate-400 text-center mt-2.5">
                          🔒 Data pendaftaran Anda aman dan otomatis terdaftar di sistem presensi digital Lab MPI FTK UINAM.
                        </p>
                      </div>
                    </form>
                  </div>

                  {/* Right Column: Workshop Detail Card Preview (5 Cols) */}
                  <div className="lg:col-span-5 space-y-5">
                    {selectedWorkshopData ? (
                      <div className="bento-card rounded-3xl p-6 sm:p-7 border border-purple-200/80 shadow-lg bg-gradient-to-br from-white via-purple-50/40 to-white">
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Pendaftaran Dibuka
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${selectedWorkshopData?.has_certificate !== false ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                            {selectedWorkshopData?.has_certificate !== false ? '🏅 Workshop Bersertifikat' : '📋 Presensi Rutin Lab'}
                          </span>
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

                        {selectedWorkshopData?.has_certificate !== false ? (
                          <div className="p-3.5 rounded-2xl bg-purple-100/60 border border-purple-200/70 text-xs text-purple-900 flex items-center gap-2.5">
                            <CheckCircle2 size={18} className="text-purple-700 shrink-0" />
                            <span>Peserta yang hadir berhak menerima <strong>E-Sertifikat Terverifikasi</strong> resmi Lab Microleading.</span>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2.5">
                            <ClipboardCheck size={18} className="text-blue-700 shrink-0" />
                            <span>Kegiatan Rutin Lab: Kehadiran peserta akan <strong>tercatat resmi dalam rekap presensi</strong> laboratorium (tanpa sertifikat).</span>
                          </div>
                        )}
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

      {/* Confirmation Modal Pass */}
      {successTicket && (
        <RegistrationConfirmationModal
          ticket={successTicket}
          onClose={() => setSuccessTicket(null)}
        />
      )}
    </PageTransition>
  );
}
