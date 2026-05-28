// Logika Panel Mentor - Islamic Education Management Lab MPI
const MPIAlert = {
  createOverlay(iconHTML, iconClass, title, message, buttonsHTML) {
    const overlay = document.createElement("div");
    overlay.className = "mpi-alert-backdrop";
    overlay.innerHTML = `
      <div class="mpi-alert-box">
        <div class="mpi-alert-icon ${iconClass}">
          ${iconHTML}
        </div>
        <h4 class="mpi-alert-title">${title}</h4>
        <p class="mpi-alert-message">${message}</p>
        <div class="mpi-alert-buttons">
          ${buttonsHTML}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  },

  success(title, message) {
    return new Promise((resolve) => {
      const icon = '<i class="fas fa-circle-check"></i>';
      const buttons = '<button class="mpi-alert-btn confirm-primary">Selesai</button>';
      const overlay = this.createOverlay(icon, "success", title, message, buttons);

      overlay.querySelector(".confirm-primary").onclick = () => {
        overlay.remove();
        resolve(true);
      };
    });
  },

  error(title, message) {
    return new Promise((resolve) => {
      const icon = '<i class="fas fa-circle-xmark"></i>';
      const buttons = '<button class="mpi-alert-btn confirm-danger">Kembali</button>';
      const overlay = this.createOverlay(icon, "error", title, message, buttons);

      overlay.querySelector(".confirm-danger").onclick = () => {
        overlay.remove();
        resolve(true);
      };
    });
  },

  info(title, message) {
    return new Promise((resolve) => {
      const icon = '<i class="fas fa-circle-info"></i>';
      const buttons = '<button class="mpi-alert-btn confirm-primary">Mengerti</button>';
      const overlay = this.createOverlay(icon, "info", title, message, buttons);

      overlay.querySelector(".confirm-primary").onclick = () => {
        overlay.remove();
        resolve(true);
      };
    });
  },

  confirm(title, message, confirmText = "Ya, Setuju") {
    return new Promise((resolve) => {
      const icon = '<i class="fas fa-triangle-exclamation"></i>';
      const buttons = `
        <button class="mpi-alert-btn cancel">Batal</button>
        <button class="mpi-alert-btn confirm-danger">${confirmText}</button>
      `;
      const overlay = this.createOverlay(icon, "warning", title, message, buttons);

      overlay.querySelector(".cancel").onclick = () => {
        overlay.remove();
        resolve(false);
      };

      overlay.querySelector(".confirm-danger").onclick = () => {
        overlay.remove();
        resolve(true);
      };
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // 1. PROTEKSI ROUTE & AUTENTIKASI
  const loggedIn = localStorage.getItem("loggedIn");
  const userRole = localStorage.getItem("userRole");
  const username = localStorage.getItem("username");
  const userKelas = localStorage.getItem("userKelas");

  if (!loggedIn || userRole !== "mentor") {
    // Tendang ke halaman login jika sesi tidak valid
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userRole");
    window.location.replace("login.html");
    return;
  }

  // 2. INITIALIZE PROFILE & SIDEBAR
  const welcomeEl = document.getElementById("welcome-mentor");
  if (welcomeEl) welcomeEl.textContent = `Selamat datang, Mentor ${username}`;

  const sidebarName = document.getElementById("sidebar-username");
  if (sidebarName) sidebarName.textContent = username;

  const classHeading = document.getElementById("mentor-class-heading");
  if (classHeading) classHeading.textContent = `Kelas Anda: ${userKelas || "Belum Ditentukan"}`;

  const sidebarRole = document.getElementById("sidebar-role");
  if (sidebarRole) sidebarRole.textContent = `Mentor - ${userKelas || "Umum"}`;

  // Ambil data foto profil mentor jika ada
  fetchUserProfile(username);

  // 3. SWITCH SECTIONS
  const navLinks = document.querySelectorAll(".sidebar .nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      
      // Remove active from all links & sections
      navLinks.forEach((lnk) => lnk.classList.remove("active"));
      document.querySelectorAll(".section").forEach((sec) => sec.classList.remove("active"));
      
      // Add active to current link
      this.classList.add("active");
      
      // Show targeted section
      const targetId = this.getAttribute("href").substring(1);
      const targetSec = document.getElementById(targetId);
      if (targetSec) targetSec.classList.add("active");

      if (targetId === "attendance") {
        const activeKelas = localStorage.getItem("userKelas") || "";
        if (activeKelas) {
          loadAttendanceRecords(activeKelas);
        }
      }

      // Close sidebar on mobile
      const sidebar = document.getElementById("sidebar");
      if (window.innerWidth <= 992 && sidebar) {
        sidebar.classList.remove("show");
      }
    });
  });

  // 4. LOAD DASHBOARD DATA
  if (userKelas && userKelas !== "null") {
    loadStats(userKelas);
    loadClassSchedule(userKelas);
    loadAssignments(userKelas);
  } else {
    showNoClassAlert();
  }

  // 5. INITIALIZE CALENDAR
  initCalendar(userKelas);

  // 6. SETUP GRADING FORM SUBMISSION
  const gradeForm = document.getElementById("grading-form");
  if (gradeForm) {
    gradeForm.addEventListener("submit", submitGrade);
  }

  // 7. LOAD MENTOR PROPOSED COURSES
  loadMentorProposedCourses(username);

  // 8. SETUP COURSE PROPOSAL FORM SUBMISSION
  const proposalForm = document.getElementById("mentor-add-course-form");
  if (proposalForm) {
    proposalForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      const name = document.getElementById("mentor-course-name").value;
      const tanggal = document.getElementById("mentor-course-date").value;
      
      const daysArr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const dateObj = new Date(tanggal);
      const day = daysArr[dateObj.getDay()];

      const start = document.getElementById("mentor-course-time-start").value;
      const end = document.getElementById("mentor-course-time-end").value;
      const desc = document.getElementById("mentor-course-desc").value;
      const jam = `${start} - ${end} WIB`;

      const auto_attn = document.getElementById("mentor-course-auto-attn").checked ? 1 : 0;
      const attn_late = parseInt(document.getElementById("mentor-course-attn-late").value) || 15;
      const auto_task = document.getElementById("mentor-course-auto-task").checked ? 1 : 0;
      const task_title = document.getElementById("mentor-course-task-title").value || "";
      const task_desc = document.getElementById("mentor-course-task-desc").value || "";

      const btn = document.getElementById("btn-submit-proposal");
      const origText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i> Mengirim...`;

      try {
        const res = await fetch("/api/mentor/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama_kelas: name, deskripsi: desc, mentor: username, hari: day, jam: jam, tanggal: tanggal, auto_attn, attn_late, auto_task, task_title, task_desc })
        });
        if (res.ok) {
          await MPIAlert.success("Usulan Terkirim", "Usulan kelas baru berhasil dikirim untuk persetujuan admin!");
          proposalForm.reset();
          loadMentorProposedCourses(username);
        } else {
          await MPIAlert.error("Gagal", "Gagal mengirimkan usulan kelas.");
        }
      } catch (err) {
        console.error("Error submitting class proposal:", err);
        await MPIAlert.error("Kesalahan Jaringan", "Terjadi kesalahan jaringan.");
      } finally {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    });
  }
});

