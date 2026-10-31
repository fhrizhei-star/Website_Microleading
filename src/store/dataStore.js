/**
 * Hybrid Backend Adapter for Lab MPI FTK UIN Alauddin Makassar
 * Supports Google Firebase Cloud Firestore with automatic LocalStorage Fallback
 */

import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db, isFirebaseConfigured, firebaseConfig } from '../firebase';

// ========================
// DEFAULT DATA SEEDS
// ========================
const DEFAULT_WORKSHOPS = [
  {
    id: "ws_1",
    title: "Workshop Penulisan Karya Tulis Ilmiah & Publikasi Jurnal Nasional",
    speaker: "Dr. H. Muhammad Ilyas, M.Pd.",
    schedule_type: "single",
    date: "2026-10-26",
    time: "08:30 - 12:00 WITA",
    location: "Laboratorium Microleading MPI",
    description: "Pelatihan teknis penyusunan naskah artikel jurnal, sitasi akademik, dan kiat tembus jurnal SINTA terakreditasi.",
    status: "open",
    attendance_mode: "open",
    is_attendance_open: true,
    attendance_pin: "MPI26",
    has_certificate: true,
    require_registration: true,
    cert_bg: null,
    cert_layout: null,
  },
  {
    id: "ws_2",
    title: "Pelatihan Public Speaking & Leadership Santri Modern",
    speaker: "Ustadz Rahmat Hidayat, M.I.Kom.",
    schedule_type: "single",
    date: "2026-10-28",
    time: "09:00 - 12:00 WITA",
    location: "Aula FTK Kampus II UINAM",
    description: "Meningkatkan kemampuan komunikasi vokal, retorika panggung, dan seni berbicara persuasif bagi calon pendidik.",
    status: "open",
    attendance_mode: "open",
    is_attendance_open: true,
    attendance_pin: "SANTRI88",
    has_certificate: true,
    require_registration: true,
    cert_bg: null,
    cert_layout: null,
  },
  {
    id: "ws_3",
    title: "Workshop Pemanfaatan AI & Media Digital dalam Pembelajaran Islam",
    speaker: "Fahri Pratama, S.Kom., M.T.",
    schedule_type: "single",
    date: "2026-10-31",
    time: "08:30 - 11:30 WITA",
    location: "Lab Komputer & Multimedia MPI",
    description: "Pengenalan teknologi AI etis dan pembuatan media ajar berbasis web interaktif untuk pendidik era digital.",
    status: "open",
    attendance_mode: "auto",
    is_attendance_open: null,
    attendance_pin: "AI2026",
    has_certificate: true,
    require_registration: true,
    cert_bg: null,
    cert_layout: null,
  },
  {
    id: "ws_4",
    title: "Praktikum Laboratorium Microleading & Simulasi Kepemimpinan",
    speaker: "Tim Laboratorium MPI",
    schedule_type: "recurring",
    date: "Setiap Kamis (Mingguan)",
    time: "13:30 - 15:30 WITA",
    location: "Laboratorium Microleading MPI",
    description: "Sesi praktikum rutin mingguan mahasiswa MPI untuk simulasi kepemimpinan, manajemen kelas, dan administrasi pendidikan.",
    status: "open",
    attendance_mode: "auto",
    is_attendance_open: null,
    attendance_pin: "",
    has_certificate: false,
    require_registration: true,
    cert_bg: null,
    cert_layout: null,
  },
];

const DEFAULT_ATTENDANCE = [];

const DEFAULT_REGISTRATIONS = [];

