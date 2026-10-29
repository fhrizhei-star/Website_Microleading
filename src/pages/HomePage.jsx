import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award, Calendar, Users, Star, ChevronRight, FileText,
  Search, BookOpen, Zap, Shield, Clock, MapPin, Sparkles, ArrowRight,
  ClipboardCheck
} from 'lucide-react';
import { getAllWorkshops, getNews, getGallery } from '../store/dataStore';
import {
  HeroSection,
  TrustMarquee,
  StatsSection,
  KeunggulanSection,
  NewsSection,
  GalleryPreview,
  VisiMisiSection
} from '../components/sections/HomeSections';
import PageTransition, { SectionReveal } from '../components/transitions/PageTransition';
import { playClick } from '../utils/audio';

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

export default function HomePage() {
  const [workshops, setWorkshops] = useState([]);
  const [news, setNews] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [wData, nData, gData] = await Promise.all([
          getAllWorkshops(),
          getNews(),
          getGallery(),
        ]);
        setWorkshops(wData || []);
        setNews(nData || []);
        setGallery(gData || []);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <PageTransition motionStyle="smooth">
      <div className="relative min-h-screen">
        {/* 1. Hero Section */}
        <HeroSection workshops={workshops} />

        {/* 2. Marquee Ticker */}
        <TrustMarquee />

        {/* 3. Count Up Stats */}
        <StatsSection workshopCount={workshops.length} />

        {/* 4. Keunggulan / Core Values */}
        <KeunggulanSection />

        {/* 5. Featured Workshops / Agenda Kegiatan */}
        <section className="py-16 sm:py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionReveal>
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold mb-3">
                    <Calendar size={13} className="text-purple-600" />
                    AGENDA WORKSHOP & PELATIHAN
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
                    Workshop & Pelatihan <span className="gradient-text">Laboratorium</span>
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-xl">
                    Ikuti kegiatan workshop penulisan karya ilmiah, riset modern, dan pelatihan kepemimpinan untuk mendapatkan E-Sertifikat resmi.
                  </p>
                </div>
                <NavLink
                  to="/presensi?tab=jadwal"
                  onClick={playClick}
                  className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-5 py-2.5 rounded-full border border-purple-200 transition-all self-start md:self-auto no-underline"
                >
                  Lihat Seluruh Agenda
                  <ArrowRight size={15} />
                </NavLink>
              </div>
            </SectionReveal>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-3xl bg-purple-100/50 animate-pulse border border-purple-200/40" />
                ))}
              </div>
            ) : workshops.length === 0 ? (
              <div className="text-center py-12 rounded-3xl glass-card border border-purple-200/50">
                <Calendar size={40} className="mx-auto text-purple-400 mb-3" />
                <p className="font-bold text-slate-700">Belum ada agenda workshop yang dipublikasikan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workshops.map((w, idx) => {
                  const isOpen = w.status === 'open';
                  return (
                    <motion.div
                      key={w.id || idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      className="bento-card rounded-3xl p-6 flex flex-col justify-between border border-purple-200/60 shadow-sm hover:border-purple-300 hover:shadow-md transition-all group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                              isOpen
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            {isOpen ? '● Pendaftaran Dibuka' : '○ Pendaftaran Ditutup'}
                          </span>
                          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full">
                            E-Sertifikat
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2 leading-snug group-hover:text-purple-700 transition-colors">
                          {w.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-3 mb-5 leading-relaxed">
                          {w.description}
                        </p>

                        <div className="space-y-2 text-xs text-slate-600 border-t border-purple-100/80 pt-4 mb-6">
                          <div className="flex items-center gap-2">
                            <Users size={13} className="text-purple-600 shrink-0" />
                            <span className="font-medium text-slate-800">{w.speaker}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={13} className="text-purple-600 shrink-0" />
                            <span>{formatIndoDate(w.date)} • {w.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={13} className="text-rose-500 shrink-0" />
                            <span className="truncate">{w.location || 'Lab Microleading MPI FTK UINAM'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-purple-100/60">
                        {isOpen ? (
                          <>
                            <NavLink
                              to={`/pendaftaran?workshop=${w.id}`}
                              onClick={playClick}
                              className="btn-shimmer flex-1 py-2.5 px-3 rounded-xl text-center text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all no-underline inline-flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <ClipboardCheck size={13} />
                              Daftar
                            </NavLink>
                            <NavLink
                              to={`/presensi?workshop=${w.id}`}
                              onClick={playClick}
                              className="py-2.5 px-3 rounded-xl text-center text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:scale-[1.02] active:scale-[0.98] transition-all no-underline inline-flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Award size={13} />
                              Presensi
                            </NavLink>
                          </>
                        ) : (
                          <NavLink
                            to="/presensi?tab=cek"
                            onClick={playClick}
                            className="flex-1 py-2.5 px-4 rounded-xl text-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all no-underline inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Search size={13} />
                            Cek E-Sertifikat
                          </NavLink>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 6. News & Announcements */}
        <NewsSection news={news} />

        {/* 7. Gallery Preview */}
        <GalleryPreview gallery={gallery} />

        {/* 8. Visi & Misi */}
        <VisiMisiSection />

        {/* 9. Final Call-To-Action Banner */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionReveal>
              <div className="relative rounded-3xl p-8 sm:p-14 overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 text-white shadow-2xl border border-purple-500/30">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold mb-4">
                    <Sparkles size={13} className="text-purple-300" />
                    LAYANAN E-Sertifikat
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight mb-4">
                    Siap Memulai Praktikum & Raih Sertifikasi Digital Resmi?
                  </h2>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
                    Isi kehadiran kegiatan ilmiah dan unduh E-Sertifikat terverifikasi Lab Microleading hanya dalam hitungan detik. Tanpa antri.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <NavLink
                      to="/presensi"
                      onClick={playClick}
                      className="btn-shimmer inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-slate-950 bg-white hover:bg-slate-100 shadow-xl transition-all no-underline"
                    >
                      <Award size={16} className="text-purple-700" />
                      Presensi & Ambil Sertifikat Sekarang
                    </NavLink>
                    <NavLink
                      to="/tentang"
                      onClick={playClick}
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-purple-200 bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md transition-all no-underline"
                    >
                      <BookOpen size={16} />
                      Profil & Fasilitas Lab
                    </NavLink>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