// Aksi Toggle Sidebar Mobile
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.toggle("show");
}

// Mengambil detail profil user
async function fetchUserProfile(username) {
  try {
    const response = await fetch(`/api/users/${username}`);
    const user = await response.json();
    
    // Auto-synchronize class to localStorage if updated by Admin in DB
    if (user && user.kelas !== undefined) {
      const currentLocalKelas = localStorage.getItem("userKelas");
      const dbKelas = user.kelas || "";
      if (dbKelas !== currentLocalKelas) {
        localStorage.setItem("userKelas", dbKelas);
        window.location.reload();
        return;
      }
    }

    if (user && user.profile_pic) {
      const picUrl = `/uploads/${user.profile_pic}`;
      const sidebarPic = document.getElementById("sidebar-profile-pic");
      if (sidebarPic) sidebarPic.src = picUrl;
    }
  } catch (e) {
    console.error("Gagal mengambil profil mentor:", e);
  }
}

// 1. LOAD STATS
async function loadStats(kelas) {
  try {
    const response = await fetch(`/api/mentor/stats?kelas=${encodeURIComponent(kelas)}`);
    const stats = await response.json();
    
    document.getElementById("stat-students").textContent = stats.students || 0;
    document.getElementById("stat-assignments").textContent = stats.assignments || 0;
    document.getElementById("stat-graded").textContent = stats.graded || 0;
    
    const pending = (stats.assignments || 0) - (stats.graded || 0);
    document.getElementById("stat-pending").textContent = pending >= 0 ? pending : 0;
  } catch (e) {
    console.error("Gagal memuat statistik mentor:", e);
  }
}

