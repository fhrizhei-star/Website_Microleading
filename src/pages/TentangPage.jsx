import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Info, Award, Users, CheckCircle, MapPin, Mail, Phone,
  Target, Compass, Shield, BookOpen, Star, Sparkles
} from 'lucide-react';
import PageTransition, { SectionReveal } from '../components/transitions/PageTransition';
import { getMembers } from '../store/dataStore';

const DEFAULT_TEAM = [
  {
    id: 'm1',
    nama: 'Dr. Ahmad Afiif, M.Si',
    name: 'Dr. Ahmad Afiif, M.Si',
    role: 'Ketua Jurusan MPI',
    category: 'pimpinan',
    image: '/img/Pak-Afif.jpeg',
    foto: '/img/Pak-Afif.jpeg',
    status: 'aktif',
  },
  {
    id: 'm2',
    nama: 'Lisa Nursita, S.E., M.Si',
    name: 'Lisa Nursita, S.E., M.Si',
    role: 'Sekretaris Jurusan MPI',
    category: 'pimpinan',
    image: '/img/Lisa-Nursita.jpeg',
    foto: '/img/Lisa-Nursita.jpeg',
    status: 'aktif',
  },
  {
    id: 'm3',
    nama: 'Muh. Fahri Zahi',
    name: 'Muh. Fahri Zahi',
    role: 'Asisten Laboratorium Microleading',
    category: 'lab',
    image: '/img/Muh-Fahri-Zahi.jpg',
    foto: '/img/Muh-Fahri-Zahi.jpg',
    status: 'aktif',
  },
  {
    id: 'm4',
    nama: 'Abdul Basit Ridha, S.Pd.',
    name: 'Abdul Basit Ridha, S.Pd.',
    role: 'Asisten Laboratorium Microleading',
    category: 'lab',
    image: '/img/Abdul-Basit-Ridha, S.Pd.jpg',
    foto: '/img/Abdul-Basit-Ridha, S.Pd.jpg',
    status: 'aktif',
  },
  {
    id: 'm5',
    nama: 'Amanda Tri Lestari, S.Pd.',
    name: 'Amanda Tri Lestari, S.Pd.',
    role: 'Asisten Laboratorium Microleading',
    category: 'lab',
    image: '/img/Amanda-Tri-Lestari, S.Pd.jpg',
    foto: '/img/Amanda-Tri-Lestari, S.Pd.jpg',
    status: 'aktif',
  },
  {
    id: 'm6',
    nama: 'Inriani Rustam, S.Pd.',
    name: 'Inriani Rustam, S.Pd.',
    role: 'Asisten Laboratorium Microleading',
    category: 'lab',
    image: '/img/Inriani-Rustam, S.Pd.jpg',
    foto: '/img/Inriani-Rustam, S.Pd.jpg',
    status: 'aktif',
  },
  {
    id: 'm7',
    nama: 'Zakiyah Sananiah, S.Pd.',
    name: 'Zakiyah Sananiah, S.Pd.',
    role: 'Asisten Laboratorium Microleading',
    category: 'lab',
    image: '/img/Zakiyah-Sananiah, S.Pd.jpg',
    foto: '/img/Zakiyah-Sananiah, S.Pd.jpg',
    status: 'aktif',
  },
  {
    id: 'm8',
    nama: 'Amelya Putri Azizah',
    name: 'Amelya Putri Azizah',
    role: 'Asisten Laboratorium Microleading',
    category: 'lab',
    image: '/img/Amelya-Putri-Azizah.jpg',
    foto: '/img/Amelya-Putri-Azizah.jpg',
    status: 'aktif',
  },
  {
    id: 'm9',
    nama: 'Nelti Nurasmi',
    name: 'Nelti Nurasmi',
    role: 'Asisten Laboratorium Microleading',
    category: 'lab',
    image: '/img/Nelti-Nurasmi.jpg',
    foto: '/img/Nelti-Nurasmi.jpg',
    status: 'aktif',
  },
  {
    id: 'm10',
    nama: 'Salsabila Rahmadhani',
    name: 'Salsabila Rahmadhani',
    role: 'Asisten Laboratorium Microleading',
    category: 'lab',
    image: '/img/Salsabila-Rahmadhani.jpg',
    foto: '/img/Salsabila-Rahmadhani.jpg',
    status: 'aktif',
  },
];

