import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Newspaper, Images, Award,
  LogOut, Menu, X, Plus, Trash2, Edit3, Check, XCircle,
  Calendar, Upload, Sliders, HardDrive, ExternalLink, Save,
  FileText, CheckCircle2, Copy, Eye, RefreshCw, Sparkles,
  FolderOpen, Zap, Clock, MapPin, Download, Filter, Search,
  CheckCircle, ArrowRight, Wand2, MousePointer, Share2,
  UserPlus, GraduationCap, TrendingUp, Activity, Star,
  Bell, BarChart2, PieChart, ChevronLeft, ChevronRight,
  BookOpen, Shield, Layers, Target, Cpu, Globe, KeyRound, Lock,
  ClipboardCheck
} from 'lucide-react';
import {
  getAllWorkshops, getAttendance, getNews, getGallery, getMembers,
  createWorkshop, updateWorkshop, deleteWorkshop, createNews, deleteNews,
  addGalleryItem, deleteGalleryItem,
  createMember, updateMember, deleteMember, saveMembersOrder,
  deleteAttendance, updateAttendanceDriveUrl, getCertSettings, updateCertSettings,
  getCurrentUser, clearCurrentUser, getFirebaseStatus, changeAdminPassword,
  getRegistrations, deleteRegistration, updateRegistrationStatus
} from '../store/dataStore';
import { exportStyledExcel, exportSingleRegistrationExcel } from '../utils/excelExport';
import { useNavigate } from 'react-router-dom';
import { playClick, playSuccess, playError } from '../utils/audio';
import { showAlert, showConfirm, showToast } from '../components/common/CoolAlert';

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'members', label: 'Team', icon: UserPlus },
  { id: 'calendar', label: 'Kalender', icon: Calendar },
  { id: 'workshops', label: 'Workshop', icon: BookOpen },
  { id: 'registrations', label: 'Pendaftaran', icon: ClipboardCheck },
  { id: 'attendance', label: 'Presensi', icon: Users },
  { id: 'analytics', label: 'Analitik', icon: BarChart2 },
  { id: 'certificates', label: 'Sertifikat', icon: Award },
  { id: 'news', label: 'Berita', icon: Newspaper },
  { id: 'gallery', label: 'Galeri', icon: Images },
  { id: 'settings', label: 'Pengaturan', icon: Sliders },
];

// Time slot options for workshop dropdown
const TIME_SLOTS = [
  '07:00 - 09:00 WITA',
  '07:30 - 09:30 WITA',
  '08:00 - 10:00 WITA',
  '08:00 - 10:30 WITA',
  '08:30 - 11:00 WITA',
  '08:30 - 12:00 WITA',
  '09:00 - 11:00 WITA',
  '09:00 - 12:00 WITA',
  '10:00 - 12:00 WITA',
  '10:00 - 12:30 WITA',
  '13:00 - 15:00 WITA',
  '13:00 - 15:30 WITA',
  '13:30 - 15:30 WITA',
  '13:30 - 16:00 WITA',
  '13:30 - 16:30 WITA',
  '14:00 - 16:00 WITA',
  '14:00 - 16:30 WITA',
  '08:00 - 12:00 WITA',
  '08:30 - 16:30 WITA',
  '08:00 - 17:00 WITA',
  '19:00 - 21:00 WITA',
  '19:30 - 21:30 WITA',
];