// Alert jika mentor belum ditentukan kelasnya
function showNoClassAlert() {
  const container = document.querySelector(".main-content");
  if (container) {
    const alertBox = document.createElement("div");
    alertBox.className = "alert alert-warning text-center rounded-4 p-4 mt-3";
    alertBox.innerHTML = `
      <h4><i class="fas fa-exclamation-triangle"></i> Kelas Belum Dikonfigurasi</h4>
      <p class="mb-0">Akun Mentor Anda belum dikaitkan dengan kelas mengajar apa pun oleh Administrator. Silakan hubungi admin untuk melakukan seting kelas mengajar Anda.</p>
    `;
    // Insert after title
    const titleEl = document.querySelector(".page-title");
    titleEl.parentNode.insertBefore(alertBox, titleEl.nextSibling);
  }
}

// 2. SCHEDULE AND ACTIVE LIVE COUNTDOWN
let countdownInterval;
async function loadClassSchedule(kelas) {
  try {
    const response = await fetch("/api/courses");
    const courses = await response.json();
    const course = courses.find((c) => c.nama_kelas === kelas);

    if (course && course.hari && course.jam) {
      const dateObj = course.tanggal ? new Date(course.tanggal) : null;
      const formattedDate = dateObj && !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
        : "";
      const displaySchedule = course.tanggal && formattedDate
        ? `${formattedDate} (${course.hari}), ${course.jam}`
        : `${course.hari}, ${course.jam}`;
      document.getElementById("schedule-day-time").textContent = displaySchedule;
      startCountdown(course.hari, course.jam, course.tanggal);
    } else {
      document.getElementById("schedule-day-time").textContent = "Jadwal belum dikonfigurasi.";
      document.getElementById("countdown-timer").innerHTML = `<span class="text-muted small">Menunggu konfigurasi jadwal admin...</span>`;
    }
  } catch (e) {
    console.error("Gagal memuat jadwal kelas:", e);
  }
}

