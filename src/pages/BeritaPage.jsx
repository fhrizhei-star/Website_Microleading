import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, Search, Calendar, Clock, ChevronRight,
  Share2, ArrowRight, Eye, Tag, X, User, Check
} from 'lucide-react';
import { getNews } from '../store/dataStore';
import PageTransition, { SectionReveal } from '../components/transitions/PageTransition';
import { playClick } from '../utils/audio';

export default function BeritaPage() {
  const [news, setNews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNews, setSelectedNews] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadNews() {
      try {
        const data = await getNews();
        setNews(data || []);
      } catch (err) {
        console.error('Error loading news:', err);
      }
    }
    loadNews();
  }, []);

  const filteredNews = news.filter((item) => {
    const q = searchQuery.toLowerCase();
    return item.title?.toLowerCase().includes(q) || item.content?.toLowerCase().includes(q);
  });

  const handleOpenNews = (item) => {
    playClick();
    setSelectedNews(item);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PageTransition motionStyle="smooth">
      <div className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <SectionReveal>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold mb-4">
                <Newspaper size={13} className="text-purple-600" />
                WARTA & INFORMASI LABORATORIUM MPI
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-display mb-4">
                Berita & <span className="gradient-text">Pengumuman Terkini</span>
              </h1>
              <p className="text-slate-600 text-base sm:text-lg">
                Ikuti perkembangan kegiatan akademik, publikasi riset dosen dan mahasiswa, serta rilis agenda praktikum terbaru.
              </p>
            </div>
          </SectionReveal>

          {/* Search bar */}
          <div className="max-w-xl mx-auto mb-14">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berita, pengumuman, atau agenda praktikum..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-purple-200 shadow-sm text-sm text-slate-800 placeholder-slate-400 focus:border-purple-600 transition-all"
              />
            </div>
          </div>

          {/* Featured Top News */}
          {filteredNews.length > 0 && !searchQuery && (
            <SectionReveal>
              <div className="mb-14">
                <div
                  onClick={() => handleOpenNews(filteredNews[0])}
                  className="bento-card rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 cursor-pointer group border border-purple-200/80 shadow-md"
                >
                  <div className="lg:col-span-7 h-64 sm:h-80 lg:h-auto overflow-hidden relative">
                    <img
                      src={filteredNews[0].image_path || '/img/bg.jpg'}
                      alt={filteredNews[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600 text-white shadow-md">
                        Berita Utama
                      </span>
                    </div>
                  </div>
                  <div className="lg:col-span-5 p-7 sm:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-purple-700">
                          <Calendar size={12} />
                          {new Date(filteredNews[0].created_at || Date.now()).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          3 Menit Baca
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display mb-3 group-hover:text-purple-700 transition-colors leading-snug">
                        {filteredNews[0].title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-4">
                        {filteredNews[0].content}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-purple-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-700 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Baca Selengkapnya
                        <ArrowRight size={14} />
                      </span>
                      <span className="text-xs text-slate-400">Tim Redaksi MPI</span>
                    </div>
                  </div>
                </div>
              </div>
            </SectionReveal>
          )}

          {/* News Grid (2 Kolom di HP bergaya Instagram Feed, 3 Kolom di Desktop) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {(searchQuery ? filteredNews : filteredNews.slice(1)).map((item, idx) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                onClick={() => handleOpenNews(item)}
                className="bento-card rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col justify-between cursor-pointer group border border-purple-200/60 shadow-xs hover:border-purple-300 hover:shadow-xl transition-all bg-white"
              >
                <div>
                  {/* Aspect Ratio 4:5 Portrait */}
                  <div className="aspect-[4/5] w-full overflow-hidden relative bg-slate-100">
                    <img
                      src={item.image_path || '/img/campus1.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = '/img/1.png'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent opacity-60 group-hover:opacity-85 transition-opacity" />

                    <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-slate-950/70 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[9px] sm:text-[11px] text-white font-medium flex items-center gap-1">
                      <Calendar size={10} className="text-purple-300" />
                      <span>
                        {new Date(item.created_at || Date.now()).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>

                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 rounded-full bg-purple-600/90 text-white text-[9px] sm:text-[10px] font-bold shadow-xs">
                      Berita
                    </span>
                  </div>

                  <div className="p-3 sm:p-6">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-base mb-1.5 sm:mb-2.5 line-clamp-2 group-hover:text-purple-700 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-2 sm:line-clamp-3 hidden sm:block leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                </div>

                <div className="px-3 pb-3 sm:px-6 sm:pb-6 pt-2 flex items-center justify-between text-[10px] sm:text-xs font-semibold text-purple-700 border-t border-purple-100/60 mt-auto">
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Baca Artikel <ChevronRight size={12} />
                  </span>
                  <span className="text-[9px] sm:text-[11px] text-slate-400 font-normal hidden md:inline">Lab Microleading</span>
                </div>
              </motion.article>
            ))}
          </div>

          {filteredNews.length === 0 && (
            <div className="text-center py-16 rounded-3xl glass-card border border-purple-200">
              <Newspaper size={44} className="mx-auto text-purple-400 mb-3" />
              <h3 className="text-lg font-bold text-slate-800">Tidak ada berita yang sesuai</h3>
              <p className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reading Modal via Portal */}
      {selectedNews && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
            <div className="fixed inset-0" onClick={() => setSelectedNews(null)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-purple-200 z-10 no-scrollbar my-auto"
            >
              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950/80 text-white flex items-center justify-center transition-all shadow-lg cursor-pointer"
                title="Tutup Berita"
              >
                <X size={18} />
              </button>

              <div className="relative w-full aspect-[4/5] sm:aspect-[16/10] max-h-[380px] overflow-hidden bg-slate-900">
                <img
                  src={selectedNews.image_path || '/img/bg.jpg'}
                  alt={selectedNews.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/img/1.png'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 sm:bottom-5 sm:left-6 sm:right-6 text-white">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-600 inline-block mb-2 shadow-md">
                    Warta Resmi
                  </span>
                  <div className="flex items-center gap-2.5 text-xs text-purple-200">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar size={12} />
                      {new Date(selectedNews.created_at || Date.now()).toLocaleDateString('id-ID', {
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

              <div className="p-5 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display mb-4 leading-snug">
                  {selectedNews.title}
                </h2>

                <div className="text-slate-700 text-xs sm:text-sm leading-relaxed space-y-3.5 mb-8">
                  <p className="whitespace-pre-line">{selectedNews.content}</p>
                  <p>
                    Kegiatan ini bertujuan untuk terus meningkatkan daya saing alumni dan mahasiswa Program Studi Manajemen Pendidikan Islam, membekali mereka dengan keterampilan kepemimpinan era baru, serta memperluas jaringan publikasi ilmiah di tingkat nasional dan internasional.
                  </p>
                  <p className="text-slate-500 italic text-[11px] sm:text-xs">
                    Bagi civitas akademika yang ingin berpartisipasi dalam agenda lanjutan atau mendapatkan informasi silabus praktikum, silakan menghubungi sekretariat laboratorium di Kampus II FTK UIN Alauddin Makassar.
                  </p>
                </div>

                <div className="pt-4 border-t border-purple-100 flex items-center justify-between">
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                    <span>{copied ? 'Tautan Disalin!' : 'Bagikan Berita'}</span>
                  </button>
                  <button
                    onClick={() => setSelectedNews(null)}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </PageTransition>
  );
}
