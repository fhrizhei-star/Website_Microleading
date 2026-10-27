import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Images, Eye, Download, X, ChevronLeft, ChevronRight,
  Maximize2, Sparkles, Filter, Calendar
} from 'lucide-react';
import { getGallery } from '../store/dataStore';
import PageTransition, { SectionReveal } from '../components/transitions/PageTransition';
import { playClick } from '../utils/audio';

const EXTRA_GALLERY = [
  { id: 101, name: 'Praktikum Microteaching & Kepemimpinan', path: '/img/kelas 1.jpeg', category: 'praktikum' },
  { id: 102, name: 'Suasana Diskusi Laboratorium MPI', path: '/img/kelas 2.jpeg', category: 'praktikum' },
  { id: 103, name: 'Gedung Fakultas Tarbiyah & Keguruan Kampus II', path: '/img/campus1.jpg', category: 'fasilitas' },
  { id: 104, name: 'Pojok Literasi & Koleksi Riset Skripsi', path: '/img/perpus.jpg', category: 'fasilitas' },
  { id: 105, name: 'Sesi Foto Bersama Mahasiswa & Instruktur', path: '/img/student.jpg', category: 'kegiatan' },
  { id: 106, name: 'Tim Dosen & Laboran Pengelola Lab Microleading', path: '/img/tim.jpg', category: 'profil' },
  { id: 107, name: 'Gedung Rektorat Kampus UIN Alauddin', path: '/img/uin.jpg', category: 'fasilitas' },
  { id: 108, name: 'Workshop Penulisan Karya Ilmiah Nasional', path: '/img/bg.jpg', category: 'kegiatan' },
];

export default function GaleriPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const stored = await getGallery();
        const merged = [...(stored || []), ...EXTRA_GALLERY];
        // Deduplicate by path
        const unique = Array.from(new Map(merged.map((m) => [m.path, m])).values());
        setItems(unique);
      } catch (err) {
        setItems(EXTRA_GALLERY);
      }
    }
    load();
  }, []);

  const filteredItems = filter === 'all'
    ? items
    : items.filter((it) => it.category === filter);

  const openLightbox = (index) => {
    playClick();
    setLightboxIndex(index);
  };

  const nextImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
    }
  };

  const prevImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  return (
    <PageTransition motionStyle="smooth">
      <div className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <SectionReveal>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold mb-4">
                <Images size={13} className="text-purple-600" />
                DOKUMENTASI VISUAL & AKTIVITAS
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-display mb-4">
                Galeri Foto <span className="gradient-text">Kegiatan Laboratorium</span>
              </h1>
              <p className="text-slate-600 text-base sm:text-lg">
                Rekaman visual suasana pembelajaran, bimbingan praktikum, fasilitas modern, serta agenda ilmiah civitas akademika Lab Microleading.
              </p>
            </div>
          </SectionReveal>

          {/* Filter Pills */}
          <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
            {[
              { id: 'all', label: 'Semua Koleksi' },
              { id: 'praktikum', label: 'Praktikum & Kelas' },
              { id: 'fasilitas', label: 'Fasilitas & Kampus' },
              { id: 'kegiatan', label: 'Workshop & Acara' },
              { id: 'profil', label: 'Tim Pengelola' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { playClick(); setFilter(id); }}
                className={`tab-pill-btn px-5 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all ${
                  filter === id
                    ? 'active bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent shadow-md shadow-purple-600/30'
                    : 'bg-white text-slate-700 border-purple-200/80 hover:bg-purple-50 hover:text-purple-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                onClick={() => openLightbox(idx)}
                className="group relative rounded-3xl overflow-hidden glass-card cursor-pointer border border-purple-200/60 shadow-sm aspect-4/3"
              >
                <img
                  src={item.path}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <div className="flex justify-end">
                    <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 size={14} />
                    </span>
                  </div>

                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-600/90 text-white backdrop-blur-md uppercase tracking-wider inline-block mb-1.5">
                      {item.category || 'Dokumentasi'}
                    </span>
                    <h3 className="font-bold text-white text-sm line-clamp-2 leading-snug">
                      {item.name}
                    </h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && filteredItems[lightboxIndex] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>

            {/* Prev button */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md transition-all"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Next button */}
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md transition-all"
            >
              <ChevronRight size={24} />
            </button>

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center justify-center relative"
            >
              <img
                src={filteredItems[lightboxIndex].path}
                alt={filteredItems[lightboxIndex].name}
                className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              />
              <div className="mt-4 text-center text-white">
                <p className="font-bold text-base sm:text-lg">{filteredItems[lightboxIndex].name}</p>
                <p className="text-xs text-purple-300 mt-1">
                  Foto {lightboxIndex + 1} dari {filteredItems.length}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