function startCountdown(hari, jam, tanggal) {
  const daysMap = {
    "minggu": 0, "senin": 1, "selasa": 2, "rabu": 3, "kamis": 4, "jumat": 5, "sabtu": 6
  };

  const targetDayNum = daysMap[hari.toLowerCase().trim()];
  if (targetDayNum === undefined) return;

  // Parse jam range like "08:00 - 10:30 WIB"
  const timeMatch = jam.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
  if (!timeMatch) return;

  const startTimeStr = timeMatch[1];
  const endTimeStr = timeMatch[2];

  const [startHour, startMin] = startTimeStr.split(":").map(Number);
  const [endHour, endMin] = endTimeStr.split(":").map(Number);

  const countdownContainer = document.getElementById("countdown-timer");
  const statusIndicator = document.getElementById("class-status-indicator");

  if (countdownInterval) clearInterval(countdownInterval);

  function updateTimer() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    let isToday = false;
    if (tanggal) {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const todayDateStr = `${year}-${month}-${date}`;
      isToday = (todayDateStr === tanggal);
    } else {
      isToday = (now.getDay() === targetDayNum);
    }

    // 1. CHECK IF CLASS IS CURRENTLY ACTIVE NOW
    if (isToday) {
      const currentMinutesTotal = currentHour * 60 + currentMin;
      const startMinutesTotal = startHour * 60 + startMin;
      const endMinutesTotal = endHour * 60 + endMin;

      if (currentMinutesTotal >= startMinutesTotal && currentMinutesTotal <= endMinutesTotal) {
        // Kelas aktif!
        statusIndicator.className = "status-indicator active";
        statusIndicator.innerHTML = `<span class="pulse-dot"></span> Sedang Berlangsung`;
        countdownContainer.innerHTML = `
          <div class="alert alert-success border-0 rounded-3 p-3 w-100 text-center mb-0 mt-2">
            <h6 class="fw-bold mb-1"><i class="fas fa-video me-1"></i> Kelas Sedang Aktif Sekarang</h6>
            <small>Sesi mengajar Anda sedang berjalan saat ini.</small>
          </div>
        `;
        return;
      }
    }

    // 2. IF NOT ACTIVE, CALCULATE COUNTDOWN TO NEXT SESSION
    statusIndicator.className = "status-indicator inactive";
    statusIndicator.innerHTML = `<span class="pulse-dot"></span> Sesi Mendatang`;

    let targetDate;
    if (tanggal) {
      const [tYear, tMonth, tDate] = tanggal.split("-").map(Number);
      targetDate = new Date(tYear, tMonth - 1, tDate, startHour, startMin, 0, 0);
    } else {
      // Cari tanggal target mengajar berikutnya (mingguan)
      let daysToAdd = targetDayNum - now.getDay();
      if (daysToAdd < 0 || (daysToAdd === 0 && (currentHour > startHour || (currentHour === startHour && currentMin >= startMin)))) {
        daysToAdd += 7; // minggu depan
      }
      targetDate = new Date(now);
      targetDate.setDate(now.getDate() + daysToAdd);
      targetDate.setHours(startHour, startMin, 0, 0);
    }

    const diffMs = targetDate - now;
    const diffSecTotal = Math.floor(diffMs / 1000);

    if (diffSecTotal <= 0) {
      countdownContainer.innerHTML = `
        <div class="alert alert-secondary border-0 rounded-3 p-3 w-100 text-center mb-0 mt-2">
          <h6 class="fw-bold mb-1"><i class="fas fa-calendar-check me-1"></i> Sesi Kelas Telah Selesai</h6>
          <small>Jadwal perkuliahan untuk sesi ini sudah terlewati.</small>
        </div>
      `;
      return;
    }

    const d = Math.floor(diffSecTotal / (3600 * 24));
    const h = Math.floor((diffSecTotal % (3600 * 24)) / 3600);
    const m = Math.floor((diffSecTotal % 3600) / 60);
    const s = diffSecTotal % 60;

    countdownContainer.innerHTML = `
      <div class="countdown-timer-display">
        <div class="countdown-unit">
          <span class="countdown-number">${String(d).padStart(2, '0')}</span>
          <span class="countdown-label">Hari</span>
        </div>
        <div class="countdown-unit">
          <span class="countdown-number">${String(h).padStart(2, '0')}</span>
          <span class="countdown-label">Jam</span>
        </div>
        <div class="countdown-unit">
          <span class="countdown-number">${String(m).padStart(2, '0')}</span>
          <span class="countdown-label">Menit</span>
        </div>
        <div class="countdown-unit">
          <span class="countdown-number">${String(s).padStart(2, '0')}</span>
          <span class="countdown-label">Detik</span>
        </div>
      </div>
    `;
  }

  updateTimer();
  countdownInterval = setInterval(updateTimer, 1000);
}

// 3. DYNAMIC CALENDAR GENERATOR
let currentYear, currentMonth;
function initCalendar(kelas) {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();

  renderCalendar(currentYear, currentMonth, kelas);

  const prevBtn = document.getElementById("calendar-prev");
  const nextBtn = document.getElementById("calendar-next");

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar(currentYear, currentMonth, kelas);
    });

    nextBtn.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar(currentYear, currentMonth, kelas);
    });
  }
}

