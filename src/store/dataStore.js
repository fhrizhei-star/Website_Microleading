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
    title: "Workshop Penulisan Karya Tulis Ilmiah & Publikasi Jurnal Nasional",
    speaker: "Dr. H. Muhammad Ilyas, M.Pd.",
    date: "2026-10-26",
    time: "08:30 - 12:00 WITA",
    location: "Laboratorium Microleading MPI",
    description: "Pelatihan teknis penyusunan naskah artikel jurnal, sitasi akademik, dan kiat tembus jurnal SINTA terakreditasi.",
    status: "open",
    cert_bg: null,
    cert_layout: null,
  },
  {
    title: "Pelatihan Public Speaking & Leadership Santri Modern",
    speaker: "Ustadz Rahmat Hidayat, M.I.Kom.",
    date: "2026-10-28",
    time: "09:00 - 12:00 WITA",
    location: "Aula FTK Kampus II UINAM",
    description: "Meningkatkan kemampuan komunikasi vokal, retorika panggung, dan seni berbicara persuasif bagi calon pendidik.",
    status: "open",
    cert_bg: null,
    cert_layout: null,
  },
  {
    title: "Workshop Pemanfaatan AI & Media Digital dalam Pembelajaran Islam",
    speaker: "Fahri Pratama, S.Kom., M.T.",
    date: "2026-10-30",
    time: "08:30 - 11:30 WITA",
    location: "Lab Komputer & Multimedia MPI",
    description: "Pengenalan teknologi AI etis dan pembuatan media ajar berbasis web interaktif untuk pendidik era digital.",
    status: "open",
    cert_bg: null,
    cert_layout: null,
  },
];

const DEFAULT_ATTENDANCE = [
  {
    id: "attn_1",
    workshop_id: 1,
    workshop_title: "Workshop Penulisan Karya Tulis Ilmiah & Publikasi Jurnal Nasional",
    speaker: "Dr. H. Muhammad Ilyas, M.Pd.",
    workshop_date: "2026-10-26",
    nama: "Ahmad Rizky Pratama, S.Pd.",
    identitas: "20400121045",
    instansi: "UIN Alauddin Makassar",
    email: "ahmad.rizky@gmail.com",
    whatsapp: "081234567890",
    kesan: "Materi sangat aplikatif dan membantu persiapan publikasi skripsi.",
    cert_number: "CERT/MPI/2026/0142",
    cert_bg: "/img/cert-template.jpg",
    cert_layout: {
      top: 48,
      left: 50,
      fontSize: 34,
      fontFamily: "'Playfair Display', Georgia, serif",
      color: "#854d0e",
      fontWeight: "700",
      underline: false,
    },
    drive_url: "https://drive.google.com/drive/folders/1EXAMPLE_DRIVE_FOLDER_ID",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

const DEFAULT_NEWS = [
  {
    title: "Pembukaan Praktikum Laboratorium Microleading Semester Baru",
    content: "Laboratorium Manajemen Pendidikan Islam (MPI) resmi membuka sesi praktikum baru. Mahasiswa dapat melihat jadwal kelas serta silabus pembelajaran interaktif di laboratorium.",
    image_path: "/img/bg.jpg",
    created_at: new Date().toISOString(),
  },
  {
    title: "Workshop Penulisan Karya Tulis Ilmiah Nasional",
    content: "Akan diadakan bimbingan intensif penulisan dan publikasi sitasi jurnal ilmiah bagi seluruh mahasiswa tingkat akhir di aula laboratorium.",
    image_path: "/img/campus1.jpg",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
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
    const wsSnap = await getDocs(collection(db, 'workshops'));
    if (wsSnap.empty) {
      console.log('🌱 [Firebase] Seeding data awal workshops...');
      for (const w of DEFAULT_WORKSHOPS) {
        await addDoc(collection(db, 'workshops'), { ...w, created_at: new Date().toISOString() });
      }
    }

    const newsSnap = await getDocs(collection(db, 'news'));
    if (newsSnap.empty) {
      console.log('🌱 [Firebase] Seeding data awal news...');
      for (const n of DEFAULT_NEWS) {
        await addDoc(collection(db, 'news'), n);
      }
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
  initStorage("mpi_workshops", DEFAULT_WORKSHOPS);
  initStorage("mpi_attendance", DEFAULT_ATTENDANCE);
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
// WORKSHOPS
// ========================
export async function getWorkshops() {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'workshops'), where('status', '==', 'open'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('⚠️ [Firestore] getWorkshops error:', err.message);
    }
  }
  await delay();
  return getStore("mpi_workshops").filter(w => w.status === "open");
}

export async function getAllWorkshops() {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'workshops'));
      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setStore("mpi_workshops", list);
        return list;
      }
    } catch (err) {
      console.warn('⚠️ [Firestore] getAllWorkshops error:', err.message);
    }
  }
  await delay();
  return getStore("mpi_workshops");
}