function StatCard({ label, value, icon: Icon, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bento-card rounded-2xl p-4 sm:p-5 flex items-center gap-4 cursor-pointer hover:border-purple-300 transition-all group min-w-0"
    >
      <div className={`w-12 h-12 rounded-xl ${color} text-white flex items-center justify-center shadow-lg shrink-0 group-hover:scale-105 transition-transform`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display font-extrabold text-2xl text-slate-900 leading-none truncate">{value}</p>
        <p className="text-xs text-slate-500 font-semibold mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

// ==========================================
// 1. Studio Desain Sertifikat & Google Drive
// (With Interactive Click-to-Place & Auto Cleaners)
// ==========================================
function CertificateStudioPanel() {
  const [settings, setSettings] = useState({
    template_bg: '/img/cert-template.jpg',
    top: 48,
    left: 50,
    fontSize: 34,
    fontFamily: "'Playfair Display', Georgia, serif",
    color: '#854d0e',
    fontWeight: '700',
    underline: false,
    orientation: 'landscape',
    drive_folder_url: 'https://drive.google.com/drive/folders/1EXAMPLE_DRIVE_FOLDER_ID',
    drive_webhook_url: '',
  });

  const [globalSettings, setGlobalSettings] = useState(null);
  const [workshops, setWorkshops] = useState([]);
  const [targetWorkshopId, setTargetWorkshopId] = useState('global');
  const [sampleName, setSampleName] = useState('Ahmad Rizky Pratama, S.Pd.');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptGuide, setShowScriptGuide] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function load() {
      const data = await getCertSettings();
      if (data) {
        setSettings(data);
        setGlobalSettings(data);
      }
      const wsList = await getAllWorkshops();
      setWorkshops(wsList || []);
    }
    load();
  }, []);

  // Ganti target sertifikat (Template Umum vs Khusus Workshop)
  const handleSwitchTarget = (targetId) => {
    playClick();
    setTargetWorkshopId(targetId);
    setSaveMessage(null);
    if (targetId === 'global') {
      if (globalSettings) {
        setSettings(globalSettings);
      }
    } else {
      const ws = workshops.find((w) => String(w.id) === String(targetId));
      if (ws) {
        if (ws.cert_bg) {
          setSettings({
            template_bg: ws.cert_bg,
            top: ws.cert_layout?.top ?? 48,
            left: ws.cert_layout?.left ?? 50,
            fontSize: ws.cert_layout?.fontSize ?? 34,
            fontFamily: ws.cert_layout?.fontFamily ?? "'Playfair Display', Georgia, serif",
            color: ws.cert_layout?.color ?? '#854d0e',
            fontWeight: ws.cert_layout?.fontWeight ?? '700',
            underline: ws.cert_layout?.underline ?? false,
            orientation: ws.cert_layout?.orientation ?? 'landscape',
            drive_folder_url: ws.drive_folder_url || globalSettings?.drive_folder_url || '',
            drive_webhook_url: ws.drive_webhook_url || globalSettings?.drive_webhook_url || '',
          });
        } else {
          // Belum punya template khusus, warisi template global saat ini sebagai dasar
          setSettings({
            ...(globalSettings || settings),
            orientation: globalSettings?.orientation || 'landscape',
          });
        }
      }
    }
  };

  // Reset workshop ke template umum lab
  const handleResetWorkshopToDefault = async () => {
    const ok = await showConfirm({
      title: 'Kembalikan ke Template Default?',
      message: 'Template sertifikat khusus untuk workshop ini akan dihapus dan kembali mengikuti Template Umum Lab.',
      confirmText: 'Ya, Reset',
      type: 'warning',
    });
    if (!ok) return;
    await updateWorkshop(targetWorkshopId, { cert_bg: null, cert_layout: null });
    const wsList = await getAllWorkshops();
    setWorkshops(wsList);
    if (globalSettings) setSettings(globalSettings);
    playSuccess();
    setSaveMessage({
      type: 'success',
      text: 'Template workshop berhasil direset dan kini otomatis mengikuti Template Umum Lab!',
    });
  };

  const handleUploadImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showAlert('Harap pilih file gambar resmi yang valid (JPG, PNG, atau WebP)!', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Deteksi otomatis orientasi: Portrait jika tinggi > lebar, sebaliknya Landscape
          const isImgPortrait = img.height > img.width;
          const detectedOrientation = isImgPortrait ? 'portrait' : 'landscape';

          // Kompresi otomatis via canvas agar pas di Firestore (< 1MB) tanpa pecah
          const canvas = document.createElement('canvas');
          const maxDim = 1600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setSettings((prev) => ({
            ...prev,
            template_bg: compressedDataUrl,
            orientation: detectedOrientation,
          }));
          playSuccess();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveMessage(null);
    try {
      if (targetWorkshopId === 'global') {
        await updateCertSettings(settings);
        setGlobalSettings(settings);
        playSuccess();
        setSaveMessage({
          type: 'success',
          text: 'Pengaturan Template Umum Lab berhasil tersimpan di Cloud Firebase (koleksi: cert_settings) dan penyimpanan lokal!'
        });
      } else {
        const payload = {
          cert_bg: settings.template_bg,
          cert_layout: {
            top: settings.top,
            left: settings.left,
            fontSize: settings.fontSize,
            fontFamily: settings.fontFamily,
            color: settings.color,
            fontWeight: settings.fontWeight,
            underline: settings.underline,
            orientation: settings.orientation || 'landscape',
          },
          drive_folder_url: settings.drive_folder_url || '',
          drive_webhook_url: settings.drive_webhook_url || '',
        };
        await updateWorkshop(targetWorkshopId, payload);
        const wsList = await getAllWorkshops();
        setWorkshops(wsList);
        const ws = wsList.find((w) => String(w.id) === String(targetWorkshopId));
        playSuccess();
        setSaveMessage({
          type: 'success',
          text: `Template sertifikat khusus untuk kegiatan "${ws?.title || 'Workshop'}" berhasil disimpan!`
        });
      }
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err) {
      playError();
      setSaveMessage({
        type: 'error',
        text: 'Gagal menyimpan ke Firebase Firestore: ' + (err.message || 'Periksa koneksi.')
      });
    } finally {
      setSaveLoading(false);
    }
  };



  // Automated Color Presets
  const applyColorPreset = (color) => {
    playClick();
    setSettings(s => ({ ...s, color }));
  };

  // Interactive Click-to-Place on Canvas (Huge Automation!)
  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const leftPercent = Math.round((clickX / rect.width) * 100);
    const topPercent = Math.round((clickY / rect.height) * 100);

    const boundLeft = Math.max(10, Math.min(90, leftPercent));
    const boundTop = Math.max(10, Math.min(90, topPercent));

    setSettings(s => ({ ...s, left: boundLeft, top: boundTop }));
    playClick();
  };

  // Auto-detect Google Drive Folder ID
  const detectedFolderId = settings.drive_folder_url?.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] ||
    settings.drive_folder_url?.match(/id=([a-zA-Z0-9_-]+)/)?.[1];

  // Smart URL Cleaner
  const handleDriveUrlChange = (val) => {
    let clean = val.trim();
    // If raw ID was pasted, turn it into full link
    if (clean && !clean.startsWith('http') && clean.length > 20) {
      clean = `https://drive.google.com/drive/folders/${clean}`;
    }
    setSettings(s => ({ ...s, drive_folder_url: clean }));
  };

  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testWebhookNotice, setTestWebhookNotice] = useState(null);

  const copyGoogleAppsScript = () => {
    const scriptCode = `// Google Apps Script: Auto-Upload & Single-File Preview Lab MPI ke Google Drive
function doPost(e) {
  try {
    var contents = e.postData ? e.postData.contents : "";
    var data = JSON.parse(contents);
    var folderId = data.folderId || "${detectedFolderId || ''}";
    var folder;
    
    // Cari folder tujuan di Google Drive (fallback ke folder utama jika ID belum disetel)
    if (folderId && folderId !== "MASUKKAN_FOLDER_ID_ANDA") {
      try {
        folder = DriveApp.getFolderById(folderId);
      } catch (fErr) {
        folder = DriveApp.getRootFolder();
      }
    } else {
      folder = DriveApp.getRootFolder();
    }
    
    var decoded = Utilities.base64Decode(data.base64);
    var namaClean = (data.nama || "Peserta").replace(/[\\/:*?"<>|]/g, "").trim();

    // 1. Simpan format Gambar (.JPG) - Tampil instan di Google Drive tanpa jeda preview
    var imgBlob = Utilities.newBlob(decoded, "image/jpeg", "Sertifikat - " + namaClean + ".jpg");
    var fileImg = folder.createFile(imgBlob);
    fileImg.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // 2. Simpan juga Dokumen PDF Resmi (.PDF Asli yang Valid)
    try {
      var html = '<!DOCTYPE html><html><head><style>@page{size:landscape;margin:0;}body{margin:0;padding:0;display:flex;align-items:center;justify-content:center;}img{width:100vw;height:100vh;object-fit:contain;}</style></head><body><img src="data:image/jpeg;base64,' + data.base64 + '"></body></html>';
      var pdfBlob = Utilities.newBlob(html, "text/html", "cert.html").getAs("application/pdf").setName("Sertifikat - " + namaClean + ".pdf");
      var filePdf = folder.createFile(pdfBlob);
      filePdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (pdfErr) {}
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      url: fileImg.getUrl(),
      fileId: fileImg.getId()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Buka Preview Google Drive Terisolasi Khusus File Nama Peserta (Tanpa Akses File Lain)
function doGet(e) {
  var nama = (e.parameter.nama || e.parameter.name || "").trim();
  var folderId = e.parameter.folderId || "${detectedFolderId || ''}";
  var namaClean = nama.replace(/[\\/:*?"<>|]/g, "").trim();

  if (namaClean && folderId) {
    try {
      var folder = DriveApp.getFolderById(folderId);
      // Cari file sertifikat spesifik milik nama peserta ini
      var files = folder.searchFiles("title contains '" + namaClean + "' and mimeType = 'image/jpeg' and trashed = false");
      if (!files.hasNext()) {
        files = folder.searchFiles("title contains '" + namaClean + "' and trashed = false");
      }
      if (files.hasNext()) {
        var file = files.next();
        var fileViewUrl = "https://drive.google.com/file/d/" + file.getId() + "/view";
        return HtmlService.createHtmlOutput(
          '<!DOCTYPE html><html><head>' +
          '<meta http-equiv="refresh" content="0;url=' + fileViewUrl + '">' +
          '<script>window.location.replace("' + fileViewUrl + '");</script>' +
          '</head><body style="background:#111;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">' +
          '<p>Membuka Preview Sertifikat Resmi Google Drive: ' + file.getName() + '...</p>' +
          '</body></html>'
        );
      }
    } catch (err) {}
  }

  // Jika belum ditemukan, arahkan ke pencarian Google Drive terfilter nama peserta saja
  var filterUrl = "https://drive.google.com/drive/folders/" + folderId + "?q=name%20contains%20%27" + encodeURIComponent(namaClean) + "%27";
  return HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><head>' +
    '<meta http-equiv="refresh" content="0;url=' + filterUrl + '">' +
    '<script>window.location.replace("' + filterUrl + '");</script>' +
    '</head><body></body></html>'
  );
}`;
    navigator.clipboard?.writeText(scriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleTestWebhook = async () => {
    if (!settings.drive_webhook_url) {
      showAlert({
        title: 'Tautan Webhook Belum Ada',
        message: 'Harap isi URL Google Apps Script Webhook terlebih dahulu sebelum menguji koneksi.',
        type: 'warning',
      });
      return;
    }
    setTestingWebhook(true);
    setTestWebhookNotice(null);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 850;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fefce8';
      ctx.fillRect(0, 0, 1200, 850);
      ctx.fillStyle = '#854d0e';
      ctx.font = 'bold 36px serif';
      ctx.textAlign = 'center';
      ctx.fillText('SERTIFIKAT UJI COBA OTOMASI GOOGLE DRIVE', 600, 380);
      ctx.font = '28px sans-serif';
      ctx.fillText('Ahmad Rizky Pratama, S.Pd. — ' + new Date().toLocaleDateString('id-ID'), 600, 460);

      const base64Data = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];

      await fetch(settings.drive_webhook_url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          nama: 'Ahmad Rizky Pratama (Tes Otomasi)',
          folderId: detectedFolderId || '',
          base64: base64Data,
          mimeType: 'image/jpeg'
        })
      });
      playSuccess();
      setTestWebhookNotice({
        type: 'success',
        text: '✓ Permintaan berhasil dikirim ke Webhook Google Apps Script! Buka folder Google Drive Anda sekarang untuk memeriksa file "Sertifikat - Ahmad Rizky Pratama (Tes Otomasi).jpg".'
      });
    } catch (err) {
      playError();
      setTestWebhookNotice({
        type: 'error',
        text: 'Gagal mengirim ke Webhook: ' + err.message
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900">
            Desain Sertifikat
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Unggah template sertifikat, atur posisi nama peserta, dan sinkronkan tautan Google Drive dengan Cloud Firestore.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Cloud Firestore: Koleksi cert_settings
        </span>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold transition-all ${saveMessage.type === 'success'
          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-sm'
          : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <XCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{saveMessage.text}</span>
        </div>
      )}

      {/* Target Pelatihan / Workshop Selector */}
      <div className="bento-card rounded-2xl p-4 sm:p-5 border-2 border-purple-200/90 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Award className="text-purple-600 shrink-0" size={18} />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Target Pengaturan Sertifikat</h3>
            {targetWorkshopId === 'global' ? (
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                🌐 Template Umum Lab (Default)
              </span>
            ) : (
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                🎯 Khusus Workshop: {workshops.find((w) => String(w.id) === String(targetWorkshopId))?.title}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {targetWorkshopId === 'global'
              ? 'Template sertifikat standar lab. Setiap pelatihan yang belum memiliki template gambar khusus akan otomatis menggunakan template ini.'
              : 'Mengatur gambar template & posisi nama khusus untuk workshop ini. Peserta yang hadir di kegiatan ini akan otomatis mendapatkan sertifikat khusus ini.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <select
            value={targetWorkshopId}
            onChange={(e) => handleSwitchTarget(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border-2 border-purple-300 text-xs font-bold text-slate-800 bg-white shadow-xs focus:ring-2 focus:ring-purple-400 focus:outline-none max-w-xs truncate cursor-pointer"
          >
            <option value="global">🌐 Template Umum Lab (Default)</option>
            {workshops.map((w) => (
              <option key={w.id} value={w.id}>
                🎯 {w.title} {w.cert_bg ? '★ (Khusus)' : ''}
              </option>
            ))}
          </select>

          {targetWorkshopId !== 'global' && workshops.find((w) => String(w.id) === String(targetWorkshopId))?.cert_bg && (
            <button
              type="button"
              onClick={handleResetWorkshopToDefault}
              className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
              title="Hapus template kustom dan kembali ikuti template umum lab"
            >
              Reset ke Default
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls */}
        <form onSubmit={handleSave} className="xl:col-span-6 space-y-5">
          {/* 1. Template Background */}
          <div className="bento-card rounded-2xl p-4 sm:p-5 border border-purple-200 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Upload size={15} className="text-purple-600" />
                1. Template Desain Sertifikat (Gambar)
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                settings.orientation === 'portrait'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}>
                {settings.orientation === 'portrait' ? '📄 Portrait (Tegak)' : '📜 Landscape (Mendatar)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unggah file gambar template sertifikat (JPG/PNG). Sistem hanya akan menempelkan <strong>nama peserta</strong> di atas template ini.
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="btn-shimmer cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all">
                <Upload size={13} />
                Unggah Template Baru
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  className="hidden"
                />
              </label>

              {/* Template Presets */}
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, template_bg: '/img/cert-template.jpg', orientation: 'landscape' }))}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Template Gold Standar (Landscape)
              </button>
            </div>

            {/* Pilihan Orientasi Manual */}
            <div className="pt-2 border-t border-purple-100 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs font-bold text-slate-700">Orientasi Dokumen PDF:</span>
              <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, orientation: 'landscape' }))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    settings.orientation !== 'portrait'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📜 Landscape (Mendatar)
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, orientation: 'portrait' }))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    settings.orientation === 'portrait'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📄 Portrait (Tegak)
                </button>
              </div>
            </div>
          </div>

          {/* 2. Position & Font Settings (with Automation Presets & Click-to-Place!) */}
          <div className="bento-card rounded-2xl p-4 sm:p-5 border border-purple-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders size={15} className="text-purple-600" />
                2. Atur Posisi & Tampilan Nama Peserta
              </h3>
              <span className="text-[10px] text-purple-700 bg-purple-50 font-bold px-2 py-0.5 rounded-md border border-purple-200">
                Tata Letak
              </span>
            </div>

            {/* Vertical Position */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Posisi Vertikal (Atas/Bawah - Y)</span>
                <span className="font-mono text-purple-700 font-bold">{settings.top}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={settings.top}
                onChange={(e) => setSettings((s) => ({ ...s, top: Number(e.target.value) }))}
                className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Horizontal Position */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Posisi Horizontal (Kiri/Kanan - X)</span>
                <span className="font-mono text-purple-700 font-bold">{settings.left}%</span>
              </div>
              <input
                type="range"
                min="15"
                max="85"
                value={settings.left}
                onChange={(e) => setSettings((s) => ({ ...s, left: Number(e.target.value) }))}
                className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Font Size */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Ukuran Huruf (Font Size)</span>
                <span className="font-mono text-purple-700 font-bold">{settings.fontSize}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="65"
                value={settings.fontSize}
                onChange={(e) => setSettings((s) => ({ ...s, fontSize: Number(e.target.value) }))}
                className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
            </div>

            {/* Quick Color Palette */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Palet Warna Populer:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { name: 'Gold Elegan', hex: '#854d0e' },
                  { name: 'Navy Akademik', hex: '#1e3a8a' },
                  { name: 'Emerald', hex: '#065f46' },
                  { name: 'Hitam Formal', hex: '#0f172a' },
                  { name: 'Purple Lab', hex: '#581c87' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => applyColorPreset(c.hex)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${settings.color.toLowerCase() === c.hex.toLowerCase()
                      ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family & Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Gaya Huruf (Font)</label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => setSettings((s) => ({ ...s, fontFamily: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200 text-xs bg-white font-medium"
                >
                  <option value="'Playfair Display', Georgia, serif">Playfair Display (Serif Elegan)</option>
                  <option value="'Cinzel', serif">Cinzel (Prestisius Akademik)</option>
                  <option value="'Great Vibes', cursive">Great Vibes (Kaligrafi Mewah)</option>
                  <option value="'Outfit', sans-serif">Outfit (Modern Sans)</option>
                  <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans (Formal)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Warna Huruf Kustom</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.color}
                    onChange={(e) => setSettings((s) => ({ ...s, color: e.target.value }))}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-purple-200 p-0.5 shrink-0"
                  />
                  <input
                    type="text"
                    value={settings.color}
                    onChange={(e) => setSettings((s) => ({ ...s, color: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg border border-purple-200 text-xs font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Text Style Checkbox */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.fontWeight === '700'}
                  onChange={(e) => setSettings((s) => ({ ...s, fontWeight: e.target.checked ? '700' : '400' }))}
                  className="rounded text-purple-600"
                />
                Tebal (Bold)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.underline}
                  onChange={(e) => setSettings((s) => ({ ...s, underline: e.target.checked }))}
                  className="rounded text-purple-600"
                />
                Garis Bawah (Underline)
              </label>
            </div>
          </div>

          {/* 3. Google Drive Integration (with Auto Parser) */}
          <div className="bento-card rounded-2xl p-4 sm:p-5 border border-purple-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <HardDrive size={15} className="text-purple-600" />
              3. Tautan Folder Google Drive Lab
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Folder Google Drive ini digunakan sebagai repositori cloud utama untuk arsip otomatis sertifikat peserta yang terhubung via Webhook.
            </p>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Link Folder Google Drive
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={settings.drive_folder_url}
                  onChange={(e) => handleDriveUrlChange(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-xs bg-white font-mono min-w-0"
                />
                {settings.drive_folder_url && (
                  <button
                    type="button"
                    onClick={() => window.open(settings.drive_folder_url, '_blank')}
                    className="px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 shrink-0 text-xs font-bold flex items-center gap-1"
                    title="Buka Drive untuk memastikan link benar"
                  >
                    <ExternalLink size={13} />
                    <span className="hidden sm:inline">Tes Buka</span>
                  </button>
                )}
              </div>
              {detectedFolderId && (
                <p className="text-[11px] text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                  <Check size={12} /> Folder ID Terdeteksi Otomatis: <span className="font-mono">{detectedFolderId}</span>
                </p>
              )}
            </div>

            {/* Input Webhook URL */}
            <div className="pt-2 border-t border-purple-100 space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="text-xs font-bold text-slate-700">
                  Link Webhook Google Apps Script (Untuk Terbit Otomatis ke Drive)
                </label>
                <span className="text-[10px] text-purple-700 bg-purple-50 font-bold px-2 py-0.5 rounded border border-purple-200">
                  Tempelkan Webhook Di Sini
                </span>
              </div>
              <input
                type="url"
                value={settings.drive_webhook_url || ''}
                onChange={(e) => setSettings((s) => ({ ...s, drive_webhook_url: e.target.value.trim() }))}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-xs bg-white font-mono min-w-0 focus:border-purple-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                👉 <strong>Salin Webhook URL Anda lalu tempelkan pada kolom ini</strong>. Begitu tersimpan, setiap ada mahasiswa yang mengisi absensi, sertifikat mereka akan langsung otomatis dibuat dan tersimpan ke Google Drive Anda!
              </p>

              {/* Test Button & Result */}
              {settings.drive_webhook_url && (
                <div className="pt-1.5 space-y-2">
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={testingWebhook}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {testingWebhook ? <RefreshCw size={13} className="animate-spin" /> : <HardDrive size={13} />}
                    <span>{testingWebhook ? 'Mengirim Uji Coba ke Drive...' : '🧪 Uji Kirim 1 Sertifikat ke Google Drive Sekarang'}</span>
                  </button>

                  {testWebhookNotice && (
                    <div className={`p-3 rounded-xl text-xs font-semibold leading-relaxed ${testWebhookNotice.type === 'success'
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border border-rose-200'
                      }`}>
                      {testWebhookNotice.text}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Optional Webhook Accordion */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowScriptGuide(!showScriptGuide)}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
              >
                <span>{showScriptGuide ? '▼ Tutup Panduan Pembuatan Webhook' : '▶ Panduan Langkah demi Langkah Cara Mendapatkan Webhook URL'}</span>
              </button>

              {showScriptGuide && (
                <div className="mt-3 p-3.5 rounded-xl bg-purple-50 text-xs text-slate-700 space-y-2.5 border border-purple-200">
                  <p className="font-bold text-purple-900">4 Langkah Mudah Mendapatkan Webhook URL:</p>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed">
                    <li>Buka <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-purple-700 underline font-semibold">script.google.com</a> ➡️ Klik <strong>New project (Proyek baru)</strong>.</li>
                    <li>Hapus kode bawaan di editor, lalu klik tombol <strong>"Salin Kode Google Apps Script"</strong> di bawah ini dan tempel (paste) kodenya ke editor tersebut.</li>
                    <li>Klik tombol biru <strong>Deploy ➡️ New deployment</strong>. Pada jenis deployment, pilih <strong>Web app</strong> (Who has access: pilih <strong>Anyone / Siapa saja</strong>) ➡️ Klik <strong>Deploy</strong>.</li>
                    <li>Google akan menampilkan <strong>Web app URL (Webhook URL)</strong>. Klik <strong>Copy (Salin)</strong>, lalu tempelkan link tersebut ke <strong>kolom input di atas</strong>, dan klik <strong>Simpan Pengaturan</strong> di bawah!</li>
                  </ol>
                  <button
                    type="button"
                    onClick={copyGoogleAppsScript}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-xs font-bold text-purple-800 shadow-xs cursor-pointer hover:bg-purple-100 transition-colors"
                  >
                    <Copy size={12} />
                    {copiedScript ? '✓ Kode Skrip Berhasil Disalin!' : 'Salin Kode Google Apps Script'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Save Button */}
          <button
            type="submit"
            disabled={saveLoading}
            className="btn-shimmer w-full py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {saveLoading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{saveLoading ? 'Menyimpan ke Cloud Firestore...' : 'Simpan Pengaturan Template & Google Drive'}</span>
          </button>
        </form>

        {/* Right Column: Live Interactive Visual Canvas Preview with Click-To-Place */}
        <div className="xl:col-span-6 space-y-4 xl:sticky xl:top-20">
          <div className="bento-card rounded-2xl p-4 sm:p-5 border border-purple-200">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Eye size={15} className="text-purple-600" />
                Live Preview Desain Sertifikat
              </h3>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                Klik Gambar untuk Memindahkan Nama
              </span>
            </div>



            {/* Manual Name Input Tester with Quick Presets */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-bold text-slate-700">Nama Contoh untuk Uji Pratinjau:</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { playClick(); setSampleName('Ahmad Rizky Pratama, S.Pd.'); }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    Nama Standar
                  </button>
                  <button
                    type="button"
                    onClick={() => { playClick(); setSampleName('Prof. Dr. H. Muhammad Fathurrahman Al-Makassari, S.Pd.I., M.Pd.I., Ph.D.'); }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
                    title="Uji coba auto-scaling nama panjang"
                  >
                    ⭐ Coba Nama Panjang
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
                placeholder="Ketik nama untuk mencoba..."
                className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-medium bg-white focus:outline-none focus:border-purple-600"
              />
              {sampleName.length > 28 && (
                <p className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
                  ✨ <strong>Auto-Scaling Aktif:</strong> Font otomatis mengecil proporsional agar nama panjang tetap muat 1 baris estetis.
                </p>
              )}
            </div>

            {/* The Visual Certificate Canvas (Interactive Click-to-Place!) */}
            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              title="Klik di sini untuk langsung memindahkan posisi nama!"
              className="relative rounded-2xl overflow-hidden shadow-xl border-2 border-purple-300 bg-slate-900 select-none cursor-crosshair group mx-auto"
              style={{
                maxWidth: settings.orientation === 'portrait' ? '420px' : '100%',
              }}
            >
              <img
                src={settings.template_bg}
                alt="Template Sertifikat"
                className="w-full h-auto block object-contain pointer-events-none"
              />

              {/* Crosshair guide overlay on hover */}
              <div className="absolute inset-0 bg-purple-900/0 group-hover:bg-purple-900/5 transition-colors pointer-events-none flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-80 transition-opacity bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-xs">
                  🎯 Klik untuk menempatkan nama di sini
                </span>
              </div>

              {/* OVERLAID PARTICIPANT NAME WITH SOLUSI 1 AUTO-SCALING PREVIEW */}
              {(() => {
                const isLong = sampleName.length > 26;
                const lengthRatio = isLong ? Math.max(0.60, 26 / sampleName.length) : 1;
                const previewFontSize = Math.round(settings.fontSize * lengthRatio);

                return (
                  <div
                    className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-100"
                    style={{
                      top: `${settings.top}%`,
                      left: `${settings.left}%`,
                      fontSize: `clamp(11px, ${2.8 * lengthRatio}vw, ${previewFontSize}px)`,
                      fontFamily: settings.fontFamily,
                      color: settings.color,
                      fontWeight: settings.fontWeight,
                      textDecoration: settings.underline ? 'underline' : 'none',
                      textShadow: '0 1px 2px rgba(255,255,255,0.7)',
                      maxWidth: '82%',
                      whiteSpace: 'nowrap',
                      lineHeight: '1.2',
                    }}
                  >
                    {sampleName}
                  </div>
                );
              })()}
            </div>

            <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
              <span className="font-mono">Posisi: X: <strong>{settings.left}%</strong> • Y: <strong>{settings.top}%</strong></span>
              <span className="font-mono">Ukuran: <strong>{settings.fontSize}px</strong></span>
              <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                {settings.orientation === 'portrait' ? '📄 Portrait (Tegak)' : '📜 Landscape (Mendatar)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. Workshop Management Panel (Full CRUD & Editing!)
// ==========================================
function WorkshopPanel() {
  const [workshops, setWorkshops] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkshopId, setEditingWorkshopId] = useState(null);

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    title: '',
    speaker: '',
    date: getTodayDate(),
    time: '08:30 - 12:00 WITA',
    location: 'Lab Microleading MPI FTK UINAM',
    description: '',
    status: 'open'
  });

  useEffect(() => { getAllWorkshops().then(setWorkshops); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));


  // Start Editing Workshop
  const handleStartEdit = (ws) => {
    playClick();
    setEditingWorkshopId(ws.id);
    setForm({
      title: ws.title || '',
      speaker: ws.speaker || '',
      date: ws.date || getTodayDate(),
      time: ws.time || '08:30 - 12:00 WITA',
      location: ws.location || 'Lab Microleading MPI FTK UINAM',
      description: ws.description || '',
      status: ws.status || 'open'
    });
    setShowForm(true);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // Cancel Form
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingWorkshopId(null);
    setForm({
      title: '',
      speaker: '',
      date: getTodayDate(),
      time: '08:30 - 12:00 WITA',
      location: 'Lab Microleading MPI FTK UINAM',
      description: '',
      status: 'open'
    });
  };

  // Clone / Duplicate Workshop into form
  const handleCloneWorkshop = (ws) => {
    playClick();
    setEditingWorkshopId(null);
    setForm({
      title: `${ws.title} (Sesi Lanjutan)`,
      speaker: ws.speaker,
      date: getTodayDate(),
      time: ws.time,
      location: ws.location,
      description: ws.description,
      status: 'open'
    });
    setShowForm(true);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // Create or Update
  const handleSaveWorkshop = async (e) => {
    e.preventDefault();
    if (editingWorkshopId) {
      await updateWorkshop(editingWorkshopId, form);
      playSuccess();
    } else {
      await createWorkshop(form);
      playSuccess();
    }
    handleCancelForm();
    getAllWorkshops().then(setWorkshops);
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      title: 'Hapus Workshop?',
      message: 'Kegiatan workshop ini beserta jadwal dan pengaturannya akan dihapus secara permanen.',
      confirmText: 'Ya, Hapus',
      type: 'danger',
    });
    if (!ok) return;
    await deleteWorkshop(id);
    playClick();
    getAllWorkshops().then(setWorkshops);
  };

  const handleToggleStatus = async (ws) => {
    await updateWorkshop(ws.id, { status: ws.status === 'open' ? 'closed' : 'open' });
    playClick();
    getAllWorkshops().then(setWorkshops);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-900">Workshop</h2>
          <p className="text-xs text-slate-500">Buat, edit, dan kelola sesi workshop yang terbuka untuk presensi mahasiswa.</p>
        </div>
        <button
          onClick={() => {
            playClick();
            if (showForm) {
              handleCancelForm();
            } else {
              setShowForm(true);
              setEditingWorkshopId(null);
            }
          }}
          className="btn-shimmer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/25 shrink-0 cursor-pointer"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          <span>{showForm ? (editingWorkshopId ? 'Batal Edit' : 'Tutup Formulir') : 'Tambah Workshop Baru'}</span>
        </button>
      </div>

      {/* Workshop Create/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="glass-panel rounded-3xl p-5 sm:p-7 border border-purple-200/90 shadow-xl"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {/* Form Mode Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-100 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${editingWorkshopId ? 'bg-amber-600 shadow-amber-600/30' : 'bg-purple-600 shadow-purple-600/30'} shadow-md`}>
                  {editingWorkshopId ? <Edit3 size={15} /> : <Calendar size={15} />}
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    {editingWorkshopId ? 'Edit Informasi Workshop' : 'Buat Workshop Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingWorkshopId ? 'Perbarui data narasumber, jadwal, lokasi, atau deskripsi kegiatan' : 'Lengkapi formulir di bawah ini untuk menerbitkan sesi baru'}
                  </p>
                </div>
              </div>
              {editingWorkshopId && (
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1.5 border border-amber-200">
                  <Edit3 size={12} /> Mode Edit Aktif
                </span>
              )}
            </div>

            <form onSubmit={handleSaveWorkshop} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Judul */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Judul Workshop *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="Nama workshop atau kegiatan laboratorium..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:border-purple-600 focus:outline-none"
                />
              </div>

              {/* Narasumber */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Narasumber / Instruktur *</label>
                <input
                  type="text"
                  required
                  value={form.speaker}
                  onChange={e => set('speaker', e.target.value)}
                  placeholder="Contoh: Dr. H. Muhammad Ilyas, M.Pd."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:border-purple-600 focus:outline-none"
                />
              </div>

              {/* Tanggal */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Tanggal Kegiatan *</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={e => set('date', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:border-purple-600 focus:outline-none"
                />
              </div>

              {/* Waktu - Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Clock size={12} className="text-purple-600" />
                  Waktu Pelaksanaan (Pilih Waktu)
                </label>
                <div className="relative">
                  <select
                    value={form.time}
                    onChange={e => set('time', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:border-purple-600 focus:outline-none appearance-none cursor-pointer pr-10"
                  >
                    <option value="">-- Pilih Waktu --</option>
                    <optgroup label="🌅 Pagi">
                      {TIME_SLOTS.filter(t => t.startsWith('07') || t.startsWith('08') || t.startsWith('09') || t.startsWith('10')).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </optgroup>
                    <optgroup label="☀️ Siang / Sore">
                      {TIME_SLOTS.filter(t => t.startsWith('13') || t.startsWith('14')).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🌞 Seharian">
                      {TIME_SLOTS.filter(t => t.startsWith('08:00 - 12') || t.startsWith('08:30 - 16') || t.startsWith('08:00 - 17')).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🌙 Malam">
                      {TIME_SLOTS.filter(t => t.startsWith('19')).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </optgroup>
                  </select>
                  <Clock size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none" />
                </div>
              </div>

              {/* Lokasi */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Lokasi Ruangan</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  placeholder="Contoh: Lab Microleading MPI FTK UINAM"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:border-purple-600 focus:outline-none"
                />
              </div>

              {/* Deskripsi */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Deskripsi Kegiatan</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows="3"
                  placeholder="Tuliskan tujuan dan pokok materi kegiatan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:border-purple-600 focus:outline-none resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="md:col-span-2 flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-shimmer px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/25 cursor-pointer flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>{editingWorkshopId ? 'Simpan Perubahan Workshop' : 'Simpan & Terbitkan Workshop'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workshop List Cards */}
      <div className="space-y-3">
        {workshops.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Belum ada workshop terdaftar.</p>
        )}
        {workshops.map(w => (
          <div key={w.id} className="bento-card rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${w.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {w.status === 'open' ? '● Pendaftaran Dibuka' : '○ Ditutup'}
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Calendar size={11} /> {w.date} ({w.time})
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">{w.title}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                <strong>{w.speaker}</strong> • {w.location}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-purple-100 flex-wrap">
              {/* Edit Button */}
              <button
                type="button"
                onClick={() => handleStartEdit(w)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Edit informasi workshop ini"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>

              {/* Duplicate/Clone Button */}
              <button
                type="button"
                onClick={() => handleCloneWorkshop(w)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Duplikasi workshop ini untuk sesi berikutnya"
              >
                <Copy size={12} />
                <span>Duplikasi</span>
              </button>

              <button
                onClick={() => handleToggleStatus(w)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer ${w.status === 'open'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
              >
                {w.status === 'open' ? <XCircle size={13} /> : <Check size={13} />}
                <span>{w.status === 'open' ? 'Tutup' : 'Buka'}</span>
              </button>

              <button
                onClick={() => handleDelete(w.id)}
                className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer"
                title="Hapus workshop"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 2.5 Registrations Management Panel
// (With Official Formatted Excel Exporter)
// ==========================================
function RegistrationsPanel() {
  const [registrations, setRegistrations] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('all');
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [regs, wsList] = await Promise.all([
        getRegistrations(),
        getAllWorkshops()
      ]);
      setRegistrations(regs || []);
      setWorkshops(wsList || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      title: 'Hapus Data Pendaftaran?',
      message: 'Data pendaftar ini akan dihapus permanen dari sistem.',
      confirmText: 'Ya, Hapus Data',
      type: 'danger'
    });
    if (!ok) return;
    playClick();
    await deleteRegistration(id);
    loadData();
    showToast('Data pendaftaran dihapus', 'info');
  };

  const handleToggleStatus = async (reg) => {
    playClick();
    const nextStatus = reg.status === 'terkonfirmasi' ? 'hadir' : (reg.status === 'hadir' ? 'menunggu' : 'terkonfirmasi');
    const isAttended = nextStatus === 'hadir';
    await updateRegistrationStatus(reg.id, nextStatus, isAttended);
    loadData();
    showToast(`Status diubah menjadi: ${nextStatus}`, 'success');
  };

  // Filtered registrations
  const filtered = (registrations || []).filter(r => {
    if (!r) return false;
    const matchWorkshop = selectedWorkshopId === 'all' || String(r.workshop_id) === String(selectedWorkshopId);
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const q = (query || '').toLowerCase();
    const matchQuery = !q ||
      (r.nama || '').toLowerCase().includes(q) ||
      (r.nim_nip || '').toLowerCase().includes(q) ||
      (r.instansi || '').toLowerCase().includes(q) ||
      (r.reg_code || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q);
    return matchWorkshop && matchStatus && matchQuery;
  });

  // Calculate statistics
  const totalCount = filtered.length;
  const attendedCount = filtered.filter(r => r.is_attended || r.status === 'hadir').length;
  const attendanceRate = totalCount > 0 ? ((attendedCount / totalCount) * 100).toFixed(1) : '0';

  // Export to Formatted Official Excel
  const handleExportExcel = () => {
    playClick();
    if (filtered.length === 0) {
      showAlert({
        title: 'Tidak Ada Data',
        message: 'Tidak ada data pendaftar yang sesuai untuk diekspor.',
        type: 'warning'
      });
      return;
    }

    const currentWorkshop = workshops.find(w => String(w.id) === String(selectedWorkshopId));
    const activityTitle = currentWorkshop ? currentWorkshop.title : 'Seluruh Kegiatan Workshop & Pelatihan';

    const headers = [
      'No',
      'Kode Registrasi',
      'NIM / NIP',
      'Nama Lengkap',
      'Asal Instansi',
      'No. WhatsApp',
      'Alamat Email',
      'Judul Workshop',
      'Status Pendaftaran',
      'Kehadiran',
      'Waktu Mendaftar'
    ];

    const rows = filtered.map((r, i) => [
      i + 1,
      r.reg_code || '-',
      r.nim_nip || '-',
      r.nama || '-',
      r.instansi || '-',
      r.whatsapp || '-',
      r.email || '-',
      r.workshop_title || '-',
      r.status === 'terkonfirmasi' ? 'Terkonfirmasi' : (r.status === 'hadir' ? 'Hadir' : r.status || 'Terkonfirmasi'),
      r.is_attended || r.status === 'hadir' ? 'Hadir' : 'Belum Hadir',
      r.registered_at ? new Date(r.registered_at).toLocaleString('id-ID') : '-'
    ]);

    exportStyledExcel({
      filename: `Rekap_Pendaftar_Workshop_MPI`,
      title: 'LAPORAN REKAPITULASI PENDAFTARAN WORKSHOP & PELATIHAN AKADEMIK',
      subtitle: 'Laboratorium Manajemen Pendidikan Islam (MPI) FTK UIN Alauddin Makassar',
      activityName: activityTitle,
      dateInfo: currentWorkshop ? `${currentWorkshop.date} (${currentWorkshop.time})` : 'Tahun Akademik 2026',
      summaryStats: [
        { label: 'TOTAL PENDAFTAR', value: `${totalCount} Orang`, sublabel: 'Calon Peserta Terdata' },
        { label: 'SUDAH HADIR', value: `${attendedCount} Orang`, sublabel: 'Terverifikasi Presensi' },
        { label: 'RASIO KEHADIRAN', value: `${attendanceRate}%`, sublabel: 'Pendaftar vs Kehadiran' }
      ],
      headers,
      rows,
      sheetName: 'Data Pendaftar'
    });

    playSuccess();
    showToast('Laporan resmi Excel pendaftar berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-900">Pendaftaran Workshop</h2>
          <p className="text-xs text-slate-500">Kelola dan pantau seluruh data calon peserta yang mendaftar kegiatan workshop.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="btn-shimmer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 shadow-md shadow-emerald-600/25 cursor-pointer"
            title="Unduh laporan resmi Excel berformat rapi lengkap dengan kop surat dan statistik"
          >
            <Download size={14} />
            <span>Ekspor Laporan Excel Resmi</span>
          </button>
        </div>
      </div>

      {/* 3 Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bento-card rounded-2xl p-4 bg-gradient-to-br from-purple-500/10 via-white to-purple-50/30 border border-purple-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Pendaftar Terdata</span>
          <p className="text-2xl font-extrabold text-purple-700 font-display mt-0.5">{totalCount} Peserta</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Sesuai filter pencarian</p>
        </div>
        <div className="bento-card rounded-2xl p-4 bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50/30 border border-emerald-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Telah Hadir (Presensi)</span>
          <p className="text-2xl font-extrabold text-emerald-700 font-display mt-0.5">{attendedCount} Orang</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Terverifikasi di hari H</p>
        </div>
        <div className="bento-card rounded-2xl p-4 bg-gradient-to-br from-indigo-500/10 via-white to-indigo-50/30 border border-indigo-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Tingkat Kehadiran (Attendance Rate)</span>
          <p className="text-2xl font-extrabold text-indigo-700 font-display mt-0.5">{attendanceRate}%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Rasio pendaftar yang hadir</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bento-card rounded-2xl p-4 border border-purple-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          {/* Workshop Filter */}
          <select
            value={selectedWorkshopId}
            onChange={e => setSelectedWorkshopId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-purple-200 text-xs font-semibold text-slate-700 bg-purple-50/40 focus:outline-none focus:border-purple-600 max-w-xs cursor-pointer"
          >
            <option value="all">Semua Workshop ({workshops.length})</option>
            {workshops.map(w => (
              <option key={w.id} value={w.id}>{w.title}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-purple-200 text-xs font-semibold text-slate-700 bg-purple-50/40 focus:outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="terkonfirmasi">Terkonfirmasi</option>
            <option value="hadir">Sudah Hadir</option>
            <option value="menunggu">Menunggu</option>
          </select>
        </div>

        {/* Live Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari Nama, NIM, No. Registrasi..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-purple-200 text-xs bg-white text-slate-900 focus:outline-none focus:border-purple-600 font-medium"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Table of Registered Participants */}
      <div className="bento-card rounded-2xl border border-purple-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/80 text-purple-950 font-bold uppercase text-[10px] tracking-wider border-b border-purple-200/80">
              <tr>
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3">Kode Reg</th>
                <th className="py-3 px-3">Nama Lengkap</th>
                <th className="py-3 px-3">NIM / NIP</th>
                <th className="py-3 px-3">Instansi</th>
                <th className="py-3 px-3">No. WhatsApp</th>
                <th className="py-3 px-3">Workshop</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Kehadiran</th>
                <th className="py-3 px-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/70 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Memuat data pendaftar...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    <ClipboardCheck size={36} className="mx-auto text-purple-200 mb-2" />
                    <p className="font-bold text-slate-600">Tidak ada data pendaftaran yang sesuai filter.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{i + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-purple-700 whitespace-nowrap">
                      {r.reg_code}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {r.nama}
                      {r.email && <span className="block text-[10px] font-normal text-slate-400">{r.email}</span>}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{r.nim_nip}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-[140px] truncate" title={r.instansi}>{r.instansi}</td>
                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">{r.whatsapp || '-'}</td>
                    <td className="py-3 px-3 max-w-[180px] truncate" title={r.workshop_title}>
                      <span className="font-semibold text-slate-800">{r.workshop_title}</span>
                      <span className="block text-[10px] text-slate-400">{r.workshop_date}</span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(r)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-transform hover:scale-105 cursor-pointer ${
                          r.status === 'terkonfirmasi'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : (r.status === 'hadir'
                               ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                               : 'bg-amber-100 text-amber-800 border-amber-200')
                        }`}
                        title="Klik untuk ubah status pendaftaran"
                      >
                        {r.status === 'terkonfirmasi' ? 'Terkonfirmasi' : (r.status === 'hadir' ? 'Hadir' : r.status || 'Terkonfirmasi')}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {r.is_attended || r.status === 'hadir' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 size={11} /> Hadir
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Belum Presensi</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            exportSingleRegistrationExcel(r);
                            showToast(`Laporan Excel ${r.nama} diunduh!`, 'success');
                          }}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                          title="Unduh bukti laporan Excel resmi pendaftar ini"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                          title="Hapus data pendaftar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-purple-50/40 border-t border-purple-100/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Menampilkan <strong>{filtered.length}</strong> dari {registrations.length} data pendaftar</span>
          <span className="text-[10px] text-purple-700 font-semibold">Database Firestore & LocalStorage Sync</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. Attendance & Certificates Panel (Automated!)
// (With CSV/Excel Exporter & Real-Time Sync)
// ==========================================
function AttendancePanel() {
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'bukti' | 'drive' | 'nodrive'
  const [editingDriveId, setEditingDriveId] = useState(null);
  const [driveInput, setDriveInput] = useState('');
  const [certSettings, setCertSettings] = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const load = async () => {
    const data = await getAttendance('');
    setRecords(data || []);
    const settings = await getCertSettings();
    setCertSettings(settings);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      title: 'Hapus Data Presensi?',
      message: 'Data kehadiran peserta dan catatan sertifikat digital ini akan dihapus permanen.',
      confirmText: 'Ya, Hapus Data',
      type: 'danger',
    });
    if (!ok) return;
    await deleteAttendance(id);
    playClick();
    load();
  };

  const handleSaveDriveUrl = async (id) => {
    await updateAttendanceDriveUrl(id, driveInput);
    setEditingDriveId(null);
    playSuccess();
    load();
  };

  // Automated 1-Click: Apply Default Drive Folder URL to All Unlinked Attendees!
  const applyDefaultDriveToAll = async () => {
    if (!certSettings?.drive_folder_url) {
      showAlert({
        title: 'Tautan Google Drive Belum Disetel',
        message: 'Tautan folder Google Drive default belum disetel di tab "Desain Sertifikat & Drive".',
        type: 'warning',
      });
      return;
    }
    const unlinked = records.filter(r => !r.drive_url || r.drive_url.includes('EXAMPLE'));
    if (unlinked.length === 0) {
      showAlert({
        title: 'Semua Sudah Terhubung',
        message: 'Semua peserta sudah memiliki tautan Google Drive resmi yang aktif!',
        type: 'info',
      });
      return;
    }

    const ok = await showConfirm({
      title: 'Terapkan Folder Google Drive?',
      message: `Terapkan tautan folder Google Drive resmi ke ${unlinked.length} peserta yang belum terhubung?`,
      confirmText: 'Terapkan ke Semua',
      type: 'info',
    });
    if (!ok) return;

    for (const r of unlinked) {
      await updateAttendanceDriveUrl(r.id, certSettings.drive_folder_url);
    }
    playSuccess();
    load();
  };

  // Real-time live filtering
  const filteredRecords = records.filter(rec => {
    const q = query.toLowerCase();
    const matchesQuery =
      !query ||
      (rec.nama || '').toLowerCase().includes(q) ||
      (rec.identitas || '').toLowerCase().includes(q) ||
      (rec.instansi || '').toLowerCase().includes(q) ||
      (rec.cert_number || '').toLowerCase().includes(q);

    if (!matchesQuery) return false;

    if (filterType === 'bukti') return Boolean(rec.bukti_file);
    if (filterType === 'drive') return Boolean(rec.drive_url && !rec.drive_url.includes('EXAMPLE'));
    if (filterType === 'nodrive') return !rec.drive_url || rec.drive_url.includes('EXAMPLE');
    return true;
  });

  // Automated 1-Click: Export to Formatted Official Excel
  const exportAttendanceToExcel = () => {
    playClick();
    if (filteredRecords.length === 0) {
      showAlert({
        title: 'Tidak Ada Data',
        message: 'Tidak ada data presensi yang sesuai dengan filter untuk diekspor.',
        type: 'warning',
      });
      return;
    }

    const headers = [
      'No',
      'No. Sertifikat',
      'Nama Lengkap',
      'NIM / Identitas',
      'Asal Instansi',
      'Kegiatan Workshop',
      'Status Bukti Kehadiran',
      'Tautan Google Drive',
      'Waktu Presensi'
    ];

    const rows = filteredRecords.map((r, i) => [
      i + 1,
      r.cert_number || '-',
      r.nama || '-',
      r.identitas || '-',
      r.instansi || '-',
      r.workshop_title || '-',
      r.bukti_file ? 'Ada Bukti' : 'Tidak Ada',
      r.drive_url || '-',
      r.timestamp ? new Date(r.timestamp).toLocaleString('id-ID') : '-'
    ]);

    const withBukti = filteredRecords.filter(r => r.bukti_file).length;

    exportStyledExcel({
      filename: `Rekap_Presensi_Lab_MPI`,
      title: 'LAPORAN REKAPITULASI PRESENSI & KELAYAKAN E-SERTIFIKAT DIGITAL',
      subtitle: 'Laboratorium Manajemen Pendidikan Islam (MPI) FTK UIN Alauddin Makassar',
      activityName: 'Rekapitulasi Kehadiran Peserta Workshop & Praktikum Lab',
      summaryStats: [
        { label: 'TOTAL KEHADIRAN', value: `${filteredRecords.length} Orang`, sublabel: 'Data Presensi Masuk' },
        { label: 'BUKTI TERVERIFIKASI', value: `${withBukti} Peserta`, sublabel: 'Melampirkan Bukti Foto' },
        { label: 'STATUS E-SERTIFIKAT', value: '100% Terbit', sublabel: 'Terverifikasi Digital' }
      ],
      headers,
      rows,
      sheetName: 'Rekap Presensi'
    });

    playSuccess();
    showToast('Laporan resmi Excel presensi berhasil diunduh!', 'success');
  };

  // Automated 1-Click: Copy summary to clipboard
  const copyRecapToClipboard = () => {
    playClick();
    const text = filteredRecords.map((r, i) => `${i + 1}. ${r.nama} (${r.identitas}) - ${r.workshop_title} [No: ${r.cert_number}]`).join('\n');
    navigator.clipboard?.writeText(text);
    setCopiedSummary(true);
    playSuccess();
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const withBuktiCount = records.filter(r => r.bukti_file).length;
  const unlinkedCount = records.filter(r => !r.drive_url || r.drive_url.includes('EXAMPLE')).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-900">Presensi</h2>
          <p className="text-xs text-slate-500">Pencarian instan, ekspor data otomatis, dan sinkronisasi link Google Drive massal.</p>
        </div>

        {/* Action Buttons: Batch Sync & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {unlinkedCount > 0 && certSettings?.drive_folder_url && (
            <button
              type="button"
              onClick={applyDefaultDriveToAll}
              className="btn-shimmer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/25 shrink-0 cursor-pointer"
              title="Terapkan link folder Google Drive resmi ke semua peserta sekaligus"
            >
              <Zap size={13} />
              <span>Set Drive ke Semua ({unlinkedCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={exportAttendanceToExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-purple-200 shadow-xs cursor-pointer"
            title="Unduh laporan resmi presensi berformat rapi lengkap dengan kop surat dan tabel"
          >
            <Download size={13} className="text-emerald-600" />
            <span>Ekspor Laporan Excel</span>
          </button>

          <button
            type="button"
            onClick={copyRecapToClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 cursor-pointer"
            title="Salin rekap daftar peserta ke clipboard"
          >
            <Copy size={13} />
            <span>{copiedSummary ? 'Tersalin!' : 'Salin Rekap'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (Real-time Instant) */}
      <div className="bento-card rounded-2xl p-4 border border-purple-200 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-600" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ketik langsung untuk mencari nama, NIM, instansi, atau no. sertifikat..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-purple-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-purple-600"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-bold text-[11px] uppercase mr-1">Filter Cepat:</span>
          {[
            { id: 'all', label: `Semua (${records.length})` },
            { id: 'bukti', label: `📎 Ada Bukti (${withBuktiCount})` },
            { id: 'drive', label: '📁 Drive Siap' },
            { id: 'nodrive', label: `⚠️ Belum Ada Link (${unlinkedCount})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => { playClick(); setFilterType(f.id); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${filterType === f.id
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-purple-50'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Records List */}
      <div className="space-y-3">
        {filteredRecords.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Tidak ada data presensi yang sesuai kriteria.</p>
        )}
        {filteredRecords.map(rec => (
          <div key={rec.id} className="bento-card rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-bold">
                  {rec.cert_number}
                </span>
                <span className="text-[11px] text-slate-400">
                  {new Date(rec.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {rec.bukti_file ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ Bukti Diunggah
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    - Belum ada bukti
                  </span>
                )}
              </div>

              <h4 className="font-bold text-sm sm:text-base text-slate-900 truncate">{rec.nama}</h4>
              <p className="text-xs text-slate-500 truncate">{rec.identitas} • {rec.instansi}</p>
              <p className="text-xs text-purple-700 font-semibold mt-0.5 truncate">🏆 {rec.workshop_title}</p>

              {/* Bukti Kehadiran & Drive Row */}
              <div className="mt-2.5 flex items-center gap-3 text-xs flex-wrap">
                {/* Bukti file preview button */}
                {rec.bukti_file && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">Berkas Bukti:</span>
                    <a
                      href={rec.bukti_file.dataUrl || '#'}
                      download={rec.bukti_file.name}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
                      title="Klik untuk melihat/mengunduh berkas bukti"
                    >
                      <FileText size={12} className="text-emerald-600" />
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">{rec.bukti_file.name}</span>
                      <Download size={10} className="text-emerald-500 ml-0.5" />
                    </a>
                  </div>
                )}

                {/* Drive link status */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Drive:</span>
                  {editingDriveId === rec.id ? (
                    <div className="flex items-center gap-1 w-full max-w-sm flex-wrap sm:flex-nowrap">
                      <input
                        type="url"
                        value={driveInput}
                        onChange={(e) => setDriveInput(e.target.value)}
                        placeholder="Link file drive..."
                        className="px-2 py-1 text-xs border border-purple-300 rounded-lg flex-1 bg-white min-w-0"
                      />
                      <button
                        onClick={() => handleSaveDriveUrl(rec.id)}
                        className="px-2.5 py-1 text-xs bg-green-600 text-white rounded-lg font-bold cursor-pointer"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setEditingDriveId(null)}
                        className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded-lg cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <>
                      {rec.drive_url ? (
                        <a
                          href={rec.drive_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-700 font-semibold hover:underline inline-flex items-center gap-1 text-[11px]"
                        >
                          <FolderOpen size={11} />
                          Buka di Drive
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Belum disetel</span>
                      )}
                      <button
                        onClick={() => {
                          setEditingDriveId(rec.id);
                          setDriveInput(rec.drive_url || certSettings?.drive_folder_url || '');
                        }}
                        className="text-[10px] text-purple-600 underline font-semibold ml-1 cursor-pointer"
                      >
                        Ubah
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-purple-100 flex-wrap">
              <button
                onClick={() => {
                  playClick();
                  window.open(rec.drive_url || 'https://drive.google.com', '_blank', 'noopener,noreferrer');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                title="Buka langsung di Google Drive"
              >
                <ExternalLink size={13} />
                Buka di Drive
              </button>
              <button
                onClick={() => handleDelete(rec.id)}
                className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer"
                title="Hapus data presensi"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 4. News Panel (Upload Foto dari Komputer)
// ==========================================
function NewsPanel() {
  const [news, setNews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', image_path: '' });
  const [imageFileName, setImageFileName] = useState('');
  const newsFileInputRef = useRef(null);

  useEffect(() => { getNews().then(setNews); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Handle Photo Upload from Computer
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showAlert('Harap pilih berkas gambar yang sah (JPG, PNG, atau WebP)!', 'warning');
        return;
      }
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        set('image_path', event.target.result);
        playSuccess();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.image_path) {
      showAlert({
        title: 'Foto Sampul Belum Dipilih',
        message: 'Harap pilih foto sampul berita dari komputer Anda terlebih dahulu.',
        type: 'warning',
      });
      return;
    }
    await createNews(form);
    playSuccess();
    setShowForm(false);
    setForm({ title: '', content: '', image_path: '' });
    setImageFileName('');
    getNews().then(setNews);
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      title: 'Hapus Berita Ini?',
      message: 'Artikel berita dan pengumuman ini akan dihapus dari portal warta.',
      confirmText: 'Ya, Hapus Berita',
      type: 'danger',
    });
    if (!ok) return;
    await deleteNews(id);
    playClick();
    getNews().then(setNews);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-900">Berita</h2>
          <p className="text-xs text-slate-500">Kelola warta kabar praktikum dan agenda penting Laboratorium MPI.</p>
        </div>
        <button
          onClick={() => { playClick(); setShowForm(!showForm); }}
          className="btn-shimmer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/25 shrink-0 cursor-pointer"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          <span>{showForm ? 'Tutup Form Berita' : 'Tambah Berita Baru'}</span>
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="glass-panel rounded-3xl p-5 sm:p-7 border border-purple-200 mb-5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-100">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/25">
                <Newspaper size={16} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-base">Buat Artikel Berita Baru</h3>
                <p className="text-[11px] text-slate-500">Unggah foto dokumentasi dari komputer dan tuliskan informasi berita kegiatan</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Judul Berita *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="Ketik judul artikel berita..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Konten Berita *</label>
                <textarea
                  value={form.content}
                  onChange={e => set('content', e.target.value)}
                  rows="3"
                  required
                  placeholder="Tuliskan isi berita lengkap..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:outline-none focus:border-purple-600 resize-none"
                />
              </div>

              {/* Upload Foto dari Komputer */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5">
                  Foto Sampul Berita (Pilih dari Komputer) *
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-purple-50/50 border-2 border-dashed border-purple-200">
                  {/* Image Preview */}
                  {form.image_path ? (
                    <div className="w-full sm:w-44 h-32 rounded-xl overflow-hidden bg-white border border-purple-200 shrink-0 relative group">
                      <img
                        src={form.image_path}
                        alt="Preview Sampul"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">Foto Terpilih</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full sm:w-44 h-32 rounded-xl bg-purple-100/60 border border-purple-200 flex flex-col items-center justify-center text-purple-700 shrink-0">
                      <Upload size={24} className="mb-1 text-purple-600" />
                      <span className="text-[11px] font-bold text-purple-900">Belum Ada Foto</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div>
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">
                        {imageFileName ? `File Terpilih: ${imageFileName}` : 'Pilih File Foto dari Komputer Anda'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Format yang didukung: JPG, PNG, JPEG, WebP
                      </p>
                    </div>

                    <input
                      ref={newsFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                      <button
                        type="button"
                        onClick={() => newsFileInputRef.current?.click()}
                        className="btn-shimmer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors cursor-pointer"
                      >
                        <Upload size={13} />
                        <span>{form.image_path ? 'Ganti Foto dari Komputer' : 'Pilih Foto dari Komputer'}</span>
                      </button>

                      {form.image_path && (
                        <button
                          type="button"
                          onClick={() => { set('image_path', ''); setImageFileName(''); }}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-shimmer px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/25 cursor-pointer"
                >
                  Simpan & Terbitkan Berita
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {news.map(n => (
          <div key={n.id} className="bento-card rounded-2xl p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-purple-100">
              <img src={n.image_path || '/img/bg.jpg'} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-900 leading-snug">{n.title}</p>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{n.content}</p>
            </div>
            <button
              onClick={() => handleDelete(n.id)}
              className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors shrink-0 cursor-pointer"
              title="Hapus berita"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 5. Gallery Management Panel (Upload Foto dari Komputer)
// ==========================================
function GalleryPanel({ gallery, onReload }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', path: '', category: 'praktikum' });
  const [fileName, setFileName] = useState('');
  const galleryFileInputRef = useRef(null);

  const CATEGORY_NAMES = {
    praktikum: 'Praktikum & Kelas',
    fasilitas: 'Fasilitas & Kampus',
    kegiatan: 'Workshop & Acara',
    profil: 'Tim Pengelola',
  };

  // Handle Photo Upload from Computer with Canvas Compression
  const handleGalleryFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showAlert({
          title: 'Format Berkas Salah',
          message: 'Harap pilih file gambar yang valid (JPG, PNG, WebP)!',
          type: 'warning',
        });
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawUrl = event.target?.result;
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let w = img.width;
            let h = img.height;
            const MAX_DIM = 1200;
            if (w > MAX_DIM || h > MAX_DIM) {
              if (w > h) {
                h = Math.round((h * MAX_DIM) / w);
                w = MAX_DIM;
              } else {
                w = Math.round((w * MAX_DIM) / h);
                h = MAX_DIM;
              }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setNewItem(prev => ({
              ...prev,
              path: compressed,
              name: prev.name ? prev.name : file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
            }));
            playSuccess();
          } catch (err) {
            setNewItem(prev => ({
              ...prev,
              path: rawUrl,
              name: prev.name ? prev.name : file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
            }));
            playSuccess();
          }
        };
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.path) {
      showAlert({
        title: 'Foto Belum Dipilih',
        message: 'Harap pilih file foto dari komputer terlebih dahulu.',
        type: 'warning',
      });
      return;
    }
    if (!newItem.name.trim()) {
      showAlert({
        title: 'Keterangan Foto Kosong',
        message: 'Harap isi judul atau keterangan dokumentasi foto.',
        type: 'warning',
      });
      return;
    }
    await addGalleryItem(newItem);
    playSuccess();
    setShowAddForm(false);
    setNewItem({ name: '', path: '', category: 'praktikum' });
    setFileName('');
    onReload();
  };

  const handleDelete = async (target) => {
    const ok = await showConfirm({
      title: 'Hapus Foto Galeri?',
      message: 'Foto dokumentasi ini akan dihapus secara permanen dari galeri laboratorium.',
      confirmText: 'Ya, Hapus Foto',
      type: 'danger',
    });
    if (!ok) return;
    await deleteGalleryItem(target);
    playClick();
    onReload();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-900">Galeri</h2>
          <p className="text-xs text-slate-500">Kelola foto dokumentasi kegiatan praktikum, seminar, dan fasilitas laboratorium (sinkron langsung dengan website publik).</p>
        </div>
        <button
          onClick={() => { playClick(); setShowAddForm(!showAddForm); }}
          className="btn-shimmer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/25 shrink-0 cursor-pointer"
        >
          {showAddForm ? <X size={15} /> : <Plus size={15} />}
          <span>{showAddForm ? 'Tutup Formulir' : 'Tambah Foto Baru'}</span>
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className="glass-panel rounded-3xl p-5 sm:p-7 border border-purple-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-100">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/25">
                <Images size={16} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-base">Unggah Foto Baru ke Galeri</h3>
                <p className="text-[11px] text-slate-500">Pilih berkas gambar foto dari komputer untuk ditampilkan pada halaman galeri</p>
              </div>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              {/* File Upload from Computer Box */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5">
                  Berkas Foto dari Komputer *
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-purple-50/50 border-2 border-dashed border-purple-200">
                  {newItem.path ? (
                    <div className="w-full sm:w-44 h-32 rounded-xl overflow-hidden bg-white border border-purple-200 shrink-0 relative group shadow-sm">
                      <img src={newItem.path} alt="Preview Foto" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">Foto Terpilih</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full sm:w-44 h-32 rounded-xl bg-purple-100/60 border border-purple-200 flex flex-col items-center justify-center text-purple-700 shrink-0">
                      <Upload size={24} className="mb-1 text-purple-600" />
                      <span className="text-[11px] font-bold text-purple-900">Belum Ada Foto</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div>
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">
                        {fileName ? `File: ${fileName}` : 'Pilih Berkas Foto dari Komputer / Perangkat Anda'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mendukung format JPG, PNG, JPEG, WebP (otomatis dikompresi)
                      </p>
                    </div>

                    <input
                      ref={galleryFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryFileChange}
                      className="hidden"
                    />

                    <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                      <button
                        type="button"
                        onClick={() => galleryFileInputRef.current?.click()}
                        className="btn-shimmer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors cursor-pointer"
                      >
                        <Upload size={13} />
                        <span>{newItem.path ? 'Ganti Foto dari Komputer' : 'Pilih Foto dari Komputer'}</span>
                      </button>

                      {newItem.path && (
                        <button
                          type="button"
                          onClick={() => { setNewItem(prev => ({ ...prev, path: '' })); setFileName(''); }}
                          className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Judul / Keterangan Foto *</label>
                  <input
                    type="text"
                    required
                    value={newItem.name}
                    onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: Praktikum Microleading Mahasiswa Semester 6"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Kategori Dokumentasi *</label>
                  <select
                    value={newItem.category}
                    onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="praktikum">Praktikum & Kelas</option>
                    <option value="fasilitas">Fasilitas & Kampus</option>
                    <option value="kegiatan">Workshop & Acara</option>
                    <option value="profil">Tim Pengelola</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-shimmer px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/25 cursor-pointer"
                >
                  Simpan ke Galeri
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery Grid */}
      {gallery.length === 0 ? (
        <div className="py-12 text-center glass-panel rounded-2xl border border-dashed border-purple-200 p-8">
          <Images size={36} className="mx-auto text-purple-400 mb-2" />
          <p className="text-sm font-bold text-slate-800">Belum ada foto di galeri</p>
          <p className="text-xs text-slate-500 mt-1">Klik tombol &quot;Tambah Foto Baru&quot; untuk mengunggah dokumentasi laboratorium.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gallery.map(g => (
            <div key={g.id || g.path} className="bento-card rounded-2xl overflow-hidden border border-purple-200 group relative">
              <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
                <img
                  src={g.path}
                  alt={g.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-900/70 text-white backdrop-blur-md uppercase">
                    {CATEGORY_NAMES[g.category] || g.category || 'Praktikum'}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(g.id || g.name || g.path)}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-white/90 text-rose-600 hover:bg-rose-50 shadow-md transition-colors cursor-pointer"
                  title="Hapus foto"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="p-3">
                <p className="font-bold text-xs text-slate-900 truncate" title={g.name}>{g.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(g.timestamp || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 6. Members Panel — Tampil di Website Publik
// ==========================================
function MembersPanel() {
  const MEMBER_ROLES = [
    'Ketua Jurusan MPI',
    'Sekretaris Jurusan MPI',
    'Dosen Pembimbing',
    'Koordinator Lab',
    'Asisten Laboratorium Microleading',
    'Asisten Lab',
    'Instruktur',
    'Mahasiswa',
    'Tamu / Peneliti'
  ];

  const DEFAULT_INITIAL_MEMBERS = [
    { id: 'm1', nama: 'Dr. Ahmad Afiif, M.Si', role: 'Ketua Jurusan MPI', category: 'pimpinan', foto: '/img/Pak-Afif.jpeg', status: 'aktif' },
    { id: 'm2', nama: 'Lisa Nursita, S.E., M.Si', role: 'Sekretaris Jurusan MPI', category: 'pimpinan', foto: '/img/Lisa-Nursita.jpeg', status: 'aktif' },
    { id: 'm3', nama: 'Muh. Fahri Zahi', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Muh-Fahri-Zahi.jpg', status: 'aktif' },
    { id: 'm4', nama: 'Abdul Basit Ridha, S.Pd.', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Abdul-Basit-Ridha, S.Pd.jpg', status: 'aktif' },
    { id: 'm5', nama: 'Amanda Tri Lestari, S.Pd.', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Amanda-Tri-Lestari, S.Pd.jpg', status: 'aktif' },
    { id: 'm6', nama: 'Inriani Rustam, S.Pd.', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Inriani-Rustam, S.Pd.jpg', status: 'aktif' },
    { id: 'm7', nama: 'Zakiyah Sananiah, S.Pd.', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Zakiyah-Sananiah, S.Pd.jpg', status: 'aktif' },
    { id: 'm8', nama: 'Amelya Putri Azizah', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Amelya-Putri-Azizah.jpg', status: 'aktif' },
    { id: 'm9', nama: 'Nelti Nurasmi', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Nelti-Nurasmi.jpg', status: 'aktif' },
    { id: 'm10', nama: 'Salsabila Rahmadhani', role: 'Asisten Laboratorium Microleading', category: 'lab', foto: '/img/Salsabila-Rahmadhani.jpg', status: 'aktif' },
  ];

  const [members, setMembers] = useState(() => {
    try {
      const stored = localStorage.getItem('mpi_members');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('mpi_members', JSON.stringify(DEFAULT_INITIAL_MEMBERS));
      return DEFAULT_INITIAL_MEMBERS;
    } catch { return DEFAULT_INITIAL_MEMBERS; }
  });
  useEffect(() => {
    getMembers().then(data => {
      if (data && data.length > 0) setMembers(data);
    });
    const handleSync = () => {
      getMembers().then(data => {
        if (data && data.length > 0) setMembers(data);
      });
    };
    window.addEventListener('mpi_members_updated', handleSync);
    return () => window.removeEventListener('mpi_members_updated', handleSync);
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const emptyForm = { nama: '', role: 'Asisten Laboratorium Microleading', status: 'aktif', foto: '' };
  const [form, setForm] = useState(emptyForm);
  const fotoRef = useRef(null);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 800; let w = img.width, h = img.height;
        if (w > max || h > max) { if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setField('foto', canvas.toDataURL('image/jpeg', 0.85));
        playSuccess();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nama.trim()) { showAlert({ title: 'Nama kosong', message: 'Isi nama lengkap Team.', type: 'warning' }); return; }
    if (editingId) {
      await updateMember(editingId, form);
      setMembers(members.map(m => m.id === editingId ? { ...m, ...form } : m));
      playSuccess();
    } else {
      const created = await createMember({ ...form, joined_at: new Date().toISOString() });
      setMembers([...members, created]);
      playSuccess();
    }
    setShowForm(false); setEditingId(null); setForm(emptyForm);
  };

  const handleEdit = (m) => {
    playClick();
    setForm({ nama: m.nama, role: m.role, status: m.status, foto: m.foto || '' });
    setEditingId(m.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({ title: 'Hapus Team?', message: 'Team ini akan dihapus dari Cloud Firebase dan website publik.', confirmText: 'Ya, Hapus', type: 'danger' });
    if (!ok) return;
    await deleteMember(id);
    setMembers(members.filter(m => m.id !== id));
    playClick();
  };

  const handleToggleStatus = async (m) => {
    const nextStatus = m.status === 'aktif' ? 'nonaktif' : 'aktif';
    await updateMember(m.id, { status: nextStatus });
    setMembers(members.map(mb => mb.id === m.id ? { ...mb, status: nextStatus } : mb));
    playClick();
  };

  const handleMove = async (id, dir) => {
    const idx = members.findIndex(m => m.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= members.length) return;
    const arr = [...members];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setMembers(arr);
    await saveMembersOrder(arr);
    playClick();
  };

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchQ = !search || m.nama?.toLowerCase().includes(q) || m.role?.toLowerCase().includes(q);
    const matchRole = filterRole === 'all' || m.role === filterRole;
    return matchQ && matchRole;
  });

  const publicCount = members.filter(m => m.status === 'aktif').length;

  const roleColors = {
    'Dosen Pembimbing': 'bg-amber-100 text-amber-900 border-amber-200',
    'Koordinator': 'bg-orange-100 text-orange-900 border-orange-200',
    'Asisten Lab': 'bg-purple-100 text-purple-900 border-purple-200',
    'Instruktur': 'bg-indigo-100 text-indigo-900 border-indigo-200',
    'Mahasiswa': 'bg-blue-100 text-blue-900 border-blue-200',
    'Tamu / Peneliti': 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-900">Team</h2>
          <p className="text-xs text-slate-500">Team <strong className="text-emerald-700">Aktif</strong> tampil otomatis di halaman <strong className="text-purple-700">/tentang</strong>. Atur urutan dengan ↑↓.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <a href="/tentang" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 cursor-pointer">
            <Eye size={13} /> Lihat Website
          </a>
          <button onClick={() => { playClick(); if (showForm && !editingId) { setShowForm(false); } else { setShowForm(true); setEditingId(null); setForm(emptyForm); } }}
            className="btn-shimmer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/25 cursor-pointer">
            {showForm && !editingId ? <X size={15} /> : <UserPlus size={15} />}
            <span>{showForm && !editingId ? 'Tutup Form' : 'Tambah Team'}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Team', value: members.length, color: 'from-purple-500 to-indigo-600', icon: Users },
          { label: 'Tampil di Website', value: publicCount, color: 'from-emerald-500 to-green-600', icon: Globe },
          { label: 'Disembunyikan', value: members.length - publicCount, color: 'from-slate-400 to-slate-500', icon: XCircle },
          { label: 'Dosen/Instruktur', value: members.filter(m => ['Dosen Pembimbing', 'Instruktur', 'Koordinator'].includes(m.role)).length, color: 'from-amber-500 to-orange-600', icon: GraduationCap },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-3.5 bg-gradient-to-br ${s.color} text-white shadow-md`}>
            <s.icon size={18} className="mb-1.5 opacity-80" />
            <p className="font-extrabold text-2xl font-display">{s.value}</p>
            <p className="text-[11px] font-semibold opacity-80 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2.5">
        <Globe size={15} className="text-indigo-600 shrink-0 mt-0.5" />
        <span>Team <strong>Aktif</strong> tampil otomatis di halaman publik <strong>/tentang</strong> dengan kartu foto, nama, dan jabatan. Gunakan ↑↓ untuk atur urutan tampil, dan ikon mata untuk show/hide.</span>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div className="glass-panel rounded-3xl border border-purple-200 shadow-xl overflow-hidden"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-purple-100">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md ${editingId ? 'bg-amber-500' : 'bg-purple-600'}`}>
                  {editingId ? <Edit3 size={15} /> : <UserPlus size={15} />}
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-slate-900 text-sm">{editingId ? 'Edit Profil Team' : 'Tambah Team Baru'}</h3>
                  <p className="text-[11px] text-slate-500">Hanya foto, nama, dan jabatan yang ditampilkan di website publik</p>
                </div>
                {editingId && <span className="ml-auto px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200">Mode Edit</span>}
              </div>

              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Foto Upload */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-full max-w-[160px] aspect-[4/5] rounded-2xl overflow-hidden bg-purple-100 border-2 border-dashed border-purple-300 flex items-center justify-center shadow-inner cursor-pointer group" onClick={() => fotoRef.current?.click()}>
                    {form.foto
                      ? <img src={form.foto} alt="Preview" className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform" />
                      : <div className="flex flex-col items-center gap-2 text-purple-400 px-4 text-center">
                        <Upload size={28} /><span className="text-[11px] font-semibold">Klik untuk upload</span>
                        <span className="text-[10px] text-purple-300">4:5 portrait</span>
                      </div>
                    }
                  </div>
                  <input ref={fotoRef} type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
                  <button type="button" onClick={() => fotoRef.current?.click()} className="w-full px-3 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 cursor-pointer flex items-center justify-center gap-1.5">
                    <Upload size={12} /> {form.foto ? 'Ganti Foto' : 'Pilih Foto'}
                  </button>
                  {form.foto && <button type="button" onClick={() => setField('foto', '')} className="text-[11px] text-rose-500 font-semibold cursor-pointer hover:underline">✕ Hapus Foto</button>}
                  <p className="text-[10px] text-slate-400 text-center">Format JPG/PNG/WebP<br />Max 800px, otomatis dikompres</p>
                </div>

                {/* Fields */}
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Nama Lengkap *</label>
                    <input required value={form.nama} onChange={e => setField('nama', e.target.value)}
                      placeholder="Contoh: Ahmad Rizky Pratama, S.Pd."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:border-purple-600 focus:outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Jabatan / Peran *</label>
                    <select required value={form.role} onChange={e => setField('role', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:border-purple-600 focus:outline-none cursor-pointer">
                      {MEMBER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <p className="text-[10px] text-slate-400">Jabatan ini yang muncul di kartu profil website</p>
                  </div>

                  {/* Live Preview */}
                  {form.nama && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Eye size={10} /> Preview Kartu Website</p>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-[60px] rounded-xl overflow-hidden bg-purple-100 border border-purple-200 shrink-0 flex items-center justify-center">
                          {form.foto ? <img src={form.foto} alt="" className="w-full h-full object-cover object-top" /> : <span className="font-extrabold text-lg text-purple-300">{form.nama?.charAt(0)}</span>}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-900">{form.nama}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleColors[form.role] || 'bg-purple-100 text-purple-900 border-purple-200'}`}>{form.role}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="text-xs font-bold text-slate-700">Status Tampil:</label>
                    {[['aktif', '✓ Aktif (Tampil di Website)'], ['nonaktif', '✗ Sembunyikan']].map(([val, lbl]) => (
                      <button key={val} type="button" onClick={() => setField('status', val)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${form.status === val
                          ? val === 'aktif' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-400 text-white border-slate-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{lbl}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2 border-t border-purple-100">
                    <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer">Batal</button>
                    <button type="submit" className="btn-shimmer px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/25 cursor-pointer flex items-center gap-1.5">
                      <Save size={14} /> <span>{editingId ? 'Simpan Perubahan' : 'Tambahkan ke Website'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter */}
      <div className="bento-card rounded-2xl p-4 border border-purple-200 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-600" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau jabatan..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-purple-200 text-xs bg-white focus:outline-none focus:border-purple-600" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"><X size={14} /></button>}
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-bold text-[11px] uppercase">Filter:</span>
          {['all', ...MEMBER_ROLES].map(r => (
            <button key={r} onClick={() => { playClick(); setFilterRole(r); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${filterRole === r ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-purple-50'}`}>
              {r === 'all' ? `Semua (${members.length})` : r}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      {filtered.length === 0
        ? <div className="text-center py-16 space-y-3">
          <Users size={40} className="mx-auto text-slate-300" />
          <p className="text-slate-400 text-sm font-semibold">Belum ada Team terdaftar.</p>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); playClick(); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 cursor-pointer">
            <UserPlus size={13} /> Tambah Team Pertama
          </button>
        </div>
        : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((m, idx) => {
            const globalIdx = members.findIndex(mb => mb.id === m.id);
            return (
              <motion.div key={m.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                className={`bento-card rounded-2xl overflow-hidden border flex flex-col group transition-all hover:shadow-lg ${m.status === 'aktif' ? 'border-purple-200' : 'border-slate-200 opacity-60'}`}>
                {/* Foto */}
                <div className="w-full aspect-[4/5] overflow-hidden bg-slate-100 relative">
                  {m.foto
                    ? <img src={m.foto} alt={m.nama} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center bg-purple-50">
                      <span className="text-4xl font-extrabold text-purple-200">{m.nama?.charAt(0)?.toUpperCase()}</span>
                    </div>
                  }
                  <span className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${m.status === 'aktif' ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                    {m.status === 'aktif' ? '● Tampil' : '○ Hidden'}
                  </span>
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/40 text-white">
                    #{globalIdx + 1}
                  </span>
                </div>
                {/* Info */}
                <div className="p-2.5 flex flex-col gap-1 flex-1">
                  <p className="font-bold text-[11px] text-slate-900 leading-snug line-clamp-2">{m.nama}</p>
                  <span className={`self-start inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${roleColors[m.role] || 'bg-purple-100 text-purple-900 border-purple-200'}`}>{m.role}</span>
                  {/* Actions */}
                  <div className="flex items-center gap-0.5 mt-auto pt-1.5 border-t border-slate-100">
                    <button onClick={() => handleMove(m.id, -1)} disabled={globalIdx === 0} title="Naikan" className="p-1 rounded text-slate-300 hover:text-purple-600 hover:bg-purple-50 disabled:opacity-20 cursor-pointer"><ChevronLeft size={12} className="-rotate-90" /></button>
                    <button onClick={() => handleMove(m.id, 1)} disabled={globalIdx === members.length - 1} title="Turunkan" className="p-1 rounded text-slate-300 hover:text-purple-600 hover:bg-purple-50 disabled:opacity-20 cursor-pointer"><ChevronRight size={12} className="rotate-90" /></button>
                    <button onClick={() => handleEdit(m)} title="Edit" className="p-1 rounded text-amber-500 hover:bg-amber-50 cursor-pointer ml-auto"><Edit3 size={11} /></button>
                    <button onClick={() => handleToggleStatus(m)} title={m.status === 'aktif' ? 'Sembunyikan' : 'Tampilkan'} className="p-1 rounded cursor-pointer">
                      {m.status === 'aktif' ? <Eye size={11} className="text-emerald-500" /> : <XCircle size={11} className="text-slate-400" />}
                    </button>
                    <button onClick={() => handleDelete(m.id)} title="Hapus" className="p-1 rounded text-rose-400 hover:bg-rose-50 cursor-pointer"><Trash2 size={11} /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      }
    </div>
  );
}

// ==========================================
// 7. Overview Panel — Super Dashboard
// ==========================================
function MiniCalendar({ workshops }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const wsDateSet = new Set(workshops.map(w => w.date));
  const padStart = firstDay;

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const todayStr = today.toISOString().split('T')[0];

  return (
    <div className="bento-card rounded-2xl p-4 border border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display font-bold text-slate-900 text-sm">Kalender Kegiatan</h4>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-purple-100 text-slate-600 cursor-pointer"><ChevronLeft size={14} /></button>
          <span className="text-xs font-bold text-slate-700 min-w-[110px] text-center">{monthNames[month]} {year}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-purple-100 text-slate-600 cursor-pointer"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {dayNames.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: padStart }).map((_, i) => <div key={`pad-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const hasWs = wsDateSet.has(dateStr);
          return (
            <div key={day} className={`relative flex items-center justify-center rounded-lg text-[11px] font-semibold h-7 transition-all
              ${isToday ? 'bg-purple-600 text-white shadow-sm' : hasWs ? 'bg-indigo-100 text-indigo-900 ring-1 ring-indigo-300' : 'text-slate-600 hover:bg-slate-100'}`}>
              {day}
              {hasWs && !isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />}
              {hasWs && isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[10px] font-semibold text-slate-500">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-600 inline-block" /> Hari ini</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-100 ring-1 ring-indigo-300 inline-block" /> Ada Workshop</div>
      </div>
    </div>
  );
}

function ActivityBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold text-slate-600 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-[11px] font-bold text-slate-700 w-6 text-right shrink-0">{value}</span>
    </div>
  );
}

function OverviewPanel({ workshops, records, news, gallery, onNavigate, members, registrations = [] }) {
  const withBuktiCount = records.filter(r => r.bukti_file).length;
  const fbStatus = getFirebaseStatus();
  const openWorkshops = workshops.filter(w => w.status === 'open');
  const activeMembers = (members || []).filter(m => m.status === 'aktif').length;

  // Workshop activity by title (top 5)
  const workshopActivity = workshops.map(w => ({
    label: w.title?.split(' ').slice(0, 3).join(' ') + '...',
    value: records.filter(r => r.workshop_title === w.title).length
  })).sort((a, b) => b.value - a.value).slice(0, 5);
  const maxActivity = Math.max(...workshopActivity.map(w => w.value), 1);

  // Upcoming workshops (next 7 days)
  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = workshops
    .filter(w => w.date >= todayStr && w.status === 'open')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  // Quick actions
  const quickActions = [
    { label: 'Pendaftaran', icon: ClipboardCheck, color: 'from-pink-500 to-rose-600', nav: 'registrations' },
    { label: 'Presensi', icon: Users, color: 'from-blue-500 to-cyan-600', nav: 'attendance' },
    { label: 'Workshop', icon: BookOpen, color: 'from-indigo-500 to-blue-600', nav: 'workshops' },
    { label: 'Team', icon: UserPlus, color: 'from-teal-500 to-emerald-600', nav: 'members' },
    { label: 'Kalender', icon: Calendar, color: 'from-purple-500 to-indigo-600', nav: 'calendar' },
    { label: 'Analitik', icon: BarChart2, color: 'from-amber-500 to-orange-600', nav: 'analytics' },
    { label: 'Sertifikat', icon: Award, color: 'from-violet-500 to-purple-600', nav: 'certificates' },
  ];

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-indigo-700 to-violet-800 p-5 sm:p-7 text-white shadow-xl shadow-purple-900/20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 60%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-amber-300" />
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">Lab Microleading MPI · Admin Dashboard</span>
            </div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl leading-tight">Selamat Datang Kembali! 👋</h2>
            <p className="text-purple-200 text-xs mt-1">Semua sistem aktif — {openWorkshops.length} workshop terbuka, {registrations.length} pendaftar, {records.length} presensi.</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${fbStatus.isConfigured ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30' : 'bg-amber-400/20 text-amber-200 border border-amber-400/30'}`}>
              <span className={`w-2 h-2 rounded-full ${fbStatus.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {fbStatus.isConfigured ? `Firebase: ${fbStatus.projectId}` : 'Mode Lokal'}
            </span>
            {fbStatus.isConfigured && (
              <a href={`https://console.firebase.google.com/project/${fbStatus.projectId}/firestore`} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-purple-300 hover:text-white inline-flex items-center gap-1">
                <ExternalLink size={11} /> Buka Firestore Console
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Workshop', value: workshops.length, icon: Calendar, color: 'bg-purple-600', nav: 'workshops' },
          { label: 'Pendaftar', value: registrations.length, icon: ClipboardCheck, color: 'bg-pink-600', nav: 'registrations' },
          { label: 'Presensi', value: records.length, icon: Users, color: 'bg-indigo-600', nav: 'attendance' },
          { label: 'Ada Bukti', value: withBuktiCount, icon: CheckCircle, color: 'bg-emerald-600', nav: 'attendance' },
          { label: 'Team', value: (members || []).length, icon: UserPlus, color: 'bg-teal-600', nav: 'members' },
          { label: 'Berita', value: news.length, icon: Newspaper, color: 'bg-violet-600', nav: 'news' },
        ].map(s => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} onClick={() => onNavigate(s.nav)} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Calendar + Upcoming */}
        <div className="space-y-4">
          <MiniCalendar workshops={workshops} />

          {/* Upcoming Workshops */}
          <div className="bento-card rounded-2xl p-4 border border-purple-200">
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Clock size={15} className="text-purple-600" /> Workshop Mendatang
            </h4>
            {upcoming.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Tidak ada workshop yang dijadwalkan.</p>}
            <div className="space-y-2">
              {upcoming.map(w => (
                <div key={w.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                  <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex flex-col items-center justify-center shrink-0 text-center">
                    <span className="text-[10px] font-bold leading-none">{new Date(w.date).toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()}</span>
                    <span className="text-sm font-extrabold leading-none">{new Date(w.date + 'T00:00:00').getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">{w.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{w.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Quick Actions + Activity */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bento-card rounded-2xl p-4 border border-purple-200">
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Zap size={15} className="text-purple-600" /> Aksi Cepat
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map(a => (
                <button key={a.label} onClick={() => { playClick(); onNavigate(a.nav); }} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br ${a.color} text-white text-xs font-bold shadow-md hover:scale-105 transition-transform cursor-pointer`}>
                  <a.icon size={18} />
                  <span className="text-center leading-tight">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Workshop Activity Chart */}
          <div className="bento-card rounded-2xl p-4 border border-purple-200">
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <BarChart2 size={15} className="text-purple-600" /> Peserta per Workshop
            </h4>
            {workshopActivity.length === 0
              ? <p className="text-xs text-slate-400 text-center py-4">Belum ada data workshop.</p>
              : <div className="space-y-2.5">
                {workshopActivity.map((w, i) => (
                  <ActivityBar key={i} label={w.label} value={w.value} max={maxActivity}
                    color={['bg-purple-500', 'bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-teal-500'][i % 5]} />
                ))}
              </div>
            }
          </div>
        </div>

        {/* Right: Recent activity + members */}
        <div className="space-y-4">
          {/* Recent Presensi */}
          <div className="bento-card rounded-3xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity size={15} className="text-purple-600" /> Presensi Terkini
              </h4>
              <button onClick={() => onNavigate('attendance')} className="text-[11px] font-bold text-purple-600 hover:text-purple-800 inline-flex items-center gap-1 cursor-pointer">
                Lihat Semua <ArrowRight size={11} />
              </button>
            </div>
            <div className="space-y-2">
              {records.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {r.nama?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[11px] text-slate-900 truncate">{r.nama}</p>
                    <p className="text-[10px] text-slate-400 truncate">{r.workshop_title}</p>
                  </div>
                  {r.bukti_file && <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">✓</span>}
                </div>
              ))}
              {records.length === 0 && <p className="text-center text-slate-400 py-4 text-xs">Belum ada peserta.</p>}
            </div>
          </div>

          {/* Members Snapshot */}
          <div className="bento-card rounded-2xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus size={15} className="text-teal-600" /> Team Lab
              </h4>
              <button onClick={() => onNavigate('members')} className="text-[11px] font-bold text-teal-600 hover:text-teal-800 inline-flex items-center gap-1 cursor-pointer">
                Kelola <ArrowRight size={11} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100 text-center">
                <p className="font-extrabold text-xl text-teal-700">{(members || []).length}</p>
                <p className="text-[10px] font-semibold text-teal-600">Total</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <p className="font-extrabold text-xl text-emerald-700">{activeMembers}</p>
                <p className="text-[10px] font-semibold text-emerald-600">Aktif</p>
              </div>
            </div>
            {(members || []).length === 0 && (
              <button onClick={() => onNavigate('members')} className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 cursor-pointer">
                + Tambah Team Pertama
              </button>
            )}
          </div>

          {/* System Health */}
          <div className="bento-card rounded-2xl p-4 border border-purple-200">
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Cpu size={15} className="text-indigo-600" /> Status Sistem
            </h4>
            <div className="space-y-2">
              {[
                { label: 'Firebase Cloud', ok: fbStatus.isConfigured, detail: fbStatus.isConfigured ? fbStatus.projectId : 'Mode lokal' },
                { label: 'Workshop Aktif', ok: openWorkshops.length > 0, detail: `${openWorkshops.length} terbuka` },
                { label: 'Presensi', ok: records.length > 0, detail: `${records.length} entri` },
                { label: 'Galeri Foto', ok: gallery.length > 0, detail: `${gallery.length} foto` },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">{s.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[10px]">{s.detail}</span>
                    <span className={`w-2 h-2 rounded-full ${s.ok ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 8. Calendar & Scheduling Panel
// ==========================================
function CalendarPanel({ workshops = [], onNavigate }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => {
    const t = new Date();
    setViewDate(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelectedDate(t.toISOString().split('T')[0]);
  };

  const todayStr = today.toISOString().split('T')[0];

  // Filtered workshops
  const filteredWorkshops = workshops.filter(w => {
    const matchStatus = filterStatus === 'all' || w.status === filterStatus;
    const matchSearch = !search || w.title?.toLowerCase().includes(search.toLowerCase()) || w.speaker?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Map workshops by date
  const wsByDate = {};
  filteredWorkshops.forEach(w => {
    if (!wsByDate[w.date]) wsByDate[w.date] = [];
    wsByDate[w.date].push(w);
  });

  const selectedEvents = wsByDate[selectedDate] || [];

  // Upcoming workshops (next 30 days)
  const upcomingList = workshops
    .filter(w => w.date >= todayStr && w.status === 'open')
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-900 flex items-center gap-2">
            <Calendar className="text-purple-600" size={22} />
            Kalender
          </h2>
          <p className="text-xs text-slate-500">
            Penjadwalan kegiatan workshop ilmiah, praktikum microleading, dan agenda akademik.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('workshops')}
            className="btn-shimmer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/25 cursor-pointer"
          >
            <Plus size={15} />
            <span>Tambah Workshop Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Navigation Bar */}
      <div className="bento-card rounded-2xl p-4 border border-purple-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button onClick={prevMonth} className="p-2 rounded-xl border border-purple-200 hover:bg-purple-50 text-slate-700 cursor-pointer">
            <ChevronLeft size={16} />
          </button>
          <div className="text-center px-4 py-1.5 rounded-xl bg-purple-50 border border-purple-200 font-display font-extrabold text-sm text-purple-900 min-w-[160px]">
            {monthNames[month]} {year}
          </div>
          <button onClick={nextMonth} className="p-2 rounded-xl border border-purple-200 hover:bg-purple-50 text-slate-700 cursor-pointer">
            <ChevronRight size={16} />
          </button>
          <button onClick={goToday} className="px-3 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 cursor-pointer ml-1">
            Hari Ini
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Status Filters */}
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs">
            {[['all', 'Semua'], ['open', '● Terbuka'], ['closed', '○ Ditutup']].map(([s, lbl]) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${filterStatus === s ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {lbl}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative flex-1 md:w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari agenda..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-purple-200 text-xs bg-white focus:outline-none focus:border-purple-600"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar & Day Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 bento-card rounded-3xl p-5 border border-purple-200">
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {dayNames.map(d => (
              <div key={d} className="text-xs font-extrabold text-slate-400 uppercase py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[72px] sm:min-h-[90px] rounded-2xl bg-slate-50/50 border border-transparent opacity-30" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const dayEvents = wsByDate[dateStr] || [];

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[72px] sm:min-h-[90px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${isSelected
                      ? 'bg-purple-50/80 border-purple-600 ring-2 ring-purple-600/20 shadow-md'
                      : isToday
                        ? 'bg-white border-purple-300 ring-1 ring-purple-300 shadow-xs'
                        : 'bg-white hover:bg-purple-50/40 border-slate-200 hover:border-purple-200'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${isToday
                          ? 'bg-purple-600 text-white shadow-sm'
                          : isSelected
                            ? 'text-purple-700 font-black'
                            : 'text-slate-700'
                        }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>

                  {/* Event Chips */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map(ev => (
                      <div
                        key={ev.id}
                        title={`${ev.title} (${ev.time})`}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate border ${ev.status === 'open'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[8px] font-bold text-purple-600 text-right pr-1">
                        +{dayEvents.length - 2} lagi
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bento-card rounded-3xl p-5 border border-purple-200">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 mb-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600">Agenda Terpilih</p>
                <h3 className="font-display font-extrabold text-base text-slate-900">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                {selectedEvents.length} Kegiatan
              </span>
            </div>

            {selectedEvents.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Calendar size={28} className="mx-auto opacity-40 text-purple-400" />
                <p className="text-xs">Tidak ada jadwal workshop pada tanggal ini.</p>
                <button
                  onClick={() => onNavigate('workshops')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 cursor-pointer inline-flex items-center gap-1 mt-2"
                >
                  <Plus size={13} /> Buat Workshop
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map(ev => (
                  <div key={ev.id} className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50/60 border border-purple-200 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-xs text-slate-900 leading-snug">{ev.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 border ${ev.status === 'open' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        {ev.status === 'open' ? 'Terbuka' : 'Ditutup'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <Clock size={12} className="text-purple-600 shrink-0" />
                        <span>{ev.time || 'Waktu belum diatur'}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Users size={12} className="text-purple-600 shrink-0" />
                        <span>Narasumber: <strong>{ev.speaker}</strong></span>
                      </p>
                      {ev.location && (
                        <p className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-purple-600 shrink-0" />
                          <span>{ev.location}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-purple-100 flex justify-end">
                      <button
                        onClick={() => onNavigate('workshops')}
                        className="text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer inline-flex items-center gap-1"
                      >
                        Kelola di Workshop Panel <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Snapshot */}
          <div className="bento-card rounded-3xl p-5 border border-purple-200">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Clock size={14} className="text-purple-600" />
              Workshop Mendatang ({upcomingList.length})
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {upcomingList.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">Belum ada workshop yang dibuka.</p>
              )}
              {upcomingList.slice(0, 5).map(ws => (
                <div
                  key={ws.id}
                  onClick={() => setSelectedDate(ws.date)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 transition-all cursor-pointer flex items-center gap-2.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex flex-col items-center justify-center shrink-0 leading-none">
                    <span className="text-[9px] font-bold uppercase">{new Date(ws.date + 'T00:00:00').toLocaleDateString('id-ID', { month: 'short' })}</span>
                    <span className="text-xs font-black">{new Date(ws.date + 'T00:00:00').getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-slate-900 truncate">{ws.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">{ws.speaker} • {ws.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 9. Analytics & Reporting Panel
// ==========================================
function AnalyticsPanel({ workshops = [], records = [] }) {
  const withBuktiCount = records.filter(r => r.bukti_file).length;
  const buktiRatio = records.length > 0 ? Math.round((withBuktiCount / records.length) * 100) : 0;
  const openCount = workshops.filter(w => w.status === 'open').length;
  const avgPerWorkshop = workshops.length > 0 ? Math.round(records.length / workshops.length) : 0;

  // Workshop popularity rankings
  const rankedWorkshops = workshops.map(w => {
    const wsRecords = records.filter(r => r.workshop_title === w.title);
    return {
      id: w.id,
      title: w.title,
      speaker: w.speaker,
      date: w.date,
      count: wsRecords.length,
      buktiCount: wsRecords.filter(r => r.bukti_file).length,
      status: w.status,
    };
  }).sort((a, b) => b.count - a.count);

  const maxParticipants = Math.max(...rankedWorkshops.map(w => w.count), 1);

  // Time slot distribution
  const pagiCount = workshops.filter(w => w.time?.includes('07') || w.time?.includes('08') || w.time?.includes('09') || w.time?.includes('10')).length;
  const siangCount = workshops.filter(w => w.time?.includes('13') || w.time?.includes('14') || w.time?.includes('15') || w.time?.includes('16')).length;
  const malamCount = workshops.filter(w => w.time?.includes('19') || w.time?.includes('20')).length;

  // Export report to Formatted Official Excel
  const handleExportExcel = () => {
    playClick();
    const headers = ['No', 'Judul Workshop', 'Narasumber', 'Tanggal Pelaksanaan', 'Status Kegiatan', 'Total Presensi', 'Bukti Valid'];
    const rows = rankedWorkshops.map((w, i) => [
      i + 1,
      w.title,
      w.speaker,
      w.date,
      w.status === 'open' ? 'Terbuka' : 'Ditutup',
      w.count,
      w.buktiCount
    ]);

    exportStyledExcel({
      filename: `Laporan_Analitik_Lab_MPI`,
      title: 'LAPORAN REKAPITULASI ANALITIK KINERJA WORKSHOP & PARTISIPASI PESERTA',
      subtitle: 'Laboratorium Manajemen Pendidikan Islam (MPI) FTK UIN Alauddin Makassar',
      activityName: 'Evaluasi & Peringkat Workshop Ilmiah',
      summaryStats: [
        { label: 'TOTAL WORKSHOP', value: `${workshops.length}`, sublabel: `${openCount} Sesi Terbuka` },
        { label: 'TOTAL PRESENSI', value: `${records.length} Orang`, sublabel: 'Akumulasi Mahasiswa' },
        { label: 'RATA-RATA PESERTA', value: `${avgPerWorkshop}`, sublabel: 'Peserta / Workshop' },
        { label: 'KELENGKAPAN BUKTI', value: `${buktiRatio}%`, sublabel: `${withBuktiCount} Berkas Valid` }
      ],
      headers,
      rows,
      sheetName: 'Analitik Kinerja'
    });
    playSuccess();
    showToast('Laporan analitik resmi Excel berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl text-slate-900 flex items-center gap-2">
            <BarChart2 className="text-purple-600" size={22} />
            Analitik
          </h2>
          <p className="text-xs text-slate-500">
            Statistik keterlibatan peserta, rekapitulasi data presensi, dan kinerja kegiatan ilmiah.
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="btn-shimmer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 shadow-md shadow-emerald-600/25 cursor-pointer"
        >
          <Download size={15} />
          <span>Unduh Laporan Analitik Excel</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Workshop', val: workshops.length, sub: `${openCount} aktif buka`, color: 'from-purple-500 to-indigo-600', icon: Calendar },
          { label: 'Total Presensi', val: records.length, sub: 'Peserta terdata', color: 'from-blue-500 to-cyan-600', icon: Users },
          { label: 'Rata-rata Partisipan', val: avgPerWorkshop, sub: 'Peserta / workshop', color: 'from-amber-500 to-orange-600', icon: TrendingUp },
          { label: 'Kelengkapan Bukti', val: `${buktiRatio}%`, sub: `${withBuktiCount} berkas foto valid`, color: 'from-emerald-500 to-green-600', icon: CheckCircle },
        ].map(s => (
          <div key={s.label} className={`rounded-3xl p-5 bg-gradient-to-br ${s.color} text-white shadow-lg`}>
            <s.icon size={22} className="mb-2 opacity-80" />
            <p className="font-display font-extrabold text-3xl">{s.val}</p>
            <p className="text-xs font-bold opacity-90 mt-1">{s.label}</p>
            <p className="text-[10px] opacity-75">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Visual Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Ranked Popularity */}
        <div className="lg:col-span-8 bento-card rounded-3xl p-6 border border-purple-200">
          <h3 className="font-display font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
            <Award className="text-purple-600" size={18} />
            Peringkat Workshop Terpopuler Berdasarkan Peserta
          </h3>

          <div className="space-y-4">
            {rankedWorkshops.length === 0 && (
              <p className="text-center text-slate-400 py-8 text-xs">Belum ada data kegiatan workshop.</p>
            )}
            {rankedWorkshops.slice(0, 6).map((w, idx) => {
              const pct = Math.round((w.count / maxParticipants) * 100);
              return (
                <div key={w.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 truncate max-w-[70%]">
                      #{idx + 1} {w.title}
                    </span>
                    <span className="font-extrabold text-purple-700">
                      {w.count} Peserta <span className="text-slate-400 font-normal">({w.buktiCount} bukti)</span>
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribution by Time */}
        <div className="lg:col-span-4 bento-card rounded-3xl p-6 border border-purple-200 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
              <Clock className="text-purple-600" size={18} />
              Distribusi Waktu Kegiatan
            </h3>

            <div className="space-y-3">
              {[
                { label: 'Sesi Pagi (07.00 - 12.00 WITA)', count: pagiCount, color: 'bg-amber-500' },
                { label: 'Sesi Siang/Sore (13.00 - 17.00 WITA)', count: siangCount, color: 'bg-purple-600' },
                { label: 'Sesi Malam (19.00 - 21.30 WITA)', count: malamCount, color: 'bg-indigo-700' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <span className="font-extrabold text-slate-900">{item.count} Workshop</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${workshops.length > 0 ? (item.count / workshops.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-purple-50 text-[11px] text-purple-900 border border-purple-200">
            💡 <strong>Rekomendasi Waktu:</strong> Sesi Pagi & Siang memiliki tingkat presensi tertinggi di laboratorium.
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bento-card rounded-3xl p-6 border border-purple-200 overflow-hidden">
        <h3 className="font-display font-extrabold text-slate-900 text-base mb-4">
          Tabel Rekapitulasi Partisipasi Seluruh Kegiatan
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-purple-100 text-slate-400 uppercase text-[10px] font-extrabold">
                <th className="py-2.5 px-3">Kegiatan Workshop</th>
                <th className="py-2.5 px-3">Narasumber</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3 text-center">Partisipan</th>
                <th className="py-2.5 px-3 text-center">Kelengkapan Bukti</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankedWorkshops.map(w => (
                <tr key={w.id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 max-w-xs">{w.title}</td>
                  <td className="py-3 px-3 text-slate-600">{w.speaker}</td>
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{w.date}</td>
                  <td className="py-3 px-3 text-center font-extrabold text-purple-700">{w.count}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                      {w.count > 0 ? Math.round((w.buktiCount / w.count) * 100) : 0}% Valid
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${w.status === 'open' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {w.status === 'open' ? 'Terbuka' : 'Ditutup'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 10. Settings & System Management Panel
// ==========================================
function SettingsPanel() {
  const fbStatus = getFirebaseStatus();

  const handleBackup = () => {
    playClick();
    const backupData = {
      timestamp: new Date().toISOString(),
      mpi_workshops: JSON.parse(localStorage.getItem('mpi_workshops') || '[]'),
      mpi_records: JSON.parse(localStorage.getItem('mpi_attendance') || '[]'),
      mpi_members: JSON.parse(localStorage.getItem('mpi_members') || '[]'),
      mpi_news: JSON.parse(localStorage.getItem('mpi_news') || '[]'),
      mpi_gallery: JSON.parse(localStorage.getItem('mpi_gallery') || '[]'),
      mpi_cert_settings: JSON.parse(localStorage.getItem('mpi_cert_settings') || '{}'),
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MPI_Lab_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    playSuccess();
    showToast('Seluruh data laboratorium tersimpan ke file JSON cadangan.', 'success');
  };

  const handleRestore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const ok = await showConfirm({
          title: 'Pulihkan Data?',
          message: 'Data saat ini akan ditimpa dengan data cadangan ini. Lanjutkan?',
          confirmText: 'Ya, Pulihkan',
          type: 'warning'
        });
        if (!ok) return;

        if (data.mpi_workshops) localStorage.setItem('mpi_workshops', JSON.stringify(data.mpi_workshops));
        if (data.mpi_records) localStorage.setItem('mpi_attendance', JSON.stringify(data.mpi_records));
        if (data.mpi_members) localStorage.setItem('mpi_members', JSON.stringify(data.mpi_members));
        if (data.mpi_news) localStorage.setItem('mpi_news', JSON.stringify(data.mpi_news));
        if (data.mpi_gallery) localStorage.setItem('mpi_gallery', JSON.stringify(data.mpi_gallery));
        if (data.mpi_cert_settings) localStorage.setItem('mpi_cert_settings', JSON.stringify(data.mpi_cert_settings));

        playSuccess();
        showAlert({ title: 'Restorasi Selesai', message: 'Data berhasil dipulihkan. Halaman akan disegarkan.', type: 'success' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        playError();
        showAlert({ title: 'Gagal Membaca File', message: 'File JSON cadangan rusak atau tidak valid.', type: 'danger' });
      }
    };
    reader.readAsText(file);
  };

  const handleClearCache = async () => {
    const ok = await showConfirm({
      title: 'Segarkan Cache Sistem?',
      message: 'Ini akan menyegarkan data sementara tanpa menghapus database utama.',
      confirmText: 'Segarkan Sekarang',
      type: 'warning'
    });
    if (!ok) return;
    playSuccess();
    showToast('Cache dibersihkan, sistem disegarkan ulang.', 'success');
    setTimeout(() => window.location.reload(), 1000);
  };

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      playError();
      showAlert({ title: 'Konfirmasi Salah', message: 'Password baru dan konfirmasi password tidak cocok!', type: 'warning' });
      return;
    }
    setPwLoading(true);
    try {
      await changeAdminPassword(pwForm.current, pwForm.newPw);
      playSuccess();
      showAlert({
        title: 'Password Berhasil Diubah!',
        message: 'Kata sandi baru administrator telah tersimpan ke Cloud Firebase dan LocalStorage.',
        type: 'success'
      });
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      playError();
      showAlert({
        title: 'Gagal Mengubah Password',
        message: err.message || 'Terjadi kesalahan saat menyimpan password baru.',
        type: 'danger'
      });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display font-extrabold text-xl text-slate-900 flex items-center gap-2">
          <Sliders className="text-purple-600" size={22} />
          Pengaturan
        </h2>
        <p className="text-xs text-slate-500">
          Konfigurasi identitas laboratorium, jam operasional, koneksi cloud, dan pencadangan data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identitas Lab */}
        <div className="bento-card rounded-3xl p-6 border border-purple-200 space-y-4">
          <h3 className="font-display font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Shield className="text-purple-600" size={18} />
            Identitas Resmi Laboratorium
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Nama Laboratorium:</span>
              <p className="font-extrabold text-slate-800 text-sm">Laboratorium Manajemen Pendidikan Islam (Microleading)</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Fakultas & Universitas:</span>
              <p className="font-semibold text-slate-700">Fakultas Tarbiyah dan Keguruan, UIN Alauddin Makassar</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Lokasi Ruangan:</span>
              <p className="font-semibold text-slate-700">Gedung FTK Lantai 2, Kampus II UINAM Samata Gowa</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Jam Operasional Pelayanan:</span>
              <p className="font-semibold text-purple-700">Senin – Jumat: 08.00 – 16.00 WITA</p>
            </div>
          </div>
        </div>

        {/* Status Database & Cloud */}
        <div className="bento-card rounded-3xl p-6 border border-purple-200 space-y-4">
          <h3 className="font-display font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Cpu className="text-indigo-600" size={18} />
            Status Cloud & Database
          </h3>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-bold">Koneksi Database:</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${fbStatus.isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {fbStatus.isConfigured ? '● Firebase Firestore Aktif' : '○ Mode Lokal (Browser)'}
              </span>
            </div>
            {fbStatus.isConfigured && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold">Project ID:</span>
                <span className="font-mono text-purple-700 font-bold">{fbStatus.projectId}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-bold">Sinkronisasi Realtime:</span>
              <span className="text-emerald-600 font-semibold">Tersambung Otomatis</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleClearCache}
              className="w-full py-2.5 rounded-xl border border-purple-200 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} />
              <span>Segarkan Cache & Muat Ulang</span>
            </button>
          </div>
        </div>

        {/* Keamanan Akun & Ubah Password */}
        <div className="md:col-span-2 bento-card rounded-3xl p-6 border border-purple-200 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-display font-extrabold text-slate-900 text-base flex items-center gap-2">
              <KeyRound className="text-purple-600" size={18} />
              Keamanan Akun & Ubah Password Admin
            </h3>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Tersinkron ke Cloud Firebase
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Perbarui kata sandi masuk administrator untuk melindungi akses ke dashboard pengelolaan data laboratorium.
          </p>

          <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Password Saat Ini *</label>
              <input
                type={showPassword ? "text" : "password"}
                value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                placeholder="Ketik password lama..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Password Baru *</label>
              <input
                type={showPassword ? "text" : "password"}
                value={pwForm.newPw}
                onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                placeholder="Min. 5 karakter..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Konfirmasi Password *</label>
              <input
                type={showPassword ? "text" : "password"}
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Ulangi password baru..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm bg-white focus:border-purple-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3 flex items-center justify-between flex-wrap gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={e => setShowPassword(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Tampilkan karakter password</span>
              </label>

              <button
                type="submit"
                disabled={pwLoading}
                className="btn-shimmer px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-600/25 cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                <Save size={14} />
                <span>{pwLoading ? 'Menyimpan ke Cloud...' : 'Simpan Password Baru'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Backup & Restore */}
        <div className="md:col-span-2 bento-card rounded-3xl p-6 border border-purple-200 space-y-4">
          <h3 className="font-display font-extrabold text-slate-900 text-base flex items-center gap-2">
            <HardDrive className="text-emerald-600" size={18} />
            Pencadangan & Pemulihan Sistem (Backup & Restore)
          </h3>
          <p className="text-xs text-slate-500">
            Amankan data seluruh kegiatan workshop, rekaman presensi, sertifikat, serta profil personil ke dalam file cadangan JSON yang aman dan dapat dipulihkan sewaktu-waktu.
          </p>

          <div className="flex items-center gap-3 flex-wrap pt-2">
            <button
              onClick={handleBackup}
              className="btn-shimmer px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-600/25 cursor-pointer flex items-center gap-2"
            >
              <Download size={14} />
              <span>Ekspor Backup Lengkap (JSON)</span>
            </button>

            <label className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs cursor-pointer flex items-center gap-2">
              <Upload size={14} className="text-purple-600" />
              <span>Impor & Pulihkan Data Cadangan</span>
              <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Main Admin Dashboard Component
// ==========================================
export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workshops, setWorkshops] = useState([]);
  const [records, setRecords] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [news, setNews] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [members, setMembers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mpi_members')) || []; } catch { return []; }
  });

  const navigate = useNavigate();
  const user = getCurrentUser();

  const loadData = () => {
    Promise.all([getAllWorkshops(), getAttendance(), getNews(), getGallery(), getMembers(), getRegistrations()]).then(([w, r, n, g, m, reg]) => {
      setWorkshops(w || []);
      setRecords(r || []);
      setNews(n || []);
      setGallery(g || []);
      setMembers(m || []);
      setRegistrations(reg || []);
    });
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadData();
    const handleSync = () => {
      getMembers().then(data => { if (data) setMembers(data); });
    };
    const handleGallerySync = (e) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setGallery(e.detail);
      } else {
        getGallery().then(data => { if (data) setGallery(data); });
      }
    };
    const handleRegSync = () => {
      getRegistrations().then(data => { if (data) setRegistrations(data); });
    };
    window.addEventListener('mpi_members_updated', handleSync);
    window.addEventListener('mpi_gallery_updated', handleGallerySync);
    window.addEventListener('mpi_registrations_updated', handleRegSync);
    return () => {
      window.removeEventListener('mpi_members_updated', handleSync);
      window.removeEventListener('mpi_gallery_updated', handleGallerySync);
      window.removeEventListener('mpi_registrations_updated', handleRegSync);
    };
  }, []);

  const handleLogout = () => {
    playClick();
    clearCurrentUser();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-purple-100 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
      >
        <div>
          {/* Logo Brand */}
          <div className="p-5 border-b border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 p-1 flex items-center justify-center">
                <img src="/img/1.png" alt="" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <p className="font-display font-extrabold text-sm text-slate-900 leading-none">Lab Microleading</p>
                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mt-0.5">Admin Workspace</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { playClick(); setActiveSection(id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${activeSection === id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
                  }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-purple-100 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-slate-900 truncate">{user?.username}</p>
              <p className="text-[10px] text-slate-400 uppercase">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut size={13} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <div className="glass-nav border-b border-purple-100 px-4 sm:px-6 py-3.5 flex items-center gap-3.5 sticky top-0 z-20">
          <button
            onClick={() => { playClick(); setSidebarOpen(true); }}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-700 cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu size={20} />
          </button>

          <h1 className="font-display font-bold text-slate-900 text-base sm:text-lg flex-1 truncate">
            {NAV_ITEMS.find(n => n.id === activeSection)?.label || 'Dashboard'}
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-1.5 rounded-xl border border-purple-200 transition-colors cursor-pointer"
            >
              Lihat Website
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeSection === 'overview' && (
                <OverviewPanel
                  workshops={workshops}
                  records={records}
                  news={news}
                  gallery={gallery}
                  members={members}
                  registrations={registrations}
                  onNavigate={setActiveSection}
                />
              )}
              {activeSection === 'members' && <MembersPanel />}
              {activeSection === 'calendar' && <CalendarPanel workshops={workshops} onNavigate={setActiveSection} />}
              {activeSection === 'workshops' && <WorkshopPanel />}
              {activeSection === 'registrations' && <RegistrationsPanel />}
              {activeSection === 'attendance' && <AttendancePanel />}
              {activeSection === 'analytics' && <AnalyticsPanel workshops={workshops} records={records} />}
              {activeSection === 'certificates' && <CertificateStudioPanel />}
              {activeSection === 'news' && <NewsPanel />}
              {activeSection === 'gallery' && <GalleryPanel gallery={gallery} onReload={loadData} />}
              {activeSection === 'settings' && <SettingsPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