async function renderCalendar(year, month, kelas) {
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const titleEl = document.getElementById("calendar-month-year");
  if (titleEl) titleEl.textContent = `${monthNames[month]} ${year}`;

  const daysGrid = document.getElementById("calendar-days-grid");
  if (!daysGrid) return;
  daysGrid.innerHTML = "";

  // Cari hari dan tanggal mengajar kelas
  let classDayName = "";
  let classTanggal = "";
  try {
    const response = await fetch("/api/courses");
    const courses = await response.json();
    const course = courses.find((c) => c.nama_kelas === kelas);
    if (course) {
      if (course.hari) classDayName = course.hari.toLowerCase().trim();
      if (course.tanggal) classTanggal = course.tanggal; // format: YYYY-MM-DD
    }
  } catch (e) {
    console.error("Gagal mendeteksi hari kelas untuk kalender:", e);
  }

  const daysEngToIndo = {
    0: "minggu", 1: "senin", 2: "selasa", 3: "rabu", 4: "kamis", 5: "jumat", 6: "sabtu"
  };

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDayDate = new Date(year, month + 1, 0).getDate();
  const prevLastDayDate = new Date(year, month, 0).getDate();

  const today = new Date();

  // Rendering prev month days
  for (let i = firstDayIndex; i > 0; i--) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day prev-next";
    dayDiv.textContent = prevLastDayDate - i + 1;
    daysGrid.appendChild(dayDiv);
  }

  // Rendering current month days
  for (let date = 1; date <= lastDayDate; date++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    dayDiv.textContent = date;

    const dateObj = new Date(year, month, date);
    const dayOfWeekIndex = dateObj.getDay();
    const dayOfWeekName = daysEngToIndo[dayOfWeekIndex];

    // Check if it's today
    if (date === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      dayDiv.classList.add("today");
    }

    // Check if this day of week or specific date matches teaching session
    let isSession = false;
    if (classTanggal) {
      const yearStr = String(year);
      const monthStr = String(month + 1).padStart(2, '0');
      const dateStr = String(date).padStart(2, '0');
      const currentCalendarDateStr = `${yearStr}-${monthStr}-${dateStr}`;
      isSession = (currentCalendarDateStr === classTanggal);
    } else {
      isSession = (dayOfWeekName === classDayName);
    }

    if (isSession) {
      dayDiv.classList.add("class-session");
      dayDiv.title = `Hari Mengajar: ${kelas}`;
    }

    daysGrid.appendChild(dayDiv);
  }

  // Rendering next month days to complete grid
  const totalDaysAdded = firstDayIndex + lastDayDate;
  const nextMonthDaysNeeded = 42 - totalDaysAdded; // 6 rows * 7 days
  for (let i = 1; i <= nextMonthDaysNeeded; i++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day prev-next";
    dayDiv.textContent = i;
    daysGrid.appendChild(dayDiv);
  }
}