const DEFAULT_NEWS = [
  {
    id: "news_1",
    title: "Pembukaan Praktikum Laboratorium Microleading Semester Baru",
    content: "Laboratorium Manajemen Pendidikan Islam (MPI) resmi membuka sesi praktikum baru. Mahasiswa dapat melihat jadwal kelas serta silabus pembelajaran interaktif di laboratorium.",
    image_path: "/img/bg.jpg",
    created_at: new Date().toISOString(),
  },
  {
    id: "news_2",
    title: "Workshop Penulisan Karya Tulis Ilmiah Nasional",
    content: "Akan diadakan bimbingan intensif penulisan dan publikasi sitasi jurnal ilmiah bagi seluruh mahasiswa tingkat akhir di aula laboratorium.",
    image_path: "/img/campus1.jpg",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "news_3",
    title: "Pengumuman Jadwal Praktikum Semester Genap 2026",
    content: "Jadwal praktikum semester genap 2026 telah ditetapkan. Seluruh mahasiswa diwajibkan hadir dan mengisi presensi digital melalui portal Lab Microleading.",
    image_path: "/img/kelas 1.jpeg",
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

const DEFAULT_GALLERY = [
  { id: "gal_1", name: "Praktikum Microteaching & Kepemimpinan", path: "/img/kelas 1.jpeg", category: "praktikum", timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: "gal_2", name: "Suasana Diskusi Laboratorium MPI", path: "/img/kelas 2.jpeg", category: "praktikum", timestamp: new Date(Date.now() - 6000000).toISOString() },
  { id: "gal_3", name: "Gedung Fakultas Tarbiyah & Keguruan Kampus II", path: "/img/campus1.jpg", category: "fasilitas", timestamp: new Date(Date.now() - 5000000).toISOString() },
  { id: "gal_4", name: "Pojok Literasi & Koleksi Riset Skripsi", path: "/img/perpus.jpg", category: "fasilitas", timestamp: new Date(Date.now() - 4000000).toISOString() },
  { id: "gal_5", name: "Sesi Foto Bersama Mahasiswa & Instruktur", path: "/img/student.jpg", category: "kegiatan", timestamp: new Date(Date.now() - 3000000).toISOString() },
  { id: "gal_6", name: "Tim Dosen & Laboran Pengelola Lab Microleading", path: "/img/tim.jpg", category: "profil", timestamp: new Date(Date.now() - 2000000).toISOString() },
  { id: "gal_7", name: "Gedung Rektorat Kampus UIN Alauddin", path: "/img/uin.jpg", category: "fasilitas", timestamp: new Date(Date.now() - 1000000).toISOString() },
  { id: "gal_8", name: "Workshop Penulisan Karya Ilmiah Nasional", path: "/img/bg.jpg", category: "kegiatan", timestamp: new Date().toISOString() },
];

const DEFAULT_COURSES = [
  { id: 1, nama_kelas: "Naskah & Publikasi Karya Tulis Ilmiah", mentor: "Dr. H. Muhammad Ilyas, M.Pd.", hari: "Senin", jam: "08:00 - 10:30 WIB", status: "approved" },
  { id: 2, nama_kelas: "Public Speaking", mentor: "Ustadz Rahmat Hidayat, M.I.Kom.", hari: "Selasa", jam: "09:00 - 11:30 WIB", status: "approved" },
  { id: 3, nama_kelas: "Leadership & Entrepreneurship", mentor: "Ahmad Fauzi, S.Pd., M.M.", hari: "Rabu", jam: "10:00 - 12:30 WIB", status: "approved" },
  { id: 4, nama_kelas: "Baca Tulis Al-Qur'an", mentor: "Ust. M. Syahrir, S.Q., M.Ag.", hari: "Kamis", jam: "08:30 - 10:30 WIB", status: "approved" },
  { id: 5, nama_kelas: "Informasi & Teknologi", mentor: "Fahri Pratama, S.Kom., M.T.", hari: "Jumat", jam: "08:00 - 10:30 WIB", status: "approved" },
];

const DEFAULT_USERS = [
  { id: 1, username: "admin", password: "admin123", role: "admin" },
  { id: 2, username: "mahasiswa1", password: "mhs123", nim: "20400120001", angkatan: "2024", kelas: "Informasi & Teknologi", role: "user" },
];

const DEFAULT_CERT_SETTINGS = {
  template_bg: "/img/cert-template.jpg",
  top: 48,
  left: 50,
  fontSize: 34,
  fontFamily: "'Playfair Display', Georgia, serif",
  color: "#854d0e",
  fontWeight: "700",
  underline: false,
  orientation: "landscape",
  drive_folder_url: "https://drive.google.com/drive/folders/1EXAMPLE_DRIVE_FOLDER_ID",
  drive_webhook_url: "",
};

const DEFAULT_MEMBERS = [
  { id: 'm1', order: 1, nama: 'Dr. Ahmad Afiif, M.Si', role: 'Ketua Jurusan MPI', category: 'pimpinan', foto: '/img/Pak-Afif.jpeg', status: 'aktif' },
  { id: 'm2', order: 2, nama: 'Lisa Nursita, S.E., M.Si', role: 'Sekretaris Jurusan MPI', category: 'pimpinan', foto: '/img/Lisa-Nursita.jpeg', status: 'aktif' },
  { id: 'm3', order: 3, nama: 'Muh. Fahri Zahi', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Muh-Fahri-Zahi.jpg', status: 'aktif' },
  { id: 'm4', order: 4, nama: 'Abdul Basit Ridha, S.Pd.', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Abdul-Basit-Ridha, S.Pd.jpg', status: 'aktif' },
  { id: 'm5', order: 5, nama: 'Amanda Tri Lestari, S.Pd.', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Amanda-Tri-Lestari, S.Pd.jpg', status: 'aktif' },
  { id: 'm6', order: 6, nama: 'Inriani Rustam, S.Pd.', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Inriani-Rustam, S.Pd.jpg', status: 'aktif' },
  { id: 'm7', order: 7, nama: 'Zakiyah Sananiah, S.Pd.', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Zakiyah-Sananiah, S.Pd.jpg', status: 'aktif' },
  { id: 'm8', order: 8, nama: 'Amelya Putri Azizah', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Amelya-Putri-Azizah.jpg', status: 'aktif' },
  { id: 'm9', order: 9, nama: 'Nelti Nurasmi', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Nelti-Nurasmi.jpg', status: 'aktif' },
  { id: 'm10', order: 10, nama: 'Salsabila Rahmadhani', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Salsabila-Rahmadhani.jpg', status: 'aktif' },
];

// Generic LocalStorage helpers
function getStore(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}
function setStore(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function initStorage(key, defaultData) {
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify(defaultData));
  }
}

const delay = (ms = 25) => new Promise(r => setTimeout(r, ms));

// Status helper
export function getFirebaseStatus() {
  return {
    isConfigured: isFirebaseConfigured,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  };
}

// Auto Seed Firestore on first run
let isSeeding = false;
async function syncFirestoreSeeds() {
  if (isSeeding || !isFirebaseConfigured || !db) return;
  isSeeding = true;
  try {
    // Cek flag status seed permanen agar tidak pernah membuat duplikat
    const seedDoc = await getDoc(doc(db, 'settings', 'seeds_status')).catch(() => null);
    const seedData = (seedDoc && seedDoc.exists()) ? seedDoc.data() : {};

    // 1. Seeding workshops (hanya jika benar-benar belum pernah di-seed sama sekali)
    if (!seedData.workshops_seeded) {
      const wsSnap = await getDocs(collection(db, 'workshops'));
      if (wsSnap.empty) {
        console.log('🌱 [Firebase] Seeding data awal workshops dengan ID kanonikal...');
        for (const w of DEFAULT_WORKSHOPS) {
          const { id, ...wData } = w;
          await setDoc(doc(db, 'workshops', id), { ...wData, created_at: new Date().toISOString() });
        }
      }
      await setDoc(doc(db, 'settings', 'seeds_status'), {
        workshops_seeded: true,
        seeded_at: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    }

    // 2. Seeding news (hanya jika belum pernah di-seed)
    if (!seedData.news_seeded) {
      const newsSnap = await getDocs(collection(db, 'news'));
      if (newsSnap.empty) {
        console.log('🌱 [Firebase] Seeding data awal news...');
        for (const n of DEFAULT_NEWS) {
          await addDoc(collection(db, 'news'), n);
        }
      }
      await setDoc(doc(db, 'settings', 'seeds_status'), {
        news_seeded: true,
      }, { merge: true }).catch(() => {});
    }

    const galSnap = await getDocs(collection(db, 'gallery'));
    if (galSnap.empty) {
      console.log('🌱 [Firebase] Seeding data awal gallery...');
      for (const g of DEFAULT_GALLERY) {
        await setDoc(doc(db, 'gallery', g.id), g);
      }
    }

    const mbrSnap = await getDocs(collection(db, 'members'));
    if (mbrSnap.empty) {
      console.log('🌱 [Firebase] Seeding data awal members...');
      for (const m of DEFAULT_MEMBERS) {
        await setDoc(doc(db, 'members', m.id), { ...m, created_at: new Date().toISOString() });
      }
    }

    const certSnap = await getDoc(doc(db, 'cert_settings', 'active'));
    if (!certSnap.exists()) {
      console.log('🌱 [Firebase] Seeding settings template cert ke cert_settings/active...');
      await setDoc(doc(db, 'cert_settings', 'active'), DEFAULT_CERT_SETTINGS);
      await setDoc(doc(db, 'settings', 'cert'), DEFAULT_CERT_SETTINGS).catch(() => {});
    }

    const adminAuthSnap = await getDoc(doc(db, 'settings', 'admin_auth'));
    if (!adminAuthSnap.exists()) {
      console.log('🌱 [Firebase] Seeding kredensial admin ke settings/admin_auth...');
      await setDoc(doc(db, 'settings', 'admin_auth'), {
        username: "admin",
        password: "admin123",
        created_at: new Date().toISOString()
      });
    }
  } catch (err) {
    isSeeding = false;
    console.warn('ℹ️ [Firebase] Info status Firestore (pastikan rule di console sudah Test Mode):', err.message);
  }
}

// Initialize all stores
export function initializeStore() {
  const isInitialized = localStorage.getItem("mpi_seeds_initialized");
  if (!isInitialized) {
    initStorage("mpi_workshops", DEFAULT_WORKSHOPS);
    localStorage.setItem("mpi_seeds_initialized", "true");
  }
  initStorage("mpi_attendance", DEFAULT_ATTENDANCE);
  initStorage("mpi_registrations", DEFAULT_REGISTRATIONS);
  initStorage("mpi_news", DEFAULT_NEWS);
  initStorage("mpi_gallery", DEFAULT_GALLERY);
  initStorage("mpi_courses", DEFAULT_COURSES);
  initStorage("mpi_users", DEFAULT_USERS);
  initStorage("mpi_cert_settings", DEFAULT_CERT_SETTINGS);
  initStorage("mpi_members", DEFAULT_MEMBERS);
  initStorage("mpi_assignments", []);

  if (isFirebaseConfigured && db) {
    syncFirestoreSeeds();
  }
}

// ========================
// WORKSHOPS & HYBRID ATTENDANCE
// ========================

/**
 * Waktu Real-Time Zona WITA (Asia/Makassar, UTC+8)
 * Laboratorium MPI FTK Kampus II UIN Alauddin Makassar
 */
export function getMakassarTimeInfo(dateObj = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const idFormatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      weekday: 'long',
    });
    const parts = formatter.formatToParts(dateObj);
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });
    const year = map.year;
    const month = map.month;
    const day = map.day;
    const hour = parseInt(map.hour, 10);
    const minute = parseInt(map.minute, 10);
    const weekday = idFormatter.format(dateObj).toLowerCase();
    const todayStr = `${year}-${month}-${day}`;
    const currentMinutes = hour * 60 + minute;
    const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} WITA`;

    return { todayStr, weekday, hour, minute, currentMinutes, formattedTime };
  } catch {
    const d = new Date(dateObj);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = d.getHours();
    const minute = d.getMinutes();
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    return {
      todayStr: `${year}-${month}-${day}`,
      weekday: days[d.getDay()],
      hour,
      minute,
      currentMinutes: hour * 60 + minute,
      formattedTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} WITA`,
    };
  }
}

/**
 * Parsing rentang jam (cth: "08:30 - 12:00 WITA" atau "13:30 - 15:30")
 * Menghasilkan startMinutes dan endMinutes dari 00:00 (tengah malam)
 */
export function parseTimeRange(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.match(/(\d{1,2})[:.](\d{2})\s*(?:-|s\/d|sampai)\s*(\d{1,2})[:.](\d{2})/i);
  if (!match) return null;
  const startH = parseInt(match[1], 10);
  const startM = parseInt(match[2], 10);
  const endH = parseInt(match[3], 10);
  const endM = parseInt(match[4], 10);
  return {
    startMinutes: startH * 60 + startM,
    endMinutes: endH * 60 + endM,
    startFormatted: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
    endFormatted: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
  };
}

/**
 * Deteksi apakah jadwal hari rutin berkala cocok dengan hari saat ini di Makassar
 */
export function isRecurringDayMatching(datePattern, currentWeekday) {
  if (!datePattern || typeof datePattern !== 'string') return true;
  const lower = datePattern.toLowerCase();
  const allDays = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  const matchedDays = allDays.filter(d => {
    if (d === 'jumat') return lower.includes('jumat') || lower.includes("jum'at");
    return lower.includes(d);
  });
  if (matchedDays.length > 0) {
    if (currentWeekday === 'jumat') return matchedDays.includes('jumat');
    return matchedDays.includes(currentWeekday);
  }
  // Pola umum tanpa nama hari spesifik (misal: "Jadwal Rutin Mingguan") berlaku pada hari kerja kampus (Senin - Jumat)
  return ['senin', 'selasa', 'rabu', 'kamis', 'jumat'].includes(currentWeekday);
}

export async function getAllWorkshops() {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'workshops'));
      if (!snap.empty) {
        const seen = new Set();
        const list = [];
        snap.docs.forEach(d => {
          const data = d.data();
          const scheduleType = data.schedule_type || (data.date && data.date.includes('-') && data.date.length === 10 ? 'single' : 'recurring');
          const attMode = data.attendance_mode || (data.is_attendance_open === true ? 'open' : data.is_attendance_open === false ? 'closed' : 'auto');
          const item = {
            ...data,
            id: d.id, // PASTIKAN ID dokumen Firestore selalu menjadi ID utama (tidak ditimpa data.id)
            schedule_type: scheduleType,
            attendance_mode: attMode,
            has_certificate: data.has_certificate !== false,
            require_registration: data.require_registration !== false,
          };
          const normTitle = (item.title || '').trim().toLowerCase();
          const dedupKey = `${normTitle}__${item.date}`;
          if (!seen.has(item.id) && !seen.has(dedupKey)) {
            seen.add(item.id);
            seen.add(dedupKey);
            list.push(item);
          }
        });
        setStore("mpi_workshops", list);
        return list;
      }
    } catch (err) {
      console.warn('⚠️ [Firestore] getAllWorkshops error:', err.message);
    }
  }
  await delay();
  const rawList = getStore("mpi_workshops") || [];
  const seenLocal = new Set();
  const list = [];
  rawList.forEach((w, idx) => {
    const scheduleType = w.schedule_type || (w.date && w.date.includes('-') && w.date.length === 10 ? 'single' : 'recurring');
    const attMode = w.attendance_mode || (w.is_attendance_open === true ? 'open' : w.is_attendance_open === false ? 'closed' : 'auto');
    const item = {
      ...w,
      id: w.id || `ws_${idx + 1}`,
      schedule_type: scheduleType,
      attendance_mode: attMode,
      has_certificate: w.has_certificate !== false,
      require_registration: w.require_registration !== false,
    };
    const normTitle = (item.title || '').trim().toLowerCase();
    const dedupKey = `${normTitle}__${item.date}`;
    if (!seenLocal.has(item.id) && !seenLocal.has(dedupKey)) {
      seenLocal.add(item.id);
      seenLocal.add(dedupKey);
      list.push(item);
    }
  });
  return list;
}

