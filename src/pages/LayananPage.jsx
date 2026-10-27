import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Users, Award, Clock, Calendar, CheckCircle2,
  Download, ArrowRight, Sparkles, Monitor, Mic, FileCheck,
  ChevronRight, X, PhoneCall, HelpCircle
} from 'lucide-react';
import { getCourses } from '../store/dataStore';
import PageTransition, { SectionReveal } from '../components/transitions/PageTransition';
import { playClick, playSuccess } from '../utils/audio';

const SERVICES = [
  {
    id: 'microleading',
    title: 'Praktikum Microleading & Manajemen Kelas',
    category: 'praktikum',
    icon: Users,
    gradient: 'from-purple-500 to-indigo-600',
    description: 'Simulasi kepemimpinan instruksional, tata kelola dinamika kelas, dan praktik manajemen supervisi pendidikan Islam berbasis studi kasus.',
    features: [
      'Laboratorium ber-AC dengan perlengkapan audiovisual lengkap',
      'Simulasi microleading terstruktur 12 pertemuan',
      'Evaluasi rubrik kompetensi dosen pembimbing',
      'Sertifikat kelulusan praktikum ber-barcode'
    ],
    target: 'Mahasiswa MPI Semester 4 & 6',
  },
  {
    id: 'kti',
    title: 'Klinik Penulisan KTI & Publikasi Jurnal',
    category: 'pelatihan',
    icon: FileCheck,
    gradient: 'from-violet-500 to-purple-600',
    description: 'Bimbingan intensif penulisan artikel ilmiah, standarisasi sitasi Mendeley/Zotero, serta strategi submit naskah ke jurnal nasional SINTA.',
    features: [
      'Pendampingan review naskah artikel riset',
      'Pengecekan turnitin & orisinalitas naskah',
      'Akses direktori jurnal mitra FTK UINAM',
      'Bimbingan penulisan skripsi & tugas akhir'
    ],
    target: 'Mahasiswa Tingkat Akhir & Peneliti',
  },
  {
    id: 'multimedia',
    title: 'Peminjaman Lab Komputer & Multimedia',
    category: 'peminjaman',
    icon: Monitor,
    gradient: 'from-indigo-500 to-purple-700',
    description: 'Penyediaan sarana komputer berkecepatan tinggi, perangkat lunak analisis data riset (SPSS, AMOS, NVivo), dan studio podcast mini.',
    features: [
      '30 Unit PC Core i7 dengan koneksi internet fiber optik',
      'Lisensi software analisis statistik & desain',
      'Peralatan rekam microteaching & mic condenser',
      'Prosedur peminjaman cepat dan terpantau'
    ],
    target: 'Civitas Akademika FTK UIN Alauddin',
  },
  {
    id: 'public-speaking',
    title: 'Pelatihan Public Speaking & Retorika Dakwah',
    category: 'pelatihan',
    icon: Mic,
    gradient: 'from-fuchsia-500 to-purple-600',
    description: 'Pengembangan seni komunikasi vokal, gestur percaya diri, dan retorika persuasif bagi calon pimpinan lembaga pendidikan.',
    features: [
      'Praktik panggung dan evaluasi rekaman video',
      'Teknik olah vokal, artikulasi, dan intonasi',
      'Penguasaan materi presentasi modern',
      'Sertifikat kelayakan kompetensi public speaking'
    ],
    target: 'Seluruh Mahasiswa & Santri Binaan',
  },
];