// 4. LOAD & RENDER STUDENT SUBMISSIONS
async function loadAssignments(kelas) {
  const tableBody = document.getElementById("assignments-table-body");
  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center py-4 text-muted">
        <i class="fas fa-spinner fa-spin fa-2x mb-3 text-primary d-block"></i>
        Memuat daftar tugas masuk...
      </td>
    </tr>
  `;

  try {
    const response = await fetch(`/api/mentor/assignments?kelas=${encodeURIComponent(kelas)}`);
    const list = await response.json();
    
    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-5 text-muted">
            <i class="fas fa-folder-open fa-3x mb-3 text-secondary d-block"></i>
            Belum ada tugas mahasiswa yang dikumpulkan untuk kelas ini.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = list.map((item, index) => {
      const isGraded = item.grade !== null && item.grade !== undefined && item.grade !== "";
      
      const badgeStyle = isGraded 
        ? "bg-success-subtle text-success border border-success-subtle" 
        : "bg-warning-subtle text-warning border border-warning-subtle";
        
      const badgeLabel = isGraded 
        ? `<i class="fas fa-check-circle me-1"></i> ${item.grade} (Telah Dinilai)` 
        : `<i class="fas fa-clock me-1"></i> Belum Dinilai`;

      const formattedDate = new Date(item.timestamp).toLocaleString("id-ID", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
      });

      return `
        <tr>
          <td class="fw-semibold text-dark">${index + 1}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; font-size: 0.85rem;">
                ${item.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <span class="d-block fw-bold">${item.username}</span>
              </div>
            </div>
          </td>
          <td class="fw-medium">${item.title}</td>
          <td class="text-muted small">${formattedDate}</td>
          <td>
            <span class="badge ${badgeStyle}">${badgeLabel}</span>
          </td>
          <td>
            <div class="d-flex gap-2">
              <a href="/api/files/${item.id}/download" class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 fw-bold" style="font-size: 0.75rem;" download>
                <i class="fas fa-download me-1"></i> File
              </a>
              <button onclick="openGradingModal('${item.id}', '${item.username}', '${item.title}', '${item.grade || ""}', \`${item.feedback || ""}\`)" 
                class="btn btn-premium btn-sm rounded-pill px-3 py-1" style="font-size: 0.75rem;">
                <i class="fas fa-edit me-1"></i> ${isGraded ? "Edit Nilai" : "Beri Nilai"}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

  } catch (e) {
    console.error("Gagal memuat tugas mentor:", e);
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-danger">
          <i class="fas fa-exclamation-triangle fa-2x mb-3 d-block"></i>
          Gagal menyambung ke server untuk mengambil tugas.
        </td>
      </tr>
    `;
  }
}

// 5. OPEN GRADING MODAL POPUP
let currentGradingId = null;
function openGradingModal(id, student, title, existingGrade, existingFeedback) {
  currentGradingId = id;
  
  document.getElementById("modal-student-name").textContent = student;
  document.getElementById("modal-assignment-title").textContent = title;
  
  document.getElementById("input-grade").value = existingGrade || "";
  document.getElementById("input-feedback").value = existingFeedback || "";
  
  const modal = new bootstrap.Modal(document.getElementById("gradingModal"));
  modal.show();
}

// Expose openGradingModal globally so inline onclick handler can call it
window.openGradingModal = openGradingModal;

// 6. SUBMIT GRADE TO BACKEND API
async function submitGrade(e) {
  e.preventDefault();
  
  if (!currentGradingId) return;

  const grade = document.getElementById("input-grade").value.trim();
  const feedback = document.getElementById("input-feedback").value.trim();
  
  const btnSubmit = document.getElementById("submit-grade-btn");
  const originalText = btnSubmit.innerHTML;
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i> Menyimpan...`;

  try {
    const response = await fetch(`/api/mentor/assignments/${currentGradingId}/grade`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ grade, feedback })
    });

    if (response.ok) {
      // Success modal hiding and refresh
      const modalEl = document.getElementById("gradingModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();

      await MPIAlert.success("Tugas Dinilai", "Tugas mahasiswa berhasil dinilai!");
      
      const userKelas = localStorage.getItem("userKelas");
      loadStats(userKelas);
      loadAssignments(userKelas);
    } else {
      await MPIAlert.error("Gagal", "Gagal menyimpan penilaian. Coba lagi.");
    }
  } catch (error) {
    console.error("Gagal memberi nilai tugas:", error);
    await MPIAlert.error("Kesalahan Jaringan", "Koneksi gagal. Coba lagi.");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = originalText;
  }
}

// Fungsi Logout
function logout(e) {
  if (e) e.preventDefault();
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("userKelas");
  localStorage.removeItem("userRole");
  window.location.replace("login.html");
}

window.logout = logout;