export async function getWorkshops() {
  const all = await getAllWorkshops();
  return all.filter(w => w.status === 'open');
}

/**
 * SISTEM KONTROL PRESENSI HYBRID (OTOMATIS + MANUAL OVERRIDE):
 * 1. Mode Otomatis ('auto'): Mengikuti jadwal hari & jam WITA secara presisi (Window Waktu).
 * 2. Mode Manual Override Buka ('open'): Hak veto Admin untuk membuka presensi kapan saja (simulasi/uji coba/sesi live).
 * 3. Mode Manual Override Tutup ('closed'): Hak veto Admin untuk mengunci presensi kapan saja.
 * 4. Token / PIN Presensi: attendance_pin verifikasi rahasia ruangan fisik/proyektor.
 */
export function getWorkshopAttendanceStatus(workshop) {
  if (!workshop) {
    return {
      allowed: false,
      code: 'NOT_FOUND',
      mode: 'closed',
      statusBadge: 'Pilih Workshop',
      reason: 'Silakan tentukan workshop yang Anda ikuti.',
      requiresPin: false,
      pin: '',
    };
  }

  const hasPin = Boolean(workshop.attendance_pin && String(workshop.attendance_pin).trim().length > 0);
  const pin = hasPin ? String(workshop.attendance_pin).trim() : '';

  // Jika kegiatan dinonaktifkan/ditutup oleh panitia
  if (workshop.status === 'closed') {
    return {
      allowed: false,
      code: 'CLOSED',
      mode: 'closed',
      statusBadge: 'Kegiatan Ditutup',
      requiresPin: hasPin,
      pin,
      reason: 'Kegiatan workshop/praktikum ini telah selesai atau ditutup oleh pengelola lab.',
    };
  }

  // Tentukan mode presensi efektif ('open', 'closed', atau 'auto')
  let effectiveMode = workshop.attendance_mode;
  if (!effectiveMode) {
    if (workshop.is_attendance_open === true) {
      effectiveMode = 'open';
    } else if (workshop.is_attendance_open === false && workshop.schedule_type === 'single') {
      effectiveMode = 'auto';
    } else {
      effectiveMode = 'auto';
    }
  }

  // 1. HAK VETO ADMIN: MANUAL OVERRIDE (BUKA)
  if (effectiveMode === 'open') {
    return {
      allowed: true,
      code: 'OPEN_LIVE',
      mode: 'open',
      statusBadge: 'Presensi Dibuka Manual',
      requiresPin: hasPin,
      pin,
      reason: 'Presensi dibuka langsung oleh panitia/asisten lab di ruangan (Hak Veto Admin aktif).',
    };
  }

  // 2. HAK VETO ADMIN: MANUAL OVERRIDE (KUNCI)
  if (effectiveMode === 'closed') {
    return {
      allowed: false,
      code: 'ADMIN_CLOSED',
      mode: 'closed',
      statusBadge: 'Presensi Dikunci Manual',
      requiresPin: hasPin,
      pin,
      reason: 'Presensi sedang dikunci manual oleh panitia/asisten lab di ruangan.',
    };
  }

  // 3. MODE OTOMATIS (AUTO SCHEDULE WINDOW)
  // Mengikuti kalender dan jam WITA (Makassar)
  const timeInfo = getMakassarTimeInfo();
  const { todayStr, weekday, currentMinutes, formattedTime } = timeInfo;
  const timeRange = parseTimeRange(workshop.time);

  // Buffer toleransi: 15 menit sebelum mulai & 15 menit setelah selesai
  const bufferBefore = 15;
  const bufferAfter = 15;

  // A. Jadwal Rutin Berkala (Praktikum Lab)
  if (workshop.schedule_type === 'recurring') {
    const isDayMatch = isRecurringDayMatching(workshop.date, weekday);
    const dayLabel = weekday.charAt(0).toUpperCase() + weekday.slice(1);

    if (!isDayMatch) {
      return {
        allowed: false,
        code: 'DAY_LOCKED',
        mode: 'auto',
        statusBadge: 'Bukan Hari Praktikum',
        requiresPin: hasPin,
        pin,
        reason: `Presensi otomatis dibuka setiap ${workshop.date || 'hari praktikum'} pada jam ${workshop.time || ''}. Hari ini (${dayLabel}) presensi dikunci.`,
      };
    }

    if (timeRange) {
      const openStart = timeRange.startMinutes - bufferBefore;
      const openEnd = timeRange.endMinutes + bufferAfter;

      if (currentMinutes < openStart) {
        return {
          allowed: false,
          code: 'TIME_LOCKED_EARLY',
          mode: 'auto',
          statusBadge: 'Menunggu Jam Praktikum',
          requiresPin: hasPin,
          pin,
          reason: `Hari ini (${dayLabel}) adalah hari praktikum! Presensi dibuka otomatis mulai pukul ${timeRange.startFormatted} WITA (Waktu sekarang: ${formattedTime}).`,
        };
      }

      if (currentMinutes > openEnd) {
        return {
          allowed: false,
          code: 'TIME_LOCKED_LATE',
          mode: 'auto',
          statusBadge: 'Sesi Hari Ini Selesai',
          requiresPin: hasPin,
          pin,
          reason: `Sesi praktikum hari ini telah selesai pada pukul ${timeRange.endFormatted} WITA. Presensi otomatis ditutup.`,
        };
      }

      return {
        allowed: true,
        code: 'OPEN_AUTO',
        mode: 'auto',
        statusBadge: 'Presensi Praktikum Aktif',
        requiresPin: hasPin,
        pin,
        reason: `Presensi terbuka otomatis sesuai jam praktikum laboratorium (${workshop.time}).`,
      };
    }

    // Pola hari cocok tanpa batasan jam spesifik
    return {
      allowed: true,
      code: 'OPEN_AUTO',
      mode: 'auto',
      statusBadge: 'Presensi Praktikum Aktif',
      requiresPin: hasPin,
      pin,
      reason: `Presensi terbuka otomatis sesuai hari praktikum hari ini (${dayLabel}).`,
    };
  }

  // B. Tanggal Pasti (Sekali Acara / Workshop)
  const isFutureDate = Boolean(workshop.date && workshop.date > todayStr);
  const isPastDate = Boolean(workshop.date && workshop.date < todayStr);
  const isToday = Boolean(workshop.date && workshop.date === todayStr);

  if (isFutureDate) {
    return {
      allowed: false,
      code: 'DATE_LOCKED',
      mode: 'auto',
      statusBadge: 'Presensi Belum Dibuka',
      requiresPin: hasPin,
      pin,
      reason: `Presensi belum dibuka. Kegiatan baru akan diselenggarakan pada ${workshop.date} (${workshop.time || 'Hari-H'}). Simpan E-Ticket Anda untuk digunakan saat kegiatan berlangsung.`,
    };
  }

  if (isPastDate) {
    return {
      allowed: false,
      code: 'CLOSED',
      mode: 'auto',
      statusBadge: 'Kegiatan Selesai',
      requiresPin: hasPin,
      pin,
      reason: `Kegiatan ini telah selesai diselenggarakan pada ${workshop.date} dan presensi telah ditutup.`,
    };
  }

  // Jika hari ini adalah Hari-H
  if (isToday) {
    if (timeRange) {
      const openStart = timeRange.startMinutes - bufferBefore;
      const openEnd = timeRange.endMinutes + bufferAfter;

      if (currentMinutes < openStart) {
        return {
          allowed: false,
          code: 'TIME_LOCKED_EARLY',
          mode: 'auto',
          statusBadge: 'Menunggu Jam Kegiatan',
          requiresPin: hasPin,
          pin,
          reason: `Hari ini adalah hari kegiatan! Presensi akan dibuka otomatis mulai pukul ${timeRange.startFormatted} WITA (Waktu sekarang: ${formattedTime}).`,
        };
      }

      if (currentMinutes > openEnd) {
        return {
          allowed: false,
          code: 'TIME_LOCKED_LATE',
          mode: 'auto',
          statusBadge: 'Sesi Hari Ini Selesai',
          requiresPin: hasPin,
          pin,
          reason: `Sesi kegiatan hari ini telah selesai pada pukul ${timeRange.endFormatted} WITA. Presensi resmi ditutup.`,
        };
      }

      return {
        allowed: true,
        code: 'OPEN_AUTO',
        mode: 'auto',
        statusBadge: 'Presensi Hari-H Aktif',
        requiresPin: hasPin,
        pin,
        reason: `Presensi dibuka otomatis sesuai jam kegiatan Hari-H (${workshop.time}).`,
      };
    }

    return {
      allowed: true,
      code: 'OPEN_AUTO',
      mode: 'auto',
      statusBadge: 'Presensi Hari-H Aktif',
      requiresPin: hasPin,
      pin,
      reason: 'Presensi dibuka otomatis pada hari pelaksanaan kegiatan.',
    };
  }

  return {
    allowed: false,
    code: 'CLOSED',
    mode: 'auto',
    statusBadge: 'Presensi Ditutup',
    requiresPin: hasPin,
    pin,
    reason: 'Sesi presensi untuk kegiatan ini belum aktif.',
  };
}