const parseStoredTeam = () => {
  try {
    const raw = localStorage.getItem('mpi_members');
    if (!raw) {
      localStorage.setItem('mpi_members', JSON.stringify(DEFAULT_TEAM));
      return DEFAULT_TEAM;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter(m => m.status !== 'nonaktif').map(m => {
        const role = m.role || '';
        const isPimpinan = role.toLowerCase().includes('jurusan') || role.toLowerCase().includes('dosen') || role.toLowerCase().includes('pembimbing') || m.category === 'pimpinan';
        return {
          id: m.id || m.nama,
          name: m.nama || m.name,
          role: m.role,
          category: isPimpinan ? 'pimpinan' : 'lab',
          image: m.foto || m.image || '/img/1.png',
        };
      });
    }
  } catch (err) {
    console.warn('Error reading mpi_members:', err);
  }
  return DEFAULT_TEAM;
};

const FACILITIES = [
  {
    title: 'Ruang Simulasi Microleading',
    desc: 'Dilengkapi dengan Smart-Proyektor, Ruangan Yang Luas dan Nyaman untuk meeting, presentasi, serta evaluasi microteaching.',
    img: '/img/kelas 1.jpeg'
  },
  {
    title: 'Ruang Konsultasi',
    desc: 'Dilengkapi denngan meja yang luas serta komputer untuk konsultasi dengan Dosen.',
    img: '/img/kelas 2.jpeg'
  },
  {
    title: 'Ruang Ujian',
    desc: 'Ruangan Yang Nyaman untuk Ujian dan Diskusi Pembahasan Materi.',
    img: '/img/Ruang Ujian.jpeg'
  },
];