// 7. LOAD & RENDER MENTOR PROPOSED COURSES
async function loadMentorProposedCourses(mentorUsername) {
  const tableBody = document.getElementById("mentor-proposed-courses-table-body");
  if (!tableBody) return;

  try {
    const response = await fetch(`/api/mentor/courses?mentor=${encodeURIComponent(mentorUsername)}`);
    const list = await response.json();

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4 text-muted">
            <i class="fas fa-folder-open fa-2x mb-2 text-secondary d-block"></i>
            Belum ada pengajuan kelas.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = list.map((item) => {
      const isPending = item.status === 'pending';
      const badgeStyle = isPending
        ? "bg-warning-subtle text-warning border border-warning-subtle"
        : "bg-success-subtle text-success border border-success-subtle";
      const badgeLabel = isPending
        ? `<i class="fas fa-clock me-1"></i> Pending`
        : `<i class="fas fa-check-circle me-1"></i> Aktif`;

      const actionBtn = isPending
        ? `<button onclick="deleteProposedCourse(${item.id})" class="btn btn-outline-danger btn-sm rounded-circle shadow-sm" style="width: 32px; height: 32px; padding: 0;" title="Batalkan Pengajuan"><i class="fas fa-times"></i></button>`
        : `<div class="d-flex gap-1">
             <button onclick="triggerUploadMaterial('${item.nama_kelas}')" class="btn btn-outline-primary btn-sm rounded-pill py-1 px-2 fw-semibold" style="font-size: 0.72rem;"><i class="fas fa-file-upload me-1"></i>Materi</button>
             <button onclick="triggerCreateTask('${item.nama_kelas}')" class="btn btn-outline-success btn-sm rounded-pill py-1 px-2 fw-semibold" style="font-size: 0.72rem;"><i class="fas fa-plus-circle me-1"></i>Tugas</button>
           </div>`;

      const dateObj = item.tanggal ? new Date(item.tanggal) : null;
      const formattedDate = dateObj && !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
        : "";
      const scheduleLabel = item.tanggal && formattedDate
        ? `${formattedDate} (${item.hari})`
        : item.hari;

      return `
        <tr>
          <td class="fw-bold text-dark">${item.nama_kelas}</td>
          <td class="text-muted small">${scheduleLabel}, ${item.jam}</td>
          <td><span class="badge ${badgeStyle}">${badgeLabel}</span></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error("Error loading proposed courses:", err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4 text-danger">
          Gagal mengambil data pengajuan kelas.
        </td>
      </tr>
    `;
  }
}

// 8. DELETE PROPOSED PENDING COURSE
async function deleteProposedCourse(id) {
  const approved = await MPIAlert.confirm("Batalkan Pengajuan", "Apakah Anda yakin ingin membatalkan usulan kelas ini?", "Ya, Batalkan");
  if (!approved) return;

  try {
    const response = await fetch(`/api/courses/${id}`, {
      method: "DELETE"
    });
    if (response.ok) {
      await MPIAlert.success("Berhasil Dibatalkan", "Pengajuan kelas berhasil dibatalkan!");
      const username = localStorage.getItem("username");
      loadMentorProposedCourses(username);
    } else {
      await MPIAlert.error("Gagal", "Gagal membatalkan pengajuan kelas.");
    }
  } catch (err) {
    console.error("Error deleting proposed course:", err);
    await MPIAlert.error("Kesalahan Jaringan", "Kesalahan koneksi.");
  }
}

// 9. TRIGGER MODALS
function triggerUploadMaterial(className) {
  document.getElementById("material-class-name").value = className;
  const modal = new bootstrap.Modal(document.getElementById("uploadMaterialModal"));
  modal.show();
}

function triggerCreateTask(className) {
  document.getElementById("task-class-name").value = className;
  const modal = new bootstrap.Modal(document.getElementById("createTaskModal"));
  modal.show();
}

// 10. SUBMIT HANDLERS FOR MATERIALS & TASKS
document.addEventListener("DOMContentLoaded", () => {
  const materialForm = document.getElementById("upload-material-form");
  if (materialForm) {
    materialForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      const kelas = document.getElementById("material-class-name").value;
      const title = document.getElementById("material-title").value;
      const fileInput = document.getElementById("material-file");
      
      if (fileInput.files.length === 0) return;
      
      const btnSubmit = document.getElementById("btn-submit-material");
      const origText = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i> Mengunggah...`;

      const formData = new FormData();
      formData.append("kelas", kelas);
      formData.append("title", title);
      formData.append("file", fileInput.files[0]);

      try {
        const response = await fetch("/api/materials", {
          method: "POST",
          body: formData
        });
        
        if (response.ok) {
          bootstrap.Modal.getInstance(document.getElementById("uploadMaterialModal")).hide();
          materialForm.reset();
          await MPIAlert.success("Materi Terunggah", `Materi "${title}" berhasil dibagikan ke mahasiswa!`);
        } else {
          await MPIAlert.error("Gagal", "Gagal mengunggah materi pembelajaran.");
        }
      } catch (err) {
        console.error("Error uploading material:", err);
        await MPIAlert.error("Kesalahan Jaringan", "Gagal mengunggah materi.");
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = origText;
      }
    });
  }

  const taskForm = document.getElementById("create-task-form");
  if (taskForm) {
    taskForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      const kelas = document.getElementById("task-class-name").value;
      const title = document.getElementById("task-title").value;
      const description = document.getElementById("task-desc").value;
      const deadline = document.getElementById("task-deadline").value;

      const btnSubmit = document.getElementById("btn-submit-task");
      const origText = btnSubmit.innerHTML;
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i> Menerbitkan...`;

      try {
        const response = await fetch("/api/class_tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kelas, title, description, deadline })
        });

        if (response.ok) {
          bootstrap.Modal.getInstance(document.getElementById("createTaskModal")).hide();
          taskForm.reset();
          await MPIAlert.success("Tugas Diterbitkan", `Tugas "${title}" dengan batas pengumpulan berhasil diterbitkan!`);
        } else {
          await MPIAlert.error("Gagal", "Gagal menerbitkan tugas baru.");
        }
      } catch (err) {
        console.error("Error creating task:", err);
        await MPIAlert.error("Kesalahan Jaringan", "Gagal menerbitkan tugas.");
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = origText;
      }
    });
  }

  const attendanceSessionForm = document.getElementById("attendance-session-form");
  if (attendanceSessionForm) {
    attendanceSessionForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const date = document.getElementById("attn-date").value;
      const start = document.getElementById("attn-time-start").value;
      const end = document.getElementById("attn-time-end").value;
      const late = document.getElementById("attn-late-minutes").value;

      const btn = document.getElementById("btn-create-attn-session");
      const origText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i> Menerbitkan...`;

      try {
        const baseUrl = window.location.protocol === "file:" ? "http://localhost:3001" : "";
        const activeKelas = localStorage.getItem("userKelas") || "";
        const response = await fetch(baseUrl + "/api/attendance/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kelas: activeKelas,
            tanggal: date,
            waktu_mulai: start,
            waktu_selesai: end,
            batas_terlambat: parseInt(late)
          })
        });

        if (response.ok) {
          attendanceSessionForm.reset();
          await MPIAlert.success("Absensi Diterbitkan", "Sesi absensi untuk kelas Anda hari ini berhasil dibuka!");
          loadAttendanceRecords(activeKelas);
        } else {
          await MPIAlert.error("Gagal", "Gagal membuka sesi absensi.");
        }
      } catch (err) {
        console.error("Error creating attendance session:", err);
        await MPIAlert.error("Kesalahan Jaringan", "Gagal menyambung ke server.");
      } finally {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    });
  }
});

async function loadAttendanceRecords(kelas) {
  const tbody = document.getElementById("attendance-records-table-body");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center py-4 text-muted">
        <i class="fas fa-spinner fa-spin fa-2x mb-3 text-primary d-block"></i>
        Memuat rekap absensi...
      </td>
    </tr>
  `;

  try {
    const baseUrl = window.location.protocol === "file:" ? "http://localhost:3001" : "";
    const response = await fetch(baseUrl + `/api/attendance/records?kelas=${encodeURIComponent(kelas)}`);
    const records = await response.json();

    if (records.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4 text-muted">
            <i class="fas fa-info-circle fa-2x mb-2 text-secondary d-block"></i>
            Sesi kelas belum memiliki rekap absensi.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = records.map(r => {
      let badgeStyle = "bg-success-subtle text-success border border-success-subtle";
      if (r.status === "Terlambat") badgeStyle = "bg-warning-subtle text-warning border border-warning-subtle";
      if (r.status === "Izin" || r.status === "Sakit") badgeStyle = "bg-info-subtle text-info border border-info-subtle";

      const formattedDate = new Date(r.timestamp).toLocaleDateString("id-ID", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
      });

      return `
        <tr>
          <td>
            <div class="fw-bold text-dark">${r.username}</div>
          </td>
          <td class="text-muted small">${formattedDate}</td>
          <td>
            <span class="badge ${badgeStyle}">${r.status}</span>
          </td>
          <td class="text-muted small">${r.keterangan || "-"}</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Error loading attendance records:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4 text-danger">
          Gagal mengambil data absensi dari server.
        </td>
      </tr>
    `;
  }
}

window.loadAttendanceRecords = loadAttendanceRecords;
window.deleteProposedCourse = deleteProposedCourse;
window.loadMentorProposedCourses = loadMentorProposedCourses;
window.triggerUploadMaterial = triggerUploadMaterial;
window.triggerCreateTask = triggerCreateTask;