/**
 * Update Mode Presensi (Otomatis / Buka Manual / Kunci Manual)
 */
export async function setWorkshopAttendanceMode(id, mode) {
  const isAttendanceOpen = mode === 'open' ? true : mode === 'closed' ? false : null;
  return await updateWorkshop(id, {
    attendance_mode: mode,
    is_attendance_open: isAttendanceOpen,
  });
}

export async function createWorkshop(data) {
  const attMode = data.attendance_mode || (data.is_attendance_open === true ? 'open' : data.is_attendance_open === false ? 'closed' : 'auto');
  const isAttOpen = attMode === 'open' ? true : attMode === 'closed' ? false : null;
  const newWData = {
    ...data,
    status: data.status || "open",
    schedule_type: data.schedule_type || 'single',
    attendance_mode: attMode,
    is_attendance_open: isAttOpen,
    attendance_pin: data.attendance_pin ? String(data.attendance_pin).trim() : "",
    has_certificate: data.has_certificate !== false,
    require_registration: data.require_registration !== false,
    created_at: new Date().toISOString()
  };
  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'workshops'), newWData);
      const created = { ...newWData, id: docRef.id };
      const workshops = getStore("mpi_workshops");
      setStore("mpi_workshops", [...workshops.filter(w => w.id !== created.id), created]);
      return created;
    } catch (err) {
      console.warn('⚠️ [Firestore] createWorkshop error:', err.message);
    }
  }
  await delay();
  const workshops = getStore("mpi_workshops");
  const newW = { ...newWData, id: `ws_${Date.now()}` };
  setStore("mpi_workshops", [...workshops.filter(w => w.id !== newW.id), newW]);
  return newW;
}