export default function LayananPage() {
  const [courses, setCourses] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [successNotice, setSuccessNotice] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await getCourses();
        setCourses(data || []);
      } catch (err) {
        console.error('Error loading courses:', err);
      }
    }
    loadCourses();
  }, []);

  const filteredServices = selectedFilter === 'all'
    ? SERVICES
    : SERVICES.filter((s) => s.category === selectedFilter);

  const handleBookService = (service) => {
    playClick();
    setSelectedService(service);
  };

  const handleConfirmRegistration = (e) => {
    e.preventDefault();
    playSuccess();
    setSuccessNotice(true);
    setTimeout(() => {
      setSuccessNotice(false);
      setSelectedService(null);
    }, 2000);
  };

  return (
    <PageTransition motionStyle="smooth">
      <div className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <SectionReveal>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100/90 border border-purple-200 text-purple-900 text-xs font-bold mb-4">
                <BookOpen size={13} className="text-purple-600" />
                LAYANAN AKADEMIK & RISET LABORATORIUM
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-display mb-4">
                Pusat Pelatihan & <span className="gradient-text">Fasilitas Unggulan</span>
              </h1>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Menyediakan ekosistem praktikum komprehensif untuk mengasah kapabilitas pedagogik, keahlian manajerial, riset ilmiah, dan literasi teknologi digital.
              </p>
            </div>
          </SectionReveal>

          {/* Filter Tabs */}
          <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
            {[
              { id: 'all', label: 'Semua Layanan' },
              { id: 'praktikum', label: 'Praktikum Terjadwal' },
              { id: 'pelatihan', label: 'Pelatihan & Bimbingan' },
              { id: 'peminjaman', label: 'Peminjaman Fasilitas' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { playClick(); setSelectedFilter(id); }}
                className={`tab-pill-btn px-5 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all ${
                  selectedFilter === id
                    ? 'active bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent shadow-md shadow-purple-600/30'
                    : 'bg-white text-slate-700 border-purple-200/80 hover:bg-purple-50 hover:text-purple-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {filteredServices.map((service, idx) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: idx * 0.1 }}
                  className="bento-card rounded-3xl p-7 sm:p-8 flex flex-col justify-between border border-purple-200/70"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} text-white flex items-center justify-center shadow-lg shadow-purple-500/25`}>
                        <Icon size={26} />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200 uppercase tracking-wider">
                        {service.category}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display mb-3">
                      {service.title}
                    </h2>

                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      {service.description}
                    </p>

                    <div className="space-y-2.5 mb-6">
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Keunggulan & Fasilitas:</p>
                      {service.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-600">
                          <CheckCircle2 size={14} className="text-purple-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-purple-100/90 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 font-medium">
                      Sasaran: <strong className="text-purple-950 font-bold">{service.target}</strong>
                    </span>
                    <button
                      onClick={() => handleBookService(service)}
                      className="btn-shimmer inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/20 hover:scale-[1.02] transition-transform"
                    >
                      Daftar / Konsultasi
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Jadwal Kelas Praktikum Reguler Section */}
          <SectionReveal>
            <div className="glass-panel rounded-3xl p-8 sm:p-10 mb-20 border border-purple-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 font-display">
                    Jadwal Kelas Praktikum Reguler
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Daftar mata praktikum resmi yang sedang berjalan di Laboratorium MPI FTK UINAM.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 text-purple-900 text-xs font-bold self-start">
                  <Calendar size={13} className="text-purple-600" />
                  Semester Berjalan 2026
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-purple-50/80 text-purple-950 text-xs font-bold uppercase tracking-wider border-b border-purple-200">
                    <tr>
                      <th className="py-3 px-4 rounded-l-xl">No</th>
                      <th className="py-3 px-4">Nama Praktikum</th>
                      <th className="py-3 px-4">Dosen / Mentor</th>
                      <th className="py-3 px-4">Hari & Jam</th>
                      <th className="py-3 px-4 rounded-r-xl text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 text-xs sm:text-sm">
                    {courses.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500">
                          Sedang memuat jadwal praktikum...
                        </td>
                      </tr>
                    ) : (
                      courses.map((course, index) => (
                        <tr key={course.id} className="hover:bg-purple-50/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-500">{index + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{course.nama_kelas}</td>
                          <td className="py-3 px-4 text-slate-700">{course.mentor}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 text-purple-700 font-medium">
                              <Clock size={12} />
                              {course.hari}, {course.jam}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                              <CheckCircle2 size={11} />
                              Aktif
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionReveal>

          {/* Quick FAQ */}
          <SectionReveal>
            <div className="max-w-3xl mx-auto text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold mb-3">
                <HelpCircle size={13} />
                INFORMASI PENTING
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                Pertanyaan Seputar Layanan Lab
              </h3>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  q: 'Bagaimana prosedur peminjaman ruangan laboratorium untuk kegiatan mahasiswa?',
                  a: 'Mahasiswa atau organisasi dapat mengajukan surat permohonan peminjaman ruangan minimal 3 hari sebelum kegiatan, ditujukan kepada Kepala Laboratorium MPI FTK UIN Alauddin Makassar.'
                },
                {
                  q: 'Kapan E-Sertifikat kegiatan praktikum/workshop dapat diunduh?',
                  a: 'E-Sertifikat terbit otomatis tepat setelah Anda mengisi formulir presensi digital dan memilih nama kegiatan yang Anda ikuti pada menu Presensi & Sertifikat.'
                },
                {
                  q: 'Apakah layanan bimbingan penulisan jurnal dipungut biaya?',
                  a: 'Seluruh fasilitas bimbingan KTI, sitasi Mendeley, dan pemeriksaan Turnitin di Laboratorium MPI disediakan secara gratis bagi seluruh mahasiswa aktif FTK UIN Alauddin Makassar.'
                }
              ].map(({ q, a }, idx) => (
                <div key={idx} className="bento-card rounded-2xl p-5 border border-purple-200/60">
                  <h4 className="font-bold text-slate-900 text-sm mb-2">{q}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </SectionReveal>
        </div>
      </div>

      {/* Booking / Registration Modal */}
      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-purple-200 relative overflow-hidden"
            >
              <button
                onClick={() => setSelectedService(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg leading-tight font-display">
                    Form Pendaftaran Layanan
                  </h4>
                  <p className="text-xs text-purple-700 font-medium">{selectedService.title}</p>
                </div>
              </div>

              {successNotice ? (
                <div className="py-8 text-center">
                  <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={30} />
                  </div>
                  <h5 className="font-bold text-slate-900 text-lg">Pendaftaran Berhasil Terkirim!</h5>
                  <p className="text-xs text-slate-600 mt-1">
                    Laboran MPI akan segera menghubungi Anda melalui nomor WhatsApp untuk konfirmasi jadwal.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleConfirmRegistration} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                    <input
                      required
                      type="text"
                      placeholder="Masukkan nama lengkap Anda"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-xs sm:text-sm bg-purple-50/30"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">NIM / NIP</label>
                      <input
                        required
                        type="text"
                        placeholder="Contoh: 20400121045"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-xs sm:text-sm bg-purple-50/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp</label>
                      <input
                        required
                        type="tel"
                        placeholder="0812xxxxxxxx"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-xs sm:text-sm bg-purple-50/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Keperluan / Catatan Tambahan</label>
                    <textarea
                      rows="3"
                      placeholder="Sebutkan rencana topik, tanggal, atau keperluan spesifik Anda..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-xs sm:text-sm bg-purple-50/30"
                    />
                  </div>
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedService(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn-shimmer flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/30"
                    >
                      Kirim Pendaftaran
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
