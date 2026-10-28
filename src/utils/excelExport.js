/**
 * Professional Styled Excel Export Utility for Lab Microleading MPI FTK UINAM
 * Produces official-grade formatted spreadsheets (.xls) compatible with
 * Microsoft Excel, WPS Office, and Google Sheets, featuring:
 * - Official Ministry of Religious Affairs & UIN Alauddin Makassar Letterhead (Kop Surat)
 * - Report Metadata (Activity Title, Date, Document ID)
 * - Visual Summary Cards & Statistics Box
 * - Crisp Table with Theme Color Headers, Borders, and Zebra Striping
 * - Text Formatting Protection (Preserves leading zeros on NIM and WhatsApp numbers)
 * - Official Signature Approval Blocks
 */

export function exportStyledExcel({
  filename = 'Laporan_Lab_MPI',
  title = 'LAPORAN RESMI LABORATORIUM MICROLEADING MPI',
  subtitle = 'Fakultas Tarbiyah dan Keguruan UIN Alauddin Makassar',
  activityName = 'Kegiatan Laboratorium',
  dateInfo = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  docNumber = `DOK-LAB-MPI/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
  summaryStats = [],
  headers = [],
  rows = [],
  sheetName = 'Laporan Data',
  signerTitle = 'Ketua Jurusan MPI',
  signerName = 'Dr. Ahmad Afiif, M.Si',
  signerNip = '198506152011011009'
}) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalColumns = Math.max(headers.length, 6);

  // Generate Summary Box HTML if stats are provided
  let summaryBoxHtml = '';
  if (summaryStats && summaryStats.length > 0) {
    summaryBoxHtml = `
      <tr style="height: 15px;"><td colspan="${totalColumns}"></td></tr>
      <tr>
        <td colspan="${totalColumns}" style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px 14px; font-family: 'Segoe UI', Arial, sans-serif;">
          <strong style="color: #475569; font-size: 11pt; text-transform: uppercase;">📊 RINGKASAN DATA & STATISTIK EKSEKUTIF:</strong>
          <table style="width: 100%; margin-top: 6px; border-collapse: collapse;">
            <tr>
              ${summaryStats.map(stat => `
                <td style="padding: 6px 12px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; text-align: center;">
                  <span style="display: block; font-size: 9pt; color: #64748b; font-weight: bold;">${stat.label}</span>
                  <span style="display: block; font-size: 14pt; color: #4338ca; font-weight: bold; margin-top: 2px;">${stat.value}</span>
                  ${stat.sublabel ? `<span style="display: block; font-size: 8pt; color: #94a3b8;">${stat.sublabel}</span>` : ''}
                </td>
              `).join('')}
            </tr>
          </table>
        </td>
      </tr>
      <tr style="height: 15px;"><td colspan="${totalColumns}"></td></tr>
    `;
  }

  // Generate Table Header
  const tableHeaderHtml = `
    <tr style="background-color: #9e5ffdff; color: #131313ff; font-family: 'Segoe UI', Arial, sans-serif; height: 35px;">
      ${headers.map((h, i) => `
        <th style="background-color: #9e5ffdff; color: #000000ff; font-weight: bold; font-size: 10pt; text-align: center; border: 1px solid #311068; padding: 8px 10px; vertical-align: middle;">
          ${h}
        </th>
      `).join('')}
    </tr>
  `;

  // Generate Table Rows with Zebra Striping and Protected String Format
  const tableRowsHtml = rows.map((row, index) => {
    const isEven = index % 2 === 0;
    const bgColor = isEven ? '#ffffff' : '#f8fafc';

    return `
      <tr style="background-color: ${bgColor}; font-family: 'Segoe UI', Arial, sans-serif; height: 26px;">
        ${row.map((cell, cellIdx) => {
      const val = cell !== null && cell !== undefined ? String(cell) : '-';

      // Detect alignment based on content or column
      let align = 'left';
      if (cellIdx === 0 || val.length <= 4) align = 'center'; // No column
      if (val.startsWith('REG-') || val.startsWith('CERT/') || val.includes('WITA') || /^\d{4}-\d{2}-\d{2}$/.test(val)) align = 'center';
      if (val === 'Terkonfirmasi' || val === 'Hadir' || val === 'Selesai' || val === 'Dibuka' || val === 'Ditutup') align = 'center';

      // Status colors
      let statusStyle = '';
      if (val === 'Terkonfirmasi' || val === 'Hadir' || val === 'Dibuka') {
        statusStyle = 'background-color: #dcfce7; color: #166534; font-weight: bold; border-radius: 4px;';
      } else if (val === 'Menunggu' || val === 'Belum Hadir') {
        statusStyle = 'background-color: #fef9c3; color: #854d0e; font-weight: bold; border-radius: 4px;';
      } else if (val === 'Ditutup' || val === 'Batal') {
        statusStyle = 'background-color: #fee2e2; color: #991b1b; font-weight: bold; border-radius: 4px;';
      }

      // Protect leading zeros in NIM, Phone, and numeric IDs via mso-number-format
      const isNumericText = /^0\d+$/.test(val) || /^\d{8,}$/.test(val) || val.startsWith('REG-') || val.startsWith('+62');
      const numberFormat = isNumericText ? "mso-number-format:'\\@';" : '';

      return `
            <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 9.5pt; color: #1e293b; text-align: ${align}; vertical-align: middle; ${numberFormat}">
              ${statusStyle ? `<span style="${statusStyle} padding: 2px 8px; display: inline-block;">${val}</span>` : val}
            </td>
          `;
    }).join('')}
      </tr>
    `;
  }).join('');

  // Assemble Complete HTML-Spreadsheet Template
  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${sheetName.slice(0, 31)}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
                <x:FitToPage/>
                <x:Print>
                  <x:FitWidth>1</x:FitWidth>
                  <x:FitHeight>99</x:FitHeight>
                  <x:ValidPrinterInfo/>
                  <x:PaperSizeIndex>9</x:PaperSizeIndex>
                  <x:HorizontalResolution>600</x:HorizontalResolution>
                  <x:VerticalResolution>600</x:VerticalResolution>
                </x:Print>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        .kop-title { font-size: 14pt; font-weight: bold; color: #000000ff; text-align: center; }
        .kop-instansi { font-size: 16pt; font-weight: 800; color: #070707ff; text-align: center; }
        .kop-fakultas { font-size: 12pt; font-weight: bold; color: #1e1b4b; text-align: center; }
        .kop-lab { font-size: 11pt; font-weight: bold; color: #4c1d95; text-align: center; }
        .kop-alamat { font-size: 8.5pt; color: #64748b; text-align: center; font-style: italic; }
      </style>
    </head>
    <body style="padding: 10px;">
      <table>
        <!-- KOP SURAT RESMI LEMBAGA -->
        <tr>
          <td colspan="${totalColumns}" class="kop-title">KEMENTERIAN AGAMA REPUBLIK INDONESIA</td>
        </tr>
        <tr>
          <td colspan="${totalColumns}" class="kop-instansi">UNIVERSITAS ISLAM NEGERI ALAUDDIN MAKASSAR</td>
        </tr>
        <tr>
          <td colspan="${totalColumns}" class="kop-fakultas">FAKULTAS TARBIYAH DAN KEGURUAN (FTK)</td>
        </tr>
        <tr>
          <td colspan="${totalColumns}" class="kop-lab">LABORATORIUM MANAJEMEN PENDIDIKAN ISLAM (LAB MICROLEADING)</td>
        </tr>
        <tr>
          <td colspan="${totalColumns}" class="kop-alamat">
            Gedung FTK Kampus II: Jl. H. M. Yasin Limpo No. 36 Samata-Gowa, Sulawesi Selatan 92118 | Email: mpi.ftk@uin-alauddin.ac.id
          </td>
        </tr>
        <tr>
          <td colspan="${totalColumns}" style="border-bottom: 3px double #312e81; height: 5px;"></td>
        </tr>
        <tr style="height: 12px;"><td colspan="${totalColumns}"></td></tr>

        <!-- JUDUL LAPORAN & INFORMASI DOKUMEN -->
        <tr>
          <td colspan="${totalColumns}" style="font-size: 13pt; font-weight: bold; color: #312e81; text-align: center; text-transform: uppercase; padding: 4px;">
            ${title}
          </td>
        </tr>
        ${subtitle ? `
          <tr>
            <td colspan="${totalColumns}" style="font-size: 10pt; color: #64748b; text-align: center; padding-bottom: 8px;">
              ${subtitle}
            </td>
          </tr>
        ` : ''}

        <!-- METADATA KEGIATAN -->
        <tr>
          <td colspan="${totalColumns}" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; font-size: 9.5pt; color: #334155;">
            <table style="width: 100%;">
              <tr>
                <td style="width: 20%; font-weight: bold; color: #475569;">Nama Agenda:</td>
                <td style="width: 45%; font-weight: bold; color: #1e1b4b;">${activityName}</td>
                <td style="width: 15%; font-weight: bold; color: #475569;">No. Dokumen:</td>
                <td style="width: 20%; font-family: monospace; color: #6366f1;">${docNumber}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #475569;">Waktu Kegiatan:</td>
                <td style="color: #334155;">${dateInfo}</td>
                <td style="font-weight: bold; color: #475569;">Tanggal Ekspor:</td>
                <td style="color: #334155;">${currentDate} (${currentTime} WITA)</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- SUMMARY STATS BOX -->
        ${summaryBoxHtml}

        <!-- TABEL DATA UTAMA -->
        ${tableHeaderHtml}
        ${tableRowsHtml}

        <!-- SUMMARY FOOTER ROW -->
        <tr style="background-color: #ede9fe; font-weight: bold; height: 30px;">
          <td colspan="3" style="border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10pt; color: #4c1d95; text-align: right;">
            TOTAL DATA PESERTA:
          </td>
          <td colspan="${totalColumns - 3}" style="border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10pt; color: #4c1d95;">
            ${rows.length} Orang Terdaftar
          </td>
        </tr>

        <tr style="height: 25px;"><td colspan="${totalColumns}"></td></tr>

        <!-- LEMBAR TANDA TANGAN PENGESAHAN -->
        <tr>
          <td colspan="${Math.max(1, totalColumns - 3)}"></td>
          <td colspan="3" style="text-align: center; font-size: 9.5pt; color: #334155; font-family: 'Segoe UI', Arial, sans-serif;">
            Samata-Gowa, ${currentDate}<br/>
            <strong>${signerTitle}</strong><br/>
            Fakultas Tarbiyah dan Keguruan UINAM
            <br/><br/><br/><br/>
            <strong style="text-decoration: underline; color: #1e1b4b; font-size: 10pt;">${signerName}</strong><br/>
            NIP. ${signerNip}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Trigger download with proper MIME type
  const blob = new Blob(['\uFEFF' + excelHtml], {
    type: 'application/vnd.ms-excel;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  const cleanFilename = `${filename.replace(/[/\\?%*:|"<>]/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`;

  downloadLink.href = url;
  downloadLink.download = cleanFilename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

/**
 * Export Individual Registration Confirmation Document to Styled Excel
 */
export function exportSingleRegistrationExcel(registration) {
  if (!registration) return;

  const currentWorkshop = {
    title: registration.workshop_title || 'Workshop Lab Microleading MPI',
    date: registration.workshop_date || '',
    time: registration.workshop_time || '',
    location: registration.workshop_location || 'Lab Microleading MPI FTK UINAM',
    speaker: registration.speaker || 'Pemateri Lab Microleading'
  };

  const headers = ['Komponen Data', 'Rincian Informasi Resmi Pendaftar'];
  const rows = [
    ['Nomor Registrasi Resmi', registration.reg_code || '-'],
    ['Nama Lengkap Peserta', registration.nama || '-'],
    ['NIM / NIP / Identitas', registration.nim_nip || '-'],
    ['Asal Instansi / Program Studi', registration.instansi || 'UIN Alauddin Makassar'],
    ['Nomor WhatsApp Aktif', registration.whatsapp || '-'],
    ['Alamat Email', registration.email || '-'],
    ['Kegiatan Workshop / Pelatihan', currentWorkshop.title],
    ['Narasumber / Instruktur', currentWorkshop.speaker],
    ['Jadwal & Waktu Pelaksanaan', `${currentWorkshop.date} (${currentWorkshop.time})`],
    ['Tempat Pelaksanaan', currentWorkshop.location],
    ['Status Registrasi', registration.status === 'terkonfirmasi' ? 'Terkonfirmasi (Aktif)' : (registration.status || 'Terkonfirmasi')],
    ['Waktu Pendaftaran', registration.registered_at ? new Date(registration.registered_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')],
    ['Keterangan Kehadiran', registration.is_attended ? 'Sudah Hadir' : 'Menunggu Hari H'],
    ['Catatan Motivasi', registration.alasan || '-']
  ];

  exportStyledExcel({
    filename: `Bukti_Pendaftaran_${(registration.nama || 'Peserta').replace(/\s+/g, '_')}_${registration.reg_code || ''}`,
    title: 'BUKTI KONFIRMASI PENDAFTARAN PESERTA WORKSHOP & PELATIHAN',
    subtitle: 'Laboratorium Microleading MPI Fakultas Tarbiyah dan Keguruan UIN Alauddin Makassar',
    activityName: currentWorkshop.title,
    dateInfo: `${currentWorkshop.date} | ${currentWorkshop.time}`,
    summaryStats: [
      { label: 'STATUS REGISTRASI', value: 'TERKONFIRMASI', sublabel: 'Valid & Terdata' },
      { label: 'NOMOR REGISTRASI', value: registration.reg_code || 'REG-MPI', sublabel: 'Kode Unik Peserta' },
      { label: 'KLAIM HARI H', value: 'E-SERTIFIKAT', sublabel: 'Presensi Digital' }
    ],
    headers,
    rows,
    sheetName: 'Konfirmasi Pendaftaran'
  });
}