export async function updateWorkshop(id, data) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'workshops', String(id));
      await updateDoc(docRef, data);
    } catch (err) {
      console.warn('⚠️ [Firestore] updateWorkshop error:', err.message);
    }
  }
  await delay();
  const workshops = getStore("mpi_workshops").map(w => String(w.id) === String(id) ? { ...w, ...data } : w);
  setStore("mpi_workshops", workshops);
  return workshops.find(w => String(w.id) === String(id));
}

export async function deleteWorkshop(id) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'workshops', String(id)));
    } catch (err) {
      console.warn('⚠️ [Firestore] deleteWorkshop error:', err.message);
    }
  }
  await delay();
  const workshops = getStore("mpi_workshops").filter(w => String(w.id) !== String(id));
  setStore("mpi_workshops", workshops);
  return true;
}

// ========================
// ATTENDANCE
// ========================
export async function getAttendance(queryStr = "") {
  let records = [];
  let fromFirebase = false;
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      fromFirebase = true;
      records = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        has_certificate: d.data().has_certificate !== false,
      }));
      setStore("mpi_attendance", records);
    } catch (err) {
      console.warn('⚠️ [Firestore] getAttendance error:', err.message);
    }
  }

  if (!fromFirebase) {
    await delay();
    records = (getStore("mpi_attendance") || []).map(r => ({
      ...r,
      has_certificate: r.has_certificate !== false,
    }));
  }

  if (queryStr) {
    const q = queryStr.toLowerCase();
    records = records.filter(r =>
      (r.nama || "").toLowerCase().includes(q) ||
      (r.identitas || "").toLowerCase().includes(q) ||
      (r.instansi || "").toLowerCase().includes(q) ||
      (r.cert_number || "").toLowerCase().includes(q)
    );
  }
  return records;
}

export async function submitAttendance(data) {
  await delay(50);
  const records = getStore("mpi_attendance");
  const workshops = await getAllWorkshops();
  const workshop = workshops.find(w => String(w.id) === String(data.workshop_id));
  const certSettings = await getCertSettings();

  // Enforce 3 Security Layers Protection
  if (workshop) {
    const access = getWorkshopAttendanceStatus(workshop);
    if (!access.allowed) {
      throw new Error(access.reason || 'Sesi presensi untuk workshop ini belum dibuka oleh panitia.');
    }

    if (access.requiresPin) {
      const userPin = String(data.pin || '').trim().toUpperCase();
      const expectedPin = String(access.pin || '').trim().toUpperCase();
      if (!userPin) {
        throw new Error('PIN Presensi Hari-H wajib dimasukkan untuk mengonfirmasi kehadiran.');
      }
      if (userPin !== expectedPin) {
        throw new Error('PIN Presensi tidak valid! Silakan periksa PIN yang ditampilkan oleh panitia di ruangan.');
      }
    }

    // Kebijakan: Wajib mendaftar terlebih dahulu sebelum presensi
    if (workshop.require_registration !== false) {
      const matchReg = await findRegistrationByNimOrCode(data.identitas, data.workshop_id);
      if (!matchReg) {
        const err = new Error(`NIM/Identitas "${data.identitas}" belum terdaftar pada kegiatan "${workshop.title}". Silakan lakukan pendaftaran terlebih dahulu.`);
        err.code = 'NOT_REGISTERED';
        err.workshop = workshop;
        throw err;
      }
    }
  }

  const now = new Date();
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isRecurring = workshop?.schedule_type === 'recurring';

  // Anti-duplikasi presensi di backend:
  if (isRecurring) {
    // Untuk kegiatan rutin: 1 NIM hanya bisa absen 1 kali per hari yang sama
    const alreadyToday = records.find(
      r => String(r.workshop_id) === String(data.workshop_id) &&
           String(r.identitas || '').trim().toUpperCase() === String(data.identitas || '').trim().toUpperCase() &&
           r.timestamp && r.timestamp.startsWith(todayDateStr)
    );
    if (alreadyToday) {
      const err = new Error(`NIM ${data.identitas} sudah tercatat presensi pada hari ini (${todayDateStr}) untuk sesi praktikum ini.`);
      err.code = 'ALREADY_ATTENDED_TODAY';
      err.record = alreadyToday;
      throw err;
    }
  } else {
    // Untuk workshop sekali jalan: 1 NIM hanya bisa absen 1 kali untuk seluruh sesi
    const alreadyRecord = records.find(
      r => String(r.workshop_id) === String(data.workshop_id) &&
           String(r.identitas || '').trim().toUpperCase() === String(data.identitas || '').trim().toUpperCase()
    );
    if (alreadyRecord) {
      const err = new Error(`NIM ${data.identitas} sudah tercatat presensi pada kegiatan ini dengan nomor referensi ${alreadyRecord.cert_number}.`);
      err.code = 'ALREADY_ATTENDED';
      err.record = alreadyRecord;
      throw err;
    }
  }

  const hasCert = workshop ? (workshop.has_certificate !== false) : true;
  const certNum = hasCert
    ? `CERT/MPI/${now.getFullYear()}/${String(records.length + 1).padStart(4, "0")}`
    : `PRES-MPI/${now.getFullYear()}/${String(records.length + 1).padStart(4, "0")}`;

  const newRecord = {
    workshop_id: data.workshop_id,
    workshop_title: workshop?.title || "Kegiatan Lab Microleading",
    workshop_date: isRecurring ? todayDateStr : (workshop?.date || todayDateStr),
    schedule_pattern: isRecurring ? (workshop?.date || "Jadwal Rutin Berkala") : null,
    schedule_type: workshop?.schedule_type || 'single',
    speaker: workshop?.speaker || "Instruktur / Panitia Lab",
    has_certificate: hasCert,
    cert_bg: hasCert ? (workshop?.cert_bg || certSettings?.template_bg || "/img/cert-template.jpg") : null,
    cert_layout: hasCert ? (workshop?.cert_layout ? {
      orientation: 'landscape',
      ...workshop.cert_layout,
    } : {
      top: certSettings.top,
      left: certSettings.left,
      fontSize: certSettings.fontSize,
      fontFamily: certSettings.fontFamily,
      color: certSettings.color,
      fontWeight: certSettings.fontWeight,
      underline: certSettings.underline,
      orientation: certSettings.orientation || 'landscape',
    }) : null,
    drive_url: hasCert ? (workshop?.drive_folder_url || certSettings?.drive_folder_url || null) : null,
    drive_webhook_url: hasCert ? (workshop?.drive_webhook_url || certSettings?.drive_webhook_url || null) : null,
    nama: data.nama,
    identitas: data.identitas,
    instansi: data.instansi,
    email: data.email,
    whatsapp: data.whatsapp,
    kesan: data.kesan,
    bukti_file: data.bukti_file || null,
    cert_number: certNum,
    timestamp: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'attendance'), newRecord);
      const created = { ...newRecord, id: docRef.id };
      setStore("mpi_attendance", [created, ...records]);
      // Connect with registration if matching NIM exists
      findRegistrationByNimOrCode(data.identitas, data.workshop_id).then(match => {
        if (match) updateRegistrationStatus(match.id, 'hadir', true);
      }).catch(() => {});
      return created;
    } catch (err) {
      console.warn('⚠️ [Firestore] submitAttendance error:', err.message);
    }
  }

  const localRecord = { ...newRecord, id: `attn_${Date.now()}` };
  setStore("mpi_attendance", [localRecord, ...records]);
  // Connect with registration if matching NIM exists
  findRegistrationByNimOrCode(data.identitas, data.workshop_id).then(match => {
    if (match) updateRegistrationStatus(match.id, 'hadir', true);
  }).catch(() => {});
  return localRecord;
}