export default function TentangPage() {
  const [teamFilter, setTeamFilter] = useState('all');
  const [teamList, setTeamList] = useState(parseStoredTeam);

  useEffect(() => {
    // 1. Fetch live from Firebase Firestore
    getMembers().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.filter(m => m.status !== 'nonaktif').map(m => {
          const role = m.role || '';
          const isPimpinan = role.toLowerCase().includes('jurusan') || role.toLowerCase().includes('dosen') || role.toLowerCase().includes('pembimbing') || m.category === 'pimpinan';
          return {
            id: m.id || m.nama,
            name: m.nama || m.name,
            role: m.role,
            category: isPimpinan ? 'pimpinan' : 'lab',
            image: m.foto || m.image || '/img/1.png',
          };
        });
        setTeamList(formatted);
      }
    });

    const handleSync = () => {
      getMembers().then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.filter(m => m.status !== 'nonaktif').map(m => {
            const role = m.role || '';
            const isPimpinan = role.toLowerCase().includes('jurusan') || role.toLowerCase().includes('dosen') || role.toLowerCase().includes('pembimbing') || m.category === 'pimpinan';
            return {
              id: m.id || m.nama,
              name: m.nama || m.name,
              role: m.role,
              category: isPimpinan ? 'pimpinan' : 'lab',
              image: m.foto || m.image || '/img/1.png',
            };
          });
          setTeamList(formatted);
        } else {
          setTeamList(parseStoredTeam());
        }
      });
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('mpi_members_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mpi_members_updated', handleSync);
    };
  }, []);

  const filteredTeam = teamFilter === 'all'
    ? teamList
    : teamList.filter((m) => m.category === teamFilter);

  const pimpinanCount = teamList.filter(t => t.category === 'pimpinan').length;
  const labCount = teamList.filter(t => t.category === 'lab').length;

  return (
    <PageTransition motionStyle="smooth">
      <div className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <SectionReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold mb-4">
                <Info size={13} className="text-purple-600" />
                PROFIL RESMI LABORATORIUM
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-display mb-4">
                Pusat Keunggulan <span className="gradient-text">Pendidikan & Kepemimpinan</span>
              </h1>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Laboratorium Manajemen Pendidikan Islam Fakultas Tarbiyah dan Keguruan UIN Alauddin Makassar berkomitmen melahirkan lulusan berintegritas tinggi, cakap teknologi, dan siap memimpin transformasi lembaga pendidikan Islam.
              </p>
            </div>
          </SectionReveal>

          {/* Sejarah & Sekilas Pandang */}
          <SectionReveal>
            <div className="bento-card rounded-3xl p-8 sm:p-12 mb-20 border border-purple-200/80 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-700">
                  <Star size={13} />
                  Sejarah Singkat & Komitmen Mutu
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display leading-tight">
                  Membangun Generasi Pemimpin Pendidikan Islami Berdaya Saing Global
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Didirikan sebagai sarana praktikum terintegrasi di lingkungan Jurusan Manajemen Pendidikan Islam FTK UIN Alauddin Makassar, Laboratorium MPI terus berevolusi dari ruang praktikum konvensional menjadi <strong>Pusat Riset Digital dan Simulasi Kepemimpinan Modern</strong>.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Kini, laboratorium ini melayani mahasiswa dan akademisi setiap saat melalui program praktikum microleading, bimbingan penulisan karya ilmiah, uji kompetensi, serta penerbitan E-Sertifikat terverifikasi.
                </p>

                <div className="pt-2 flex flex-wrap gap-4">
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 flex-1 min-w-[140px]">
                    <p className="text-2xl font-extrabold text-purple-900 font-display">A</p>
                    <p className="text-xs text-slate-600 font-semibold">Akreditasi Prodi Unggul</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 flex-1 min-w-[140px]">
                    <p className="text-2xl font-extrabold text-purple-900 font-display">1.000+</p>
                    <p className="text-xs text-slate-600 font-semibold">Alumni Terbaik</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 flex-1 min-w-[140px]">
                    <p className="text-2xl font-extrabold text-purple-900 font-display">100%</p>
                    <p className="text-xs text-slate-600 font-semibold">Digital & Terverifikasi</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 relative">
                <div className="rounded-3xl overflow-hidden shadow-xl border border-purple-200/60 aspect-4/3">
                  <img
                    src="/img/tim.jpg"
                    alt="Tim Laboratorium MPI"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-purple-200 max-w-xs hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">Kolaborasi & Dedikasi</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Dosen pembimbing, laboran, dan mahasiswa bekerja sama memajukan riset pendidikan.</p>
                </div>
              </div>
            </div>
          </SectionReveal>

          {/* Visi, Misi & Nilai */}
          <SectionReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
              {/* Visi */}
              <div className="glass-panel rounded-3xl p-8 border border-purple-200 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-6 shadow-md shadow-purple-600/30">
                    <Target size={22} />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 font-display mb-3">
                    Visi Laboratorium
                  </h3>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                    "Menjadi laboratorium rujukan terkemuka di kawasan Indonesia Timur dalam pengembangan kompetensi manajerial, riset ilmiah, dan kepemimpinan pendidikan Islam berbasis teknologi informasi pada tahun 2030."
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-purple-100 text-xs font-bold text-purple-700">
                  Fakultas Tarbiyah dan Keguruan UIN Alauddin Makassar
                </div>
              </div>

              {/* Misi */}
              <div className="glass-panel rounded-3xl p-8 border border-purple-200">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-md shadow-indigo-600/30">
                  <Compass size={22} />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 font-display mb-3">
                  Misi Laboratorium
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={16} className="text-purple-600 shrink-0 mt-0.5" />
                    <span>Menyelenggarakan praktikum microleading dan simulasi manajemen institusi pendidikan Islam berkualitas tinggi.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={16} className="text-purple-600 shrink-0 mt-0.5" />
                    <span>Memberikan pendampingan penulisan ilmiah, sitasi bereputasi, dan publikasi jurnal nasional terakreditasi.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={16} className="text-purple-600 shrink-0 mt-0.5" />
                    <span>Menyediakan sarana multimedia interaktif untuk mendukung inovasi media pembelajaran berbasis digital.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle size={16} className="text-purple-600 shrink-0 mt-0.5" />
                    <span>Menerapkan tata kelola laboratorium transparan, akuntabel, dan ramah pengguna dengan sistem otomasi digital.</span>
                  </li>
                </ul>
              </div>
            </div>
          </SectionReveal>

          {/* Tim Pengelola */}
          <SectionReveal>
            <div className="mb-20">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold mb-3">
                  <Users size={13} />
                  STRUKTUR ORGANISASI
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900 font-display">
                  Tim Pengelola & Asisten Laboratorium
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm mt-2">
                  Dipandu oleh pimpinan jurusan dan asisten laboratorium berdedikasi tinggi di lingkungan Jurusan MPI FTK UIN Alauddin Makassar.
                </p>
              </div>

              {/* Filter Pills Kategori */}
              <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
                {[
                  { id: 'all', label: `Semua Personil (${teamList.length})` },
                  { id: 'pimpinan', label: `Pimpinan Jurusan (${pimpinanCount})` },
                  { id: 'lab', label: `Asisten Lab (${labCount})` },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setTeamFilter(pill.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${teamFilter === pill.id
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25 scale-105'
                      : 'bg-white/80 hover:bg-purple-50 text-slate-600 border border-purple-200/70 hover:border-purple-300'
                      }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Grid Personil Presisi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {filteredTeam.map((member, idx) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: idx * 0.05 }}
                    className="bento-card group rounded-3xl overflow-hidden p-5 flex flex-col items-center text-center justify-between border border-purple-200/80 hover:border-purple-300 hover:shadow-xl transition-all duration-300 bg-white/95 h-full"
                  >
                    {/* Frame Foto Portrait Presisi */}
                    <div className="relative w-full max-w-[160px] aspect-[4/5] rounded-2xl overflow-hidden mb-3.5 shadow-md border-2 border-purple-200/80 bg-slate-100 group-hover:border-purple-400 group-hover:shadow-lg transition-all shrink-0">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = '/img/1.png'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-950/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>

                    {/* Nama Lengkap */}
                    <h4 className="font-display font-extrabold text-slate-900 text-sm leading-snug mb-2 group-hover:text-purple-900 transition-colors flex-1 flex items-center justify-center">
                      {member.name}
                    </h4>

                    {/* Role / Jabatan */}
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border ${member.category === 'pimpinan'
                      ? 'bg-amber-100 text-amber-900 border-amber-200'
                      : 'bg-purple-100 text-purple-900 border-purple-200'
                      }`}>
                      {member.role}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </SectionReveal>

          {/* Fasilitas */}
          <SectionReveal>
            <div className="mb-20">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold mb-3">
                  <Shield size={13} />
                  SARANA & PRASARANA
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900 font-display">
                  Fasilitas Laboratorium Modern
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {FACILITIES.map((fac, idx) => (
                  <div key={idx} className="bento-card rounded-3xl overflow-hidden border border-purple-200/60 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="h-48 overflow-hidden">
                        <img
                          src={fac.img}
                          alt={fac.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-6">
                        <h4 className="font-bold text-slate-900 text-lg mb-2 font-display">
                          {fac.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {fac.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionReveal>

          {/* Lokasi & Kontak */}
          <SectionReveal>
            <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-purple-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">
                    <MapPin size={13} />
                    Kunjungi Laboratorium Kami
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display mb-4">
                    Gedung A Fakultas Tarbiyah dan Keguruan Lantai 1
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    Kampus II UIN Alauddin Makassar, Jl. H. M. Yasin Limpo No. 36, Romangpolong, Kec. Somba Opu, Kabupaten Gowa, Sulawesi Selatan 92119.
                  </p>

                  <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Phone size={14} />
                      </div>
                      <span>(0411) 841 879 / Jam Layanan: 08:00 - 16:00 WITA</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Mail size={14} />
                      </div>
                      <span>lab.mpi@uin-alauddin.ac.id</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden border border-purple-200/80 shadow-md aspect-16/9">
                  <img
                    src="/img/gedung_ftk.jpg"
                    alt="Kampus II UIN Alauddin Makassar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </PageTransition>
  );
}
