import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCountUp } from '../ambient/AmbientEffects';
import { SectionReveal, StaggerContainer, StaggerItem } from '../transitions/PageTransition';
import {
  Award, Calendar, Users, Star, ChevronRight, FileText,
  Search, BookOpen, Zap, Shield, Clock, MapPin, X, Share2, Check,
  ClipboardCheck
} from 'lucide-react';
import { playClick } from '../../utils/audio';

// ========================
// Stats Section
// ========================
function StatCard({ value, label, sublabel, decimals = 0, suffix = '' }) {
  const ref = useCountUp(value, 1600, decimals);
  return (
    <div className="bento-card rounded-3xl p-6 text-center">
      <p className="font-display font-extrabold text-4xl sm:text-5xl bg-gradient-to-br from-purple-600 to-violet-600 bg-clip-text text-transparent mb-1">
        <span ref={ref}>0</span>{suffix}
      </p>
      <p className="font-bold text-slate-900 text-sm">{label}</p>
      {sublabel && <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>}
    </div>
  );
}

// ========================
// Hero Section
// ========================
export function HeroSection({ workshops = [] }) {
  const [activeWorkshop, setActiveWorkshop] = useState(
    workshops.find((w) => w.status === 'open') || workshops[0] || null
  );

  useEffect(() => {
    if (workshops.length > 0) {
      setActiveWorkshop(workshops.find((w) => w.status === 'open') || workshops[0]);
    }
  }, [workshops]);

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Hero Text */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/80 border border-purple-200 text-purple-900 text-xs font-bold mb-6">
              <Shield size={12} className="text-purple-600" />
              WEBSITE MICROLEADING
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl xl:text-6xl text-slate-900 leading-tight mb-4">
              Inovasi Digital &{' '}
              <span className="gradient-text">Kompetensi Unggul</span>{' '}
              Laboratorium MPI
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
              Platform terpadu Fakultas Tarbiyah dan Keguruan UIN Alauddin Makassar untuk presensi kegiatan ilmiah,
              praktikum microleading modern, dan klaim <strong>E-Sertifikat Resmi</strong> secara otomatis.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                to="/pendaftaran"
                onClick={playClick}
                className="btn-shimmer inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-lg shadow-purple-600/30 no-underline hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <ClipboardCheck size={15} />
                Daftar Workshop
              </Link>
              <Link
                to="/presensi"
                onClick={playClick}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 shadow-sm hover:scale-105 active:scale-95 transition-all no-underline cursor-pointer"
              >
                <Award size={15} />
                Isi Presensi & Klaim
              </Link>
              <Link
                to="/presensi?tab=cek"
                onClick={playClick}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold text-slate-700 bg-white border border-slate-200 shadow-sm hover:border-purple-300 hover:text-purple-700 hover:scale-105 active:scale-95 transition-all no-underline cursor-pointer"
              >
                <Search size={15} />
                Cari E-Sertifikat
              </Link>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              {[
                { icon: Shield, label: '100% Asli', sub: 'Terverifikasi Lab' },
                { icon: FileText, label: 'Standar Sertifikat', sub: 'Siap Cetak PDF' },
                { icon: Zap, label: 'Otomatis', sub: 'Sekali Klik Terbit' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Icon size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-none">{label}</p>
                    <p className="text-[10px] text-slate-500 leading-none mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Floating Workshop Card */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 32, y: 16 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Floating badge top-right */}
            <div className="absolute -top-4 -right-4 px-3 py-2 rounded-2xl bg-white shadow-xl border border-purple-200 flex items-center gap-2 z-20 animate-float-slow">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-xs">
                <Star size={12} fill="currentColor" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-900 leading-none">Laboratorium Pengembangan</p>
                <p className="text-[9px] text-purple-600 font-semibold leading-none mt-0.5">UIN Alauddin Makassar</p>
              </div>
            </div>

            {/* Floating badge bottom-left */}
            <div className="absolute -bottom-4 -left-4 px-3 py-2 rounded-2xl bg-white shadow-xl border border-purple-200 flex items-center gap-2 z-20 animate-float-reverse">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-violet-600 text-white flex items-center justify-center text-xs">
                <Award size={12} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-900 leading-none">E-Sertifikat Instan</p>
                <p className="text-[9px] text-purple-600 font-semibold leading-none mt-0.5">Otomatis Terbit</p>
              </div>
            </div>

            {/* Main Hero Card */}
            <div className="bento-card glow-border rounded-3xl p-6 sm:p-7 border border-purple-200/80 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-48 h-48 bg-purple-300/40 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${activeWorkshop?.status === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Workshop & Pelatihan</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  activeWorkshop?.status === 'open'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {activeWorkshop?.status === 'open' ? 'Presensi Aktif' : 'Pendaftaran Ditutup'}
                </span>
              </div>

              {activeWorkshop ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white shadow-lg mb-5 relative overflow-hidden border border-purple-900/50">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[11px] font-bold text-purple-400 tracking-wider uppercase">
                      Workshop & Pelatihan Lab
                    </span>
                    <span className="text-xs font-mono text-purple-300">
                      {activeWorkshop.date ? new Date(activeWorkshop.date.includes('T') ? activeWorkshop.date : `${activeWorkshop.date}T00:00:00`).getFullYear() || '2026' : '2026'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-display text-white mb-2 leading-snug">
                    {activeWorkshop.title}
                  </h3>
                  <p className="text-xs text-purple-200/80 mb-3.5 leading-relaxed line-clamp-2">
                    {activeWorkshop.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-purple-200/90 border-t border-purple-800/50 pt-3 mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-purple-400 shrink-0" />
                        <span className="truncate max-w-[180px] font-medium">{activeWorkshop.speaker}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white shrink-0">
                        E-Sertifikat
                      </span>
                    </div>
                    {activeWorkshop.date && (
                      <div className="flex items-center gap-1.5 text-[11px] text-purple-300/90">
                        <Calendar size={11} className="text-purple-400 shrink-0" />
                        <span>{activeWorkshop.date} {activeWorkshop.time ? `• ${activeWorkshop.time}` : ''}</span>
                      </div>
                    )}
                    {activeWorkshop.location && (
                      <div className="flex items-center gap-1.5 text-[11px] text-purple-300/90">
                        <MapPin size={11} className="text-rose-400 shrink-0" />
                        <span className="truncate">{activeWorkshop.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-800 text-slate-400 text-center text-sm mb-5">
                  Belum ada workshop aktif
                </div>
              )}

              {activeWorkshop?.status === 'open' ? (
                <div className="flex gap-2">
                  <Link
                    to={`/pendaftaran?workshop=${activeWorkshop.id}`}
                    onClick={playClick}
                    className="btn-shimmer flex-1 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 no-underline hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <ClipboardCheck size={15} />
                    Daftar Workshop
                  </Link>
                  <Link
                    to={`/presensi?workshop=${activeWorkshop.id}`}
                    onClick={playClick}
                    className="py-3 px-4 rounded-2xl font-bold text-sm text-purple-300 bg-purple-900/60 hover:bg-purple-900/90 border border-purple-700/60 flex items-center justify-center gap-2 no-underline transition-all cursor-pointer"
                  >
                    <Award size={15} />
                    Presensi
                  </Link>
                </div>
              ) : (
                <Link
                  to="/presensi?tab=jadwal"
                  onClick={playClick}
                  className="btn-shimmer w-full py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 no-underline hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <FileText size={15} />
                  Lihat Jadwal Workshop
                </Link>
              )}
            </div>

            {/* Live Validation Tag */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-bold border border-purple-700/50 shadow-lg">
              Live Validation 2026
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ========================
// Marquee / Trust Bar
// ========================
export function TrustMarquee() {
  const items = [
    '🏛 Akreditasi Unggul', '⚡ Presensi Workshop Online Terpadu',
    '🎓 FTK UIN Alauddin Makassar', '🏆 E-Sertifikat Digital Otomatis',
    '📋 Praktikum Microleading & Inovasi', '✅ Terverifikasi Resmi Kampus',
    '📚 Laboratorium Akademik Modern',
  ];
  const doubled = [...items, ...items];

  return (
    <section className="py-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 overflow-hidden">
      <div className="marquee-container py-2">
        <div className="marquee-track">
          {doubled.map((item, i) => (
            <span key={i} className="text-sm font-semibold text-purple-200 whitespace-nowrap flex items-center gap-2">
              {item}
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mx-2" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ========================
// Stats Section
// ========================
export function StatsSection({ workshopCount = 0, participantCount = 0 }) {
  const displayWs = workshopCount > 0 ? workshopCount : 30;
  const displayPart = participantCount > 0 ? participantCount : 500;

  return (
    <SectionReveal>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard value={displayPart} label="Peserta Terdata" sublabel="Mahasiswa & Dosen" suffix="+" />
            <StatCard value={100} label="E-Sertifikat Digital" sublabel="Otomatis & Terverifikasi" suffix="%" />
            <StatCard value={displayWs} label="Workshop & Pelatihan" sublabel="Diselenggarakan Lab" suffix={workshopCount > 0 ? "" : "+"} />
            <StatCard value={4.9} label="Indeks Kepuasan" sublabel="Evaluasi Praktikum" decimals={1} suffix="/5" />
          </div>
        </div>
      </section>
    </SectionReveal>
  );
}

// ========================
// Keunggulan / Features Section
// ========================
export function KeunggulanSection() {
  const items = [
    {
      icon: Award,
      color: 'from-purple-500 to-violet-600',
      title: 'E-Sertifikat',
      desc: 'Sertifikat digital yang terverifikasi Oleh Pengelola Pelatihan Maupun Workshop.'
    },
    {
      icon: Zap,
      color: 'from-violet-500 to-indigo-600',
      title: 'Presensi Instan Real-Time',
      desc: 'Pengisian daftar hadir digital dalam hitungan detik. Data tersimpan otomatis dan dapat diverifikasi kapanpun oleh penyelenggara.'
    },
    {
      icon: BookOpen,
      color: 'from-indigo-500 to-purple-600',
      title: 'Manajemen Workshop Terpadu',
      desc: 'Dashboard admin lengkap untuk mengelola jadwal, peserta, materi, tugas, dan laporan kehadiran workshop secara terintegrasi.'
    },
  ];

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionReveal className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold mb-4">
            <BookOpen size={12} />
            FASILITAS AKADEMIK
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
            Standar Keunggulan Laboratorium MPI
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-3 max-w-2xl mx-auto">
            Mendukung ekosistem riset, praktikum simulasi kepemimpinan, dan kemahiran penulisan karya ilmiah mahasiswa.
          </p>
        </SectionReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <StaggerItem key={item.title}>
              <div className="bento-card rounded-3xl p-8 h-full">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-lg mb-6`}>
                  <item.icon size={24} />
                </div>
                <h3 className="font-display font-bold text-xl text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ========================
// News Detail Modal Pop-up
// ========================
function NewsDetailModal({ news, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!news) return null;

  const handleShare = () => {
    try {
      navigator.clipboard?.writeText(window.location.origin + '/berita');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-purple-200 z-10 no-scrollbar my-auto"
        >
          {/* Close button floating */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/80 text-white flex items-center justify-center transition-all shadow-lg cursor-pointer"
            title="Tutup Berita"
          >
            <X size={18} />
          </button>

          {/* Header Image 4:5 on mobile, 16:10 on desktop */}
          <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] max-h-[380px] overflow-hidden bg-slate-900">
            <img
              src={news.image_path || '/img/bg.jpg'}
              alt={news.title}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = '/img/1.png'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

            <div className="absolute bottom-3 left-4 right-4 sm:bottom-5 sm:left-6 sm:right-6 text-white">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-600 text-white shadow-md inline-block mb-2">
                Warta Resmi Lab
              </span>
              <div className="flex items-center gap-2.5 text-xs text-purple-200">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar size={12} />
                  {new Date(news.created_at || Date.now()).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <span>•</span>
                <span>Lab Microleading FTK UINAM</span>
              </div>
            </div>
          </div>

          {/* Article Body */}
          <div className="p-5 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display mb-4 leading-snug">
              {news.title}
            </h2>

            <div className="text-slate-700 text-xs sm:text-sm leading-relaxed space-y-3.5 mb-8">
              <p className="whitespace-pre-line">{news.content}</p>
              <p>
                Kegiatan ini diselenggarakan dalam rangka memperkuat mutu praktikum dan pembelajaran interaktif di lingkungan Jurusan Manajemen Pendidikan Islam Fakultas Tarbiyah dan Keguruan UIN Alauddin Makassar.
              </p>
              <p className="text-slate-500 italic text-[11px] sm:text-xs">
                Informasi lebih lanjut dapat menghubungi pengelola laboratorium melalui portal layanan digital atau sekretariat Lab Microleading Kampus II FTK UINAM.
              </p>
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-purple-100 flex items-center justify-between gap-3">
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                <span>{copied ? 'Tautan Disalin!' : 'Bagikan'}</span>
              </button>

              <div className="flex items-center gap-2">
                <Link
                  to="/berita"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors no-underline hidden sm:inline-block"
                >
                  Buka Portal Berita
                </Link>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

// ========================
// News Section
// ========================
export function NewsSection({ news = [] }) {
  const [selectedNews, setSelectedNews] = useState(null);
  const displayNews = news.slice(0, 6);

  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-white to-brand-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionReveal className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold mb-3 sm:mb-4">
            <FileText size={12} />
            KABAR TERBARU
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight">
            Berita & Pengumuman
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
            Ikuti informasi terkini dan dokumentasi praktikum akademik Lab Microleading FTK UIN Alauddin Makassar.
          </p>
        </SectionReveal>

        {/* Instagram Feed / Grid Layout: 2 Kolom di HP, 3 Kolom di Tablet & Desktop */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
          {displayNews.map((item) => (
            <StaggerItem key={item.id}>
              <div
                onClick={() => { playClick(); setSelectedNews(item); }}
                className="bento-card group rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col h-full cursor-pointer hover:border-purple-300 hover:shadow-xl transition-all duration-300 bg-white"
              >
                {/* 4:5 Aspect Ratio Image Container */}
                <div className="zoom-container aspect-[4/5] bg-slate-100 overflow-hidden relative">
                  <img
                    src={item.image_path || '/img/1.png'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = '/img/1.png'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent opacity-60 group-hover:opacity-85 transition-opacity" />

                  {/* Date badge */}
                  <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-950/70 backdrop-blur-md text-[9px] sm:text-[11px] text-white font-medium flex items-center gap-1">
                    <Calendar size={10} className="text-purple-300" />
                    <span>
                      {new Date(item.created_at || Date.now()).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>

                  {/* Category Pill Tag */}
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 rounded-full bg-purple-600/90 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold shadow-xs">
                    Berita
                  </span>
                </div>

                {/* Card Info Content (Instagram Style Compact on Mobile) */}
                <div className="p-3 sm:p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-xs sm:text-base mb-1.5 sm:mb-2 leading-snug line-clamp-2 group-hover:text-purple-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] sm:text-sm text-slate-500 leading-relaxed line-clamp-2 hidden sm:block">
                      {item.content}
                    </p>
                  </div>

                  <div className="mt-2.5 sm:mt-4 pt-2 border-t border-purple-100/70 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-purple-700 group-hover:gap-1.5 transition-all">
                      Baca Berita <ChevronRight size={12} />
                    </span>
                    <span className="text-[9px] sm:text-[11px] text-slate-400 font-medium hidden md:inline">
                      Lab Microleading
                    </span>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* CTA ke Berita Lengkap */}
        <div className="text-center mt-8 sm:mt-12">
          <Link
            to="/berita"
            onClick={playClick}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all no-underline"
          >
            Lihat Semua Berita & Warta
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Pop-up Modal Detail Berita */}
      {selectedNews && (
        <NewsDetailModal news={selectedNews} onClose={() => setSelectedNews(null)} />
      )}
    </section>
  );
}

// ========================
// Gallery Preview Section
// ========================
export function GalleryPreview({ gallery = [] }) {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionReveal className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold mb-4">
            <Users size={12} />
            DOKUMENTASI
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
            Galeri Kegiatan Laboratorium
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Momen berharga selama praktikum microleading, workshop, dan pelatihan mahasiswa di Lab Microleading.
          </p>
        </SectionReveal>

        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.slice(0, 8).map((img) => (
            <StaggerItem key={img.id}>
              <div className="bento-card rounded-2xl overflow-hidden aspect-square">
                <div className="zoom-container w-full h-full">
                  <img
                    src={img.path}
                    alt={img.name || 'Galeri Lab Microleading'}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = '/img/1.png'; }}
                  />
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ========================
// Visi & Misi Section
// ========================
export function VisiMisiSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-brand-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionReveal className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold mb-4">
            <Star size={12} />
            TENTANG KAMI
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
            Visi & Misi Kami
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-3 max-w-2xl mx-auto">
            Membangun fondasi calon pendidik dan pengelola institusi pendidikan Islam yang berakhlak mulia serta adaptif terhadap teknologi.
          </p>
        </SectionReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SectionReveal delay={0.1}>
            <div className="bento-card rounded-3xl p-8 h-full relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-purple-100/60 rounded-full blur-2xl pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 text-2xl mb-6 shadow-xs">
                <Star size={24} />
              </div>
              <h3 className="font-display font-bold text-2xl text-slate-900 mb-4">Visi Utama</h3>
              <p className="text-slate-600 text-base leading-relaxed">
                Menjadi pusat keunggulan terdepan dalam pengembangan Pendidikan Islam yang mengintegrasikan nilai-nilai religius dengan praktik manajemen pendidikan modern berbasis teknologi digital pada tahun 2029.
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.2}>
            <div className="bento-card rounded-3xl p-8 h-full relative overflow-hidden" style={{ borderColor: 'rgba(165,180,252,0.6)' }}>
              <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-indigo-100/60 rounded-full blur-2xl pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-2xl mb-6 shadow-xs">
                <Zap size={24} />
              </div>
              <h3 className="font-display font-bold text-2xl text-slate-900 mb-4">Misi Strategis</h3>
              <ul className="space-y-3">
                {[
                  'Menyelenggarakan praktikum manajemen dan kepemimpinan pendidikan berkualitas tinggi yang inovatif.',
                  'Mencetak lulusan berkarakter pendidik Islami yang profesional, beretika, dan cakap teknologi.',
                  'Mendorong adaptasi riset dan inovasi artikel ilmiah mahasiswa pada jurnal bereputasi nasional dan internasional.',
                ].map((mission, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-slate-600 text-sm leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                    {mission}
                  </li>
                ))}
              </ul>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