export async function deleteAttendance(id) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'attendance', String(id)));
    } catch (err) {
      console.warn('⚠️ [Firestore] deleteAttendance error:', err.message);
    }
  }
  await delay();
  const records = getStore("mpi_attendance").filter(r => String(r.id) !== String(id));
  setStore("mpi_attendance", records);
  return true;
}

export async function updateAttendanceDriveUrl(id, drive_url) {
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'attendance', String(id)), { drive_url });
    } catch (err) {
      console.warn('⚠️ [Firestore] updateAttendanceDriveUrl error:', err.message);
    }
  }
  await delay();
  const records = getStore("mpi_attendance").map(r =>
    String(r.id) === String(id) ? { ...r, drive_url } : r
  );
  setStore("mpi_attendance", records);
  return true;
}

// ========================
// REGISTRATIONS (PENDAFTARAN)
// ========================
export async function getRegistrations(workshopId = "") {
  let list = [];
  let fromFirebase = false;
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'registrations'), orderBy('registered_at', 'desc'));
      const snap = await getDocs(q);
      fromFirebase = true;
      list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStore("mpi_registrations", list);
    } catch (err) {
      console.warn('⚠️ [Firestore] getRegistrations error:', err.message);
    }
  }

  if (!fromFirebase) {
    await delay();
    list = getStore("mpi_registrations") || [];
  }

  if (!Array.isArray(list)) list = [];

  // Ensure every item is a valid object with an id and valid code
  list = list.filter(Boolean).map((r, i) => ({
    ...r,
    id: r.id || `reg_${i + 1}`,
    reg_code: r.reg_code || `REG-MPI-2026-${String(i + 1).padStart(4, '0')}`
  }));

  if (workshopId && workshopId !== 'all') {
    return list.filter(r => r && String(r.workshop_id) === String(workshopId));
  }
  return list;
}

export async function submitRegistration(data) {
  await delay(50);
  const existingList = await getRegistrations();
  const workshops = await getAllWorkshops();
  const workshop = workshops.find(w => String(w.id) === String(data.workshop_id));

  // Anti-duplikasi check: satu NIM hanya bisa mendaftar 1 kali per workshop
  const cleanNim = (data.nim_nip || '').trim().toLowerCase();
  const alreadyRegistered = existingList.find(
    r => String(r.workshop_id) === String(data.workshop_id) &&
         (r.nim_nip || '').trim().toLowerCase() === cleanNim
  );

  if (alreadyRegistered) {
    const err = new Error(`NIM/Identitas "${data.nim_nip}" sudah terdaftar pada kegiatan "${workshop?.title || 'Workshop ini'}" dengan Kode Registrasi: ${alreadyRegistered.reg_code}.`);
    err.alreadyRegistered = alreadyRegistered;
    throw err;
  }

  const regCode = `REG-MPI-${new Date().getFullYear()}-${String(existingList.length + 1).padStart(4, "0")}`;
  const newRegistration = {
    reg_code: regCode,
    workshop_id: data.workshop_id,
    workshop_title: workshop?.title || "Workshop Lab Microleading",
    workshop_date: workshop?.date || new Date().toISOString().split("T")[0],
    workshop_time: workshop?.time || "08:30 - 12:00 WITA",
    workshop_location: workshop?.location || "Lab Microleading MPI FTK UINAM",
    speaker: workshop?.speaker || "Pemateri Lab Microleading",
    nama: data.nama,
    nim_nip: data.nim_nip,
    instansi: data.instansi || "UIN Alauddin Makassar",
    email: data.email || "",
    whatsapp: data.whatsapp || "",
    alasan: data.alasan || "",
    status: data.status || "terkonfirmasi",
    is_attended: false,
    registered_at: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'registrations'), newRegistration);
      const created = { ...newRegistration, id: docRef.id };
      setStore("mpi_registrations", [created, ...existingList]);
      return created;
    } catch (err) {
      console.warn('⚠️ [Firestore] submitRegistration error, using local fallback:', err.message);
    }
  }

  const localReg = { ...newRegistration, id: `reg_${Date.now()}` };
  setStore("mpi_registrations", [localReg, ...existingList]);
  return localReg;
}

export async function updateRegistrationStatus(id, status, is_attended = null) {
  const updateData = { status };
  if (is_attended !== null) {
    updateData.is_attended = is_attended;
  }
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'registrations', String(id)), updateData);
    } catch (err) {
      console.warn('⚠️ [Firestore] updateRegistrationStatus error:', err.message);
    }
  }
  await delay();
  const list = (getStore("mpi_registrations") || []).map(r =>
    String(r.id) === String(id) ? { ...r, ...updateData } : r
  );
  setStore("mpi_registrations", list);
  return true;
}

