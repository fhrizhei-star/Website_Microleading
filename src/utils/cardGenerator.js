import QRCode from 'qrcode';

/**
 * Format tanggal Indonesia
 */
function formatIndoDate(dateStr) {
  if (!dateStr) return '-';
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

/**
 * Helper: menggambar persegi panjang dengan sudut membulat
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }
  ctx.closePath();
}

/**
 * Helper: memuat gambar ke elemen Image
 */
function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Helper: menggambar teks terbungkus (multiline wrap)
 */
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text || '').split(' ');
  let line = '';
  let curY = y;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1 && n < words.length - 1) {
        // truncate remaining with ellipsis
        const remaining = words.slice(n).join(' ');
        let truncated = remaining;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        ctx.fillText(truncated.trim() + '...', x, curY);
        return curY;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
  return curY;
}

/**
 * Render Kartu Registrasi ke HTML5 Canvas secara presisi dan menghasilkan URL JPEG
 * @param {object} ticket Data pendaftaran
 * @returns {Promise<string>} Base64 Data URL berformat image/jpeg
 */
export async function renderRegistrationCardToJPEG(ticket) {
  if (!ticket) throw new Error('Data tiket pendaftaran tidak valid.');

  // Dimensi Kanvas Kartu HD (Skala 2x Retina untuk ketajaman saat dicetak)
  const W = 900;
  const H = 1260;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background luar kanvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Koordinat batas kartu
  const cardX = 35;
  const cardY = 35;
  const cardW = W - 70; // 830px
  const cardH = H - 70; // 1190px
  const cardR = 32;

  // Siapkan QR Code lokal (offline, tanpa dependensi server eksternal)
  const qrData = `LAB-MPI|${ticket.reg_code || ''}|${ticket.nim_nip || ''}|${ticket.nama || ''}|${ticket.workshop_id || ''}`;
  let qrImg = null;
  try {
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 320,
      margin: 1,
      color: { dark: '#1e1b4b', light: '#ffffff' }
    });
    qrImg = await loadImage(qrDataUrl);
  } catch (e) {
    console.warn('QR Code generation notice:', e);
  }

  // Muat logo institusi jika ada
  const logoImg = await loadImage('/img/1.png');

  // Simpan clipping area kartu utama
  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.clip();

  // ==========================================
  // 1. HEADER SECTION (Gradien Ungu Gelap Mewah)
  // ==========================================
  const headerH = 370;
  const headerGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + headerH);
  headerGrad.addColorStop(0, '#3b0764');   // deep purple
  headerGrad.addColorStop(0.5, '#1e1b4b'); // indigo night
  headerGrad.addColorStop(1, '#0f172a');   // slate dark

  ctx.fillStyle = headerGrad;
  ctx.fillRect(cardX, cardY, cardW, headerH);

  // Efek glow latar belakang header
  const glow1 = ctx.createRadialGradient(cardX + cardW - 80, cardY + 50, 10, cardX + cardW - 80, cardY + 50, 180);
  glow1.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
  glow1.addColorStop(1, 'rgba(168, 85, 247, 0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(cardX, cardY, cardW, headerH);

  const glow2 = ctx.createRadialGradient(cardX + 80, cardY + headerH - 40, 10, cardX + 80, cardY + headerH - 40, 150);
  glow2.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
  glow2.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(cardX, cardY, cardW, headerH);

  // Logo Lab di sebelah kiri atas
  let textStartX = cardX + 35;
  if (logoImg) {
    // Kotak logo putih membulat
    drawRoundedRect(ctx, cardX + 35, cardY + 30, 60, 60, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.drawImage(logoImg, cardX + 41, cardY + 36, 48, 48);
    textStartX = cardX + 110;
  }

  // Badge pill "BUKTI PENDAFTARAN RESMI DIGITAL"
  const badgeX = textStartX;
  const badgeY = cardY + 30;
  drawRoundedRect(ctx, badgeX, badgeY, 260, 26, 13);
  ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(216, 180, 254, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = 'bold 11px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#fde047'; // amber
  ctx.textAlign = 'left';
  ctx.fillText('✦ BUKTI PENDAFTARAN RESMI DIGITAL', badgeX + 12, badgeY + 17);

  // Judul Header
  ctx.font = '800 24px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('E-Ticket Workshop Lab MPI', textStartX, cardY + 85);

  // Subjudul
  ctx.font = '500 13px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#e9d5ff';
  ctx.fillText('Fakultas Tarbiyah dan Keguruan UIN Alauddin Makassar', textStartX, cardY + 107);

  // Kotak Besar Nomor Registrasi
  const regBoxW = cardW - 70;
  const regBoxX = cardX + 35;
  const regBoxY = cardY + 245;
  const regBoxH = 92;

  drawRoundedRect(ctx, regBoxX, regBoxY, regBoxW, regBoxH, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 12px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#ddd6fe';
  ctx.fillText('NOMOR REGISTRASI PENDAFTARAN:', regBoxX + 24, regBoxY + 32);

  ctx.font = '800 28px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = '#fde047'; // golden amber
  ctx.fillText(String(ticket.reg_code || '-'), regBoxX + 24, regBoxY + 70);

  // Status Terkonfirmasi Badge di dalam kotak
  const statusW = 145;
  const statusX = regBoxX + regBoxW - statusW - 20;
  const statusY = regBoxY + 28;
  drawRoundedRect(ctx, statusX, statusY, statusW, 36, 18);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = 'bold 12px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#a7f3d0';
  ctx.textAlign = 'center';
  ctx.fillText('✓ TERVERIFIKASI', statusX + statusW / 2, statusY + 23);

  // ==========================================
  // 2. TICKET BODY (Putih Bersih)
  // ==========================================
  const bodyY = cardY + headerH;
  const bodyH = cardH - headerH;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cardX, bodyY, cardW, bodyH);

  // Garis Putus-putus pembatas tiket (Dashed Line)
  ctx.save();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(cardX + 40, bodyY);
  ctx.lineTo(cardX + cardW - 40, bodyY);
  ctx.stroke();
  ctx.restore();

  // ==========================================
  // 3. KOTAK IDENTITAS & QR CODE
  // ==========================================
  const idBoxX = cardX + 35;
  const idBoxY = bodyY + 30;
  const idBoxW = cardW - 70;
  const idBoxH = 190;

  drawRoundedRect(ctx, idBoxX, idBoxY, idBoxW, idBoxH, 20);
  ctx.fillStyle = '#faf5ff'; // purple-50
  ctx.fill();
  ctx.strokeStyle = '#e9d5ff'; // purple-200
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // QR Code Image
  const qrSize = 148;
  const qrX = idBoxX + 20;
  const qrY = idBoxY + (idBoxH - qrSize) / 2;

  // Background frame QR Code
  drawRoundedRect(ctx, qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 14);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#d8b4fe';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (qrImg) {
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  }

  // Teks Identitas Peserta
  const textX = qrX + qrSize + 28;
  let curIdY = idBoxY + 38;

  ctx.textAlign = 'left';
  ctx.font = 'bold 11px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('NAMA PESERTA:', textX, curIdY);
  curIdY += 24;

  ctx.font = '800 20px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#0f172a';
  // Batasi panjang teks nama
  const maxNamaW = idBoxW - (textX - idBoxX) - 20;
  let namaStr = String(ticket.nama || '-');
  while (ctx.measureText(namaStr).width > maxNamaW && namaStr.length > 5) {
    namaStr = namaStr.slice(0, -1);
  }
  ctx.fillText(namaStr + (namaStr !== ticket.nama ? '...' : ''), textX, curIdY);
  curIdY += 34;

  ctx.font = 'bold 11px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('NIM / NIP:', textX, curIdY);
  curIdY += 22;

  ctx.font = '700 16px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillStyle = '#7e22ce'; // purple-700
  ctx.fillText(String(ticket.nim_nip || '-'), textX, curIdY);
  curIdY += 32;

  ctx.font = 'bold 11px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('INSTANSI:', textX, curIdY);
  curIdY += 20;

  ctx.font = '600 14px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(String(ticket.instansi || 'UIN Alauddin Makassar'), textX, curIdY);

  // ==========================================
  // 4. KOTAK DETAIL SESI KEGIATAN WORKSHOP
  // ==========================================
  const wsBoxX = cardX + 35;
  const wsBoxY = idBoxY + idBoxH + 22;
  const wsBoxW = cardW - 70;
  const wsBoxH = 265;

  drawRoundedRect(ctx, wsBoxX, wsBoxY, wsBoxW, wsBoxH, 20);
  ctx.fillStyle = '#f8fafc'; // slate-50
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0'; // slate-200
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 12px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#7e22ce';
  ctx.fillText('DETAIL SESI KEGIATAN WORKSHOP:', wsBoxX + 24, wsBoxY + 32);

  // Judul Workshop (bisa 2 baris)
  ctx.font = '800 19px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#0f172a';
  const endWsY = drawWrappedText(ctx, ticket.workshop_title || 'Workshop Pelatihan', wsBoxX + 24, wsBoxY + 62, wsBoxW - 48, 26, 2);

  // Garis pemisah tipis
  const dividerY = Math.max(endWsY + 18, wsBoxY + 115);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(wsBoxX + 24, dividerY);
  ctx.lineTo(wsBoxX + wsBoxW - 24, dividerY);
  ctx.stroke();

  // Grid Info 2 Kolom
  const col1X = wsBoxX + 24;
  const col2X = wsBoxX + (wsBoxW / 2) + 10;
  const row1Y = dividerY + 28;
  const row2Y = dividerY + 82;

  // Item 1: Instruktur
  ctx.font = 'bold 11px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('NARASUMBER / INSTRUKTUR:', col1X, row1Y);
  ctx.font = '700 14px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText(String(ticket.speaker || '-'), col1X, row1Y + 20);

  // Item 2: Tanggal Pelaksanaan
  ctx.font = 'bold 11px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('HARI & TANGGAL:', col2X, row1Y);
  ctx.font = '700 14px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText(formatIndoDate(ticket.workshop_date), col2X, row1Y + 20);

  // Item 3: Waktu Pelaksanaan
  ctx.font = 'bold 11px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('WAKTU PELAKSANAAN:', col1X, row2Y);
  ctx.font = '700 14px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText(String(ticket.workshop_time || '-'), col1X, row2Y + 20);

  // Item 4: Lokasi
  ctx.font = 'bold 11px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('LOKASI RUANGAN:', col2X, row2Y);
  ctx.font = '700 14px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText(String(ticket.workshop_location || 'Lab Microleading MPI'), col2X, row2Y + 20);

  // ==========================================
  // 5. KOTAK PETUNJUK RESMI (Kuning Amber)
  // ==========================================
  const alertBoxX = cardX + 35;
  const alertBoxY = wsBoxY + wsBoxH + 20;
  const alertBoxW = cardW - 70;
  const alertBoxH = 105;

  drawRoundedRect(ctx, alertBoxX, alertBoxY, alertBoxW, alertBoxH, 18);
  ctx.fillStyle = '#fffbeb'; // amber-50
  ctx.fill();
  ctx.strokeStyle = '#fde68a'; // amber-200
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = '800 13px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#92400e'; // amber-800
  ctx.fillText('💡 Petunjuk Kehadiran Hari H:', alertBoxX + 22, alertBoxY + 30);

  ctx.font = '500 12px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#78350f'; // amber-900
  const alertText = `Tunjukkan kartu registrasi ini kepada panitia atau masukkan NIM ${ticket.nim_nip || ''} pada portal presensi digital untuk klaim E-Sertifikat otomatis.`;
  drawWrappedText(ctx, alertText, alertBoxX + 22, alertBoxY + 56, alertBoxW - 44, 20, 2);

  // ==========================================
  // 6. FOOTER PENGESAHAN DOKUMEN RESMI
  // ==========================================
  const footerY = alertBoxY + alertBoxH + 34;
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 35, footerY - 14);
  ctx.lineTo(cardX + cardW - 35, footerY - 14);
  ctx.stroke();

  ctx.font = 'bold 12px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#6b21a8';
  ctx.textAlign = 'left';
  ctx.fillText('Laboratorium Microleading MPI • FTK UIN Alauddin Makassar', cardX + 35, footerY + 8);

  ctx.font = 'bold 12px Outfit, -apple-system, sans-serif';
  ctx.fillStyle = '#15803d';
  ctx.textAlign = 'right';
  ctx.fillText('✓ Dokumen Digital Terverifikasi', cardX + cardW - 35, footerY + 8);

  ctx.restore(); // Restore clipping

  // ==========================================
  // 7. BINGKAI KARTU UTAMA & NOTCH KUPON (EFEK POTONGAN TIKET)
  // ==========================================
  // Stroke border kartu luar
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.strokeStyle = '#c084fc'; // purple-400
  ctx.lineWidth = 3;
  ctx.stroke();

  // Potongan Tiket Lingkaran di Kiri dan Kanan (Ticket Notches)
  const notchY = cardY + headerH;
  const notchRadius = 22;

  // Notch Kiri
  ctx.beginPath();
  ctx.arc(cardX, notchY, notchRadius, -Math.PI / 2, Math.PI / 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Notch Kanan
  ctx.beginPath();
  ctx.arc(cardX + cardW, notchY, notchRadius, Math.PI / 2, -Math.PI / 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Ekspor Kanvas ke JPEG dengan kualitas 95%
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Trigger pengunduhan file JPEG kartu registrasi ke perangkat user
 * @param {object} ticket Data pendaftaran
 */
export async function downloadRegistrationCardJPEG(ticket) {
  const dataUrl = await renderRegistrationCardToJPEG(ticket);
  const cleanNim = String(ticket.nim_nip || 'peserta').replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanCode = String(ticket.reg_code || 'TICKET').replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `Kartu-Registrasi-${cleanNim}-${cleanCode}.jpg`;

  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