export async function createWorkshop(data) {
  const newWData = { ...data, status: data.status || "open", created_at: new Date().toISOString() };
  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'workshops'), newWData);
      const created = { ...newWData, id: docRef.id };
      const workshops = getStore("mpi_workshops");
      setStore("mpi_workshops", [...workshops, created]);
      return created;
    } catch (err) {
      console.warn('⚠️ [Firestore] createWorkshop error:', err.message);
    }
  }
  await delay();
  const workshops = getStore("mpi_workshops");
  const newW = { ...newWData, id: `ws_${Date.now()}` };
  setStore("mpi_workshops", [...workshops, newW]);
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
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setStore("mpi_attendance", records);
      }
    } catch (err) {
      console.warn('⚠️ [Firestore] getAttendance error:', err.message);
    }
  }

  if (records.length === 0) {
    await delay();
    records = getStore("mpi_attendance");
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

  const certNum = `CERT/MPI/${new Date().getFullYear()}/${String(records.length + 1).padStart(4, "0")}`;
  const newRecord = {
    workshop_id: data.workshop_id,
    workshop_title: workshop?.title || "Workshop Lab Microleading",
    workshop_date: workshop?.date || new Date().toISOString().split("T")[0],
    speaker: workshop?.speaker || "Pemateri Lab Microleading",
    cert_bg: workshop?.cert_bg || certSettings?.template_bg || "/img/cert-template.jpg",
    cert_layout: workshop?.cert_layout || {
      top: certSettings.top,
      left: certSettings.left,
      fontSize: certSettings.fontSize,
      fontFamily: certSettings.fontFamily,
      color: certSettings.color,
      fontWeight: certSettings.fontWeight,
      underline: certSettings.underline,
    },
    drive_url: certSettings?.drive_folder_url || null,
    drive_webhook_url: certSettings?.drive_webhook_url || null,
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
      return created;
    } catch (err) {
      console.warn('⚠️ [Firestore] submitAttendance error:', err.message);
    }
  }

  const localRecord = { ...newRecord, id: `attn_${Date.now()}` };
  setStore("mpi_attendance", [localRecord, ...records]);
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
  return getStore("mpi_news").sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function createNews(data) {
  const newItem = { ...data, created_at: new Date().toISOString() };
  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'news'), newItem);
      const created = { ...newItem, id: docRef.id };
      setStore("mpi_news", [created, ...getStore("mpi_news")]);
      return created;
    } catch (err) {
      console.warn('⚠️ [Firestore] createNews error:', err.message);
    }
  }
  await delay();
  const news = getStore("mpi_news");
  const localItem = { ...newItem, id: `news_${Date.now()}` };
  setStore("mpi_news", [localItem, ...news]);
  return localItem;
}

export async function updateNews(id, data) {
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'news', String(id)), data);
    } catch (err) {
      console.warn('⚠️ [Firestore] updateNews error:', err.message);
    }
  }
  await delay();
  const news = getStore("mpi_news").map(n => String(n.id) === String(id) ? { ...n, ...data } : n);
  setStore("mpi_news", news);
  return news.find(n => String(n.id) === String(id));
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
  setStore("mpi_news", getStore("mpi_news").filter(n => String(n.id) !== String(id)));
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