export async function deleteRegistration(id) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'registrations', String(id)));
    } catch (err) {
      console.warn('⚠️ [Firestore] deleteRegistration error:', err.message);
    }
  }
  await delay();
  const list = (getStore("mpi_registrations") || []).filter(r => String(r.id) !== String(id));
  setStore("mpi_registrations", list);
  window.dispatchEvent(new CustomEvent('mpi_registrations_updated'));
  return true;
}

export async function findRegistrationByNimOrCode(queryStr, workshopId = null) {
  if (!queryStr) return null;
  const list = await getRegistrations();
  const q = queryStr.trim().toLowerCase();

  return list.find(r => {
    const matchesWorkshop = !workshopId || String(r.workshop_id) === String(workshopId);
    const matchesQuery = (r.nim_nip || '').toLowerCase() === q ||
                         (r.reg_code || '').toLowerCase() === q ||
                         (r.email || '').toLowerCase() === q ||
                         (r.whatsapp || '').replace(/[^0-9]/g, '').endsWith(q.replace(/[^0-9]/g, ''));
    return matchesWorkshop && matchesQuery;
  }) || null;
}

// ========================
// CERTIFICATE SETTINGS
// ========================
export async function getCertSettings() {
  if (isFirebaseConfigured && db) {
    try {
      let snap = await getDoc(doc(db, 'settings', 'cert'));
      if (!snap.exists()) {
        snap = await getDoc(doc(db, 'cert_settings', 'active'));
      }
      if (snap.exists()) {
        const cloudData = snap.data();
        const merged = { ...DEFAULT_CERT_SETTINGS, ...cloudData };
        localStorage.setItem("mpi_cert_settings", JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('⚠️ [Firestore] getCertSettings error:', err.message);
    }
  }
  await delay(10);
  const data = localStorage.getItem("mpi_cert_settings");
  if (!data) {
    localStorage.setItem("mpi_cert_settings", JSON.stringify(DEFAULT_CERT_SETTINGS));
    return DEFAULT_CERT_SETTINGS;
  }
  try {
    return { ...DEFAULT_CERT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_CERT_SETTINGS;
  }
}

export async function updateCertSettings(newSettings) {
  const current = await getCertSettings();
  const merged = { ...current, ...newSettings };
  if (isFirebaseConfigured && db) {
    let saved = false;
    let lastError = null;

    // Coba simpan ke settings/cert
    try {
      await setDoc(doc(db, 'settings', 'cert'), merged, { merge: true });
      saved = true;
      console.log('✅ [Firebase] Pengaturan sertifikat tersimpan ke Firestore (settings/cert)');
    } catch (err) {
      lastError = err;
    }

    // Coba simpan juga ke cert_settings/active
    try {
      await setDoc(doc(db, 'cert_settings', 'active'), merged, { merge: true });
      saved = true;
      console.log('✅ [Firebase] Pengaturan sertifikat tersimpan ke Firestore (cert_settings/active)');
    } catch (err) {
      if (!saved) lastError = err;
    }

    if (!saved && lastError) {
      console.error('❌ [Firestore] Gagal menyimpan ke Firestore:', lastError);
      throw lastError;
    }
  }
  await delay(20);
  localStorage.setItem("mpi_cert_settings", JSON.stringify(merged));
  return merged;
}

// ========================
// NEWS
// ========================
export async function getNews() {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'news'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setStore("mpi_news", list);
        return list;
      }
    } catch (err) {
      console.warn('⚠️ [Firestore] getNews error:', err.message);
    }
  }
  await delay();
  const rawList = getStore("mpi_news") || [];
  const list = rawList.map((n, idx) => ({ ...n, id: n.id || `news_${idx + 1}` }));
  return list.sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));
}

export async function createNews(data) {
  const publishDate = data.date || (data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
  const createdAtIso = data.created_at || new Date(publishDate + 'T12:00:00Z').toISOString();

  const newItem = {
    ...data,
    date: publishDate,
    created_at: createdAtIso
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'news'), newItem);
      const created = { ...newItem, id: docRef.id };
      const current = getStore("mpi_news") || [];
      setStore("mpi_news", [created, ...current]);
      return created;
    } catch (err) {
      console.warn('⚠️ [Firestore] createNews error:', err.message);
    }
  }
  await delay();
  const rawNews = getStore("mpi_news") || [];
  const news = rawNews.map((n, idx) => ({ ...n, id: n.id || `news_${idx + 1}` }));
  const localItem = { ...newItem, id: `news_${Date.now()}` };
  setStore("mpi_news", [localItem, ...news]);
  return localItem;
}

export async function updateNews(id, data) {
  const updatedData = { ...data };
  if (updatedData.date) {
    updatedData.created_at = new Date(updatedData.date + 'T12:00:00Z').toISOString();
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'news', String(id));
      await setDoc(docRef, updatedData, { merge: true });
    } catch (err) {
      console.warn('⚠️ [Firestore] updateNews error:', err.message);
    }
  }
  await delay();
  const rawNews = getStore("mpi_news") || [];
  const news = rawNews.map((n, idx) => ({ ...n, id: n.id || `news_${idx + 1}` }));
  const updatedList = news.map(n => String(n.id) === String(id) ? { ...n, ...updatedData } : n);
  setStore("mpi_news", updatedList);
  return updatedList.find(n => String(n.id) === String(id));
}

export async function deleteNews(id) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'news', String(id)));
    } catch (err) {
      console.warn('⚠️ [Firestore] deleteNews error:', err.message);
    }
  }
  await delay();
  const rawNews = getStore("mpi_news") || [];
  const news = rawNews.map((n, idx) => ({ ...n, id: n.id || `news_${idx + 1}` }));
  setStore("mpi_news", news.filter(n => String(n.id) !== String(id)));
  return true;
}

// ========================
// GALLERY
// ========================
export async function getGallery() {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setStore("mpi_gallery", list);
        return list;
      }
    } catch (err) {
      console.warn('⚠️ [Firestore] getGallery error:', err.message);
    }
  }
  await delay();
  let list = getStore("mpi_gallery");
  if (!Array.isArray(list) || list.length === 0) {
    list = DEFAULT_GALLERY;
    setStore("mpi_gallery", list);
  } else {
    // Normalization: Ensure all items have an id and category
    let changed = false;
    list = list.map((item, idx) => {
      let updated = { ...item };
      if (!updated.id) {
        updated.id = `gal_${idx + 1}_${Date.now()}`;
        changed = true;
      }
      if (!updated.category) {
        updated.category = 'praktikum';
        changed = true;
      }
      return updated;
    });
    if (changed) {
      setStore("mpi_gallery", list);
    }
  }
  return list;
}

export async function addGalleryItem(data) {
  const newItem = {
    ...data,
    category: data.category || 'praktikum',
    timestamp: data.timestamp || new Date().toISOString()
  };
  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'gallery'), newItem);
      const created = { ...newItem, id: docRef.id };
      const current = getStore("mpi_gallery") || [];
      const updated = [created, ...current];
      setStore("mpi_gallery", updated);
      window.dispatchEvent(new CustomEvent('mpi_gallery_updated', { detail: updated }));
      return created;
    } catch (err) {
      console.warn('⚠️ [Firestore] addGalleryItem error:', err.message);
    }
  }
  await delay();
  const gallery = getStore("mpi_gallery") || [];
  const localItem = { ...newItem, id: `gal_${Date.now()}` };
  const updated = [localItem, ...gallery];
  setStore("mpi_gallery", updated);
  window.dispatchEvent(new CustomEvent('mpi_gallery_updated', { detail: updated }));
  return localItem;
}

export async function deleteGalleryItem(id) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'gallery', String(id)));
    } catch (err) {
      console.warn('⚠️ [Firestore] deleteGalleryItem error:', err.message);
    }
  }
  await delay();
  const current = getStore("mpi_gallery") || [];
  const updated = current.filter(g =>
    String(g.id) !== String(id) &&
    g.name !== id &&
    g.path !== id
  );
  setStore("mpi_gallery", updated);
  window.dispatchEvent(new CustomEvent('mpi_gallery_updated', { detail: updated }));
  return true;
}

// ========================
// MEMBERS / ANGGOTA LAB
// ========================
export async function getMembers() {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'members'));
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
        setStore("mpi_members", list);
        return list;
      }
    } catch (err) {
      console.warn('⚠️ [Firestore] getMembers error:', err.message);
    }
  }
  await delay();
  const stored = getStore("mpi_members");
  return stored.length > 0 ? stored : DEFAULT_MEMBERS;
}

export async function createMember(data) {
  const currentMembers = await getMembers();
  const newOrder = data.order || (currentMembers.length + 1);
  const newMemberData = {
    ...data,
    order: newOrder,
    status: data.status || 'aktif',
    created_at: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'members'), newMemberData);
      const created = { ...newMemberData, id: docRef.id };
      setStore("mpi_members", [...currentMembers, created]);
      window.dispatchEvent(new Event('mpi_members_updated'));
      return created;
    } catch (err) {
      console.warn('⚠️ [Firestore] createMember error:', err.message);
    }
  }

  await delay();
  const created = { ...newMemberData, id: `mbr_${Date.now()}` };
  setStore("mpi_members", [...currentMembers, created]);
  window.dispatchEvent(new Event('mpi_members_updated'));
  return created;
}

export async function updateMember(id, data) {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'members', String(id));
      await updateDoc(docRef, data);
    } catch (err) {
      console.warn('⚠️ [Firestore] updateMember error:', err.message);
    }
  }
  await delay();
  const members = getStore("mpi_members").map(m => String(m.id) === String(id) ? { ...m, ...data } : m);
  setStore("mpi_members", members);
  window.dispatchEvent(new Event('mpi_members_updated'));
  return members.find(m => String(m.id) === String(id));
}

export async function deleteMember(id) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'members', String(id)));
    } catch (err) {
      console.warn('⚠️ [Firestore] deleteMember error:', err.message);
    }
  }
  await delay();
  const members = getStore("mpi_members").filter(m => String(m.id) !== String(id));
  setStore("mpi_members", members);
  window.dispatchEvent(new Event('mpi_members_updated'));
  return true;
}

export async function saveMembersOrder(newMembersList) {
  const updatedWithOrder = newMembersList.map((m, idx) => ({ ...m, order: idx + 1 }));
  setStore("mpi_members", updatedWithOrder);
  window.dispatchEvent(new Event('mpi_members_updated'));

  if (isFirebaseConfigured && db) {
    try {
      for (const m of updatedWithOrder) {
        if (m.id) {
          const docRef = doc(db, 'members', String(m.id));
          await setDoc(docRef, m, { merge: true });
        }
      }
    } catch (err) {
      console.warn('⚠️ [Firestore] saveMembersOrder error:', err.message);
    }
  }
  return updatedWithOrder;
}

// ========================
// COURSES / KELAS
// ========================
export async function getCourses() {
  await delay();
  return getStore("mpi_courses").filter(c => c.status === "approved");
}

export async function getAllCourses() {
  await delay();
  return getStore("mpi_courses");
}

export async function createCourse(data) {
  await delay();
  const courses = getStore("mpi_courses");
  const newCourse = { ...data, id: Date.now(), status: "approved" };
  setStore("mpi_courses", [...courses, newCourse]);
  return newCourse;
}

export async function deleteCourse(id) {
  await delay();
  setStore("mpi_courses", getStore("mpi_courses").filter(c => String(c.id) !== String(id)));
  return true;
}

// ========================
// AUTH
// ========================
export async function loginUser(username, password) {
  await delay(100);

  // 1. Cek dari Cloud Firestore jika terhubung
  if (isFirebaseConfigured && db) {
    try {
      const authSnap = await getDoc(doc(db, 'settings', 'admin_auth'));
      if (authSnap.exists()) {
        const cloudAuth = authSnap.data();
        if (cloudAuth.username === username && cloudAuth.password === password) {
          return { id: 1, username: cloudAuth.username, role: 'admin' };
        }
      }
    } catch (err) {
      console.warn('⚠️ [Firestore] loginUser check cloud auth error:', err.message);
    }
  }

  // 2. Fallback ke LocalStorage
  const users = getStore("mpi_users");
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) throw new Error("Username atau password salah");
  const { password: _, ...safeUser } = user;
  return safeUser;
}

export async function changeAdminPassword(currentPassword, newPassword) {
  await delay(100);

  // 1. Validasi password saat ini
  let isValid = false;
  let adminUsername = "admin";

  if (isFirebaseConfigured && db) {
    try {
      const authSnap = await getDoc(doc(db, 'settings', 'admin_auth'));
      if (authSnap.exists()) {
        const cloudAuth = authSnap.data();
        adminUsername = cloudAuth.username || "admin";
        if (cloudAuth.password === currentPassword) {
          isValid = true;
        }
      }
    } catch (err) {
      console.warn('⚠️ [Firestore] changeAdminPassword check error:', err.message);
    }
  }

  if (!isValid) {
    const users = getStore("mpi_users");
    const adminUser = users.find(u => u.role === "admin");
    if (adminUser && adminUser.password === currentPassword) {
      isValid = true;
      adminUsername = adminUser.username;
    }
  }

  if (!isValid) {
    throw new Error("Password saat ini salah! Harap periksa kembali.");
  }

  if (!newPassword || newPassword.length < 5) {
    throw new Error("Password baru minimal harus 5 karakter.");
  }

  // 2. Simpan password baru ke Cloud Firestore
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'settings', 'admin_auth'), {
        username: adminUsername,
        password: newPassword,
        updated_at: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('⚠️ [Firestore] Gagal update password admin di Cloud:', err.message);
    }
  }

  // 3. Simpan password baru ke LocalStorage
  const users = getStore("mpi_users");
  const updatedUsers = users.map(u => u.role === "admin" ? { ...u, password: newPassword } : u);
  setStore("mpi_users", updatedUsers);

  return true;
}

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("mpi_current_user")); } catch { return null; }
}

export function setCurrentUser(user) {
  localStorage.setItem("mpi_current_user", JSON.stringify(user));
}

export function clearCurrentUser() {
  localStorage.removeItem("mpi_current_user");
}

export function isAdmin() {
  const user = getCurrentUser();
  return user?.role === "admin";
}
