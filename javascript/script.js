// MPIAlert - Premium Custom Notification and Alert System
let activeTasksList = [];
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

function toggleTheme() {
  // Mode malam dinonaktifkan secara permanen
}

function showSection(sectionId) {
  document
    .querySelectorAll(".section")
    .forEach((sec) => sec.classList.add("d-none"));
  document.getElementById(sectionId).classList.remove("d-none");
  if (sectionId === "inbox") {
    loadInboxData();
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("main-content");
  sidebar.classList.toggle("collapsed");
  mainContent.classList.toggle("expanded");
}

// Class Management - Static Classes

// Legacy file functions removed for cleanup

function updateGallery() {
  fetch("/api/gallery")
    .then((response) => response.json())
    .then((images) => {
      const container = document.getElementById("gallery-container");
      if (!container) return;
      container.innerHTML = "";
      images.forEach((img) => {
        const imgElement = document.createElement("div");
        imgElement.className = "col-md-4 mb-4";
        imgElement.innerHTML = `
            <div class="card border-0 shadow-sm overflow-hidden rounded-4" style="transition: all 0.3s;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 15px 30px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.05)'">
                <img src="/api/gallery/${img.id}/image" class="card-img-top" style="height: 250px; object-fit: cover;" alt="Gallery Image">
            </div>
        `;
        container.appendChild(imgElement);
      });
    })
    .catch((error) => console.error("Error fetching gallery:", error));
}

// Logout function
function logout(event) {
  if (event) event.preventDefault();
  localStorage.removeItem("loggedIn");
  window.location.replace("login.html");
}

// Close sidebar when clicking on body
document.body.addEventListener("click", function (event) {
  const sidebar = document.getElementById("sidebar");
  const button = document.getElementById("tombol");
  if (
    !sidebar.contains(event.target) &&
    !button.contains(event.target) &&
    !sidebar.classList.contains("collapsed")
  ) {
    toggleSidebar();
  }
});

// LMS Dashboard & Catalog Logic
document.addEventListener("DOMContentLoaded", () => {
  const userKelas = localStorage.getItem("userKelas");
  const username = localStorage.getItem("username");

  if (username) {
    const welcomeEl = document.getElementById("user-welcome");
    if (welcomeEl) welcomeEl.textContent = `Selamat datang, ${username}`;

    const sidebarName = document.getElementById("sidebar-username");
    if (sidebarName) sidebarName.textContent = username;

    // Setup user settings
    const setUsernameEl = document.getElementById("set-username");
    if (setUsernameEl) setUsernameEl.value = username;
    fetchUserSettings(username);
  }

  if (document.getElementById("class")) {
    if (userKelas && userKelas !== "null" && userKelas.trim() !== "") {
      showDashboard(userKelas);
    } else {
      showCatalog();
    }
  }

  fetchUserNews();

  // Setup Assignment Form
  const assignmentForm = document.getElementById("assignment-form");
  const taskSelect = document.getElementById("assignment-task-select");
  const taskDetailsDiv = document.getElementById("student-task-details");
  const taskDescEl = document.getElementById("student-task-desc");
  const taskDeadlineEl = document.getElementById("student-task-deadline");

  if (taskSelect) {
    taskSelect.addEventListener("change", function () {
      const val = this.value;
      if (!val || val === "general") {
        if (taskDetailsDiv) taskDetailsDiv.classList.add("d-none");
        return;
      }
      
      const selectedTask = activeTasksList.find(t => t.id === val);
      if (selectedTask && taskDetailsDiv && taskDescEl && taskDeadlineEl) {
        taskDetailsDiv.classList.remove("d-none");
        taskDescEl.textContent = selectedTask.description || "Tidak ada deskripsi khusus.";
        
        if (selectedTask.deadline) {
          const deadlineDate = new Date(selectedTask.deadline);
          const formattedDeadline = deadlineDate.toLocaleString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }) + " WIB";
          
          const now = new Date();
          if (now > deadlineDate) {
            taskDeadlineEl.innerHTML = `<span class="text-danger fw-bold"><i class="fas fa-exclamation-circle me-1"></i> ${formattedDeadline} (TERLAMBAT - Batas Waktu Telah Lewat)</span>`;
          } else {
            taskDeadlineEl.innerHTML = `<span class="text-success fw-bold"><i class="far fa-clock me-1"></i> ${formattedDeadline}</span>`;
          }
        } else {
          taskDeadlineEl.textContent = "Tanpa batas waktu.";
        }
      }
    });
  }

  if (assignmentForm) {
    assignmentForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const fileInput = document.getElementById("assignment-file");
      const statusDiv = document.getElementById("assignment-status");

      if (fileInput.files.length > 0) {
        const selectedVal = taskSelect.value;
        if (!selectedVal) {
          await MPIAlert.error("Pilih Tugas", "Silakan pilih tugas yang ingin dikumpulkan terlebih dahulu.");
          return;
        }

        let title = "";
        let taskId = "";
        let isLate = false;

        if (selectedVal === "general") {
          title = "Tugas Bebas / Mandiri";
          taskId = "general";
        } else {
          const task = activeTasksList.find(t => t.id === selectedVal);
          if (task) {
            title = task.title;
            taskId = task.id;
            if (task.deadline) {
              const deadlineDate = new Date(task.deadline);
              if (new Date() > deadlineDate) {
                isLate = true;
              }
            }
          }
        }

        if (isLate) {
          const confirmSubmit = await MPIAlert.confirm(
            "Batas Waktu Lewat",
            "Batas waktu pengumpulan tugas ini telah terlewati. Apakah Anda yakin ingin tetap mengumpulkan? Tugas Anda akan ditandai sebagai TERLAMBAT.",
            "Ya, Kumpulkan"
          );
          if (!confirmSubmit) return;
        }

        statusDiv.innerHTML =
          '<span class="text-primary"><i class="fas fa-spinner fa-spin"></i> Mengirim tugas...</span>';

        const formData = new FormData();
        formData.append("username", username);
        formData.append("kelas", userKelas);
        formData.append("title", isLate ? `[TERLAMBAT] ${title}` : title);
        formData.append("task_id", taskId);
        formData.append("file", fileInput.files[0]);

        try {
          const response = await fetch("/api/assignments", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            statusDiv.innerHTML =
              '<span class="text-success"><i class="fas fa-check-circle"></i> Tugas "' +
              title +
              '" berhasil dikirim!</span>';
            assignmentForm.reset();
            if (taskDetailsDiv) taskDetailsDiv.classList.add("d-none");
            await MPIAlert.success("Tugas Dikirim", `Tugas "${title}" berhasil dikumpulkan!`);
          } else {
            statusDiv.innerHTML =
              '<span class="text-danger"><i class="fas fa-exclamation-triangle"></i> Gagal mengirim tugas.</span>';
            await MPIAlert.error("Gagal", "Gagal mengirim tugas. Silakan coba lagi.");
          }
        } catch (error) {
          statusDiv.innerHTML =
            '<span class="text-danger"><i class="fas fa-wifi"></i> Kesalahan koneksi.</span>';
          await MPIAlert.error("Terjadi Kesalahan", "Gagal terhubung ke server.");
        }
      }
    });
  }

  // Student Attendance Form Submit Handler
  const attnForm = document.getElementById("student-attendance-form");
  if (attnForm) {
    attnForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const statusSelect = document.getElementById("attn-status-select").value;
      const keterangan = document.getElementById("attn-keterangan").value;
      const activeSession = JSON.parse(localStorage.getItem("activeAttnSession"));

      if (!activeSession) return;

      const btn = document.getElementById("btn-submit-attn");
      const origText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;

      let finalStatus = statusSelect;

      // Auto-determine "Terlambat" if Hadir
      if (statusSelect === "Hadir") {
        const now = new Date();
        const startHM = activeSession.waktu_mulai; // e.g. "08:00"
        const [sHour, sMin] = startHM.split(":").map(Number);
        const startTimeObj = new Date(now);
        startTimeObj.setHours(sHour, sMin, 0, 0);

        const limitMs = activeSession.batas_terlambat * 60 * 1000;
        if (now - startTimeObj > limitMs) {
          finalStatus = "Terlambat";
        }
      }

      try {
        const baseUrl = window.location.protocol === "file:" ? "http://localhost:3001" : "";
        const response = await fetch(baseUrl + "/api/attendance/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: activeSession.id,
            username: username,
            status: finalStatus,
            keterangan: keterangan
          })
        });

        if (response.ok) {
          await MPIAlert.success("Absensi Berhasil", `Kehadiran Anda berhasil dicatat dengan status: ${finalStatus}!`);
          const activeKelas = localStorage.getItem("userKelas") || "";
          checkActiveAttendance(activeKelas);
          loadStudentAttendanceHistory(username);
        } else {
          const data = await response.json();
          await MPIAlert.error("Gagal", data.error || "Gagal melakukan absensi.");
        }
      } catch (err) {
        console.error("Error submitting attendance:", err);
        await MPIAlert.error("Kesalahan Jaringan", "Terjadi kesalahan koneksi.");
      } finally {
        btn.disabled = false;
        btn.innerHTML = origText;
      }
    });
  }

  // Start Hero Background Slideshow
  initHeroSlideshow();
});

async function fetchMaterials(kelas) {
  try {
    const response = await fetch("/api/materials/" + encodeURIComponent(kelas));
    const materials = await response.json();
    const listContainer = document.getElementById("lms-materials-list");

    if (materials.length > 0) {
      listContainer.innerHTML = materials
        .map(
          (m) => `
        <a href="/uploads/${m.path}" target="_blank" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
          <div>
            <i class="fas fa-file-alt text-primary me-2"></i> <strong>${m.title}</strong>
          </div>
          <span class="badge bg-primary rounded-pill"><i class="fas fa-download"></i></span>
        </a>
      `,
        )
        .join("");
    } else {
      listContainer.innerHTML = `
        <div class="text-center text-muted py-4 bg-light rounded">
          <i class="fas fa-folder-open fa-3x mb-3" style="color: #cbd5e1;"></i>
          <p class="mb-0 fw-medium">Belum ada materi untuk saat ini.</p>
        </div>
      `;
    }
  } catch (e) {
    console.error("Failed to fetch materials", e);
  }
}

function isClassActive(hari, jam, tanggal) {
  if (!hari || !jam) return true; // Aktif secara default jika jadwal belum diset oleh admin

  const now = new Date();

  // Jika ada tanggal pasti, periksa apakah hari ini adalah tanggal tersebut
  if (tanggal) {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const todayDateStr = `${year}-${month}-${date}`;
    
    if (todayDateStr !== tanggal) {
      return false; // Tanggal tidak cocok
    }
  } else {
    // Fallback ke hari mingguan jika tidak ada tanggal pasti
    const daysMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const todayDayName = daysMap[now.getDay()];
    if (todayDayName.toLowerCase() !== hari.toLowerCase()) {
      return false; // Hari tidak cocok
    }
  }

  // Parse jam range seperti "08:00 - 10:30 WIB"
  const timeMatch = jam.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
  if (!timeMatch) return true; // Jika format tidak cocok, buka akses default

  const startTimeStr = timeMatch[1];
  const endTimeStr = timeMatch[2];

  const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return currentHM >= startTimeStr && currentHM <= endTimeStr;
}

async function showDashboard(kelas) {
  document.getElementById("class-catalog-view").style.display = "none";
  document.getElementById("lms-dashboard-view").style.display = "block";
  document.getElementById("lms-class-title").textContent = "Kelas: " + kelas;

  const mentorEl = document.getElementById("lms-class-mentor");
  const scheduleEl = document.getElementById("lms-class-schedule");
  const statusEl = document.getElementById("lms-class-status-badge");
  const lmsWrapper = document.querySelector(".lms-content-wrapper-relative");

  // Hapus overlay kunci jika sebelumnya sudah ada
  const existingOverlay = document.getElementById("lms-lock-layer");
  if (existingOverlay) existingOverlay.remove();

  try {
    const response = await fetch("/api/courses");
    const courses = await response.json();
    const course = courses.find((c) => c.nama_kelas === kelas);

    if (course) {
      const mentor = course.mentor || "Belum diatur";
      const dateObj = course.tanggal ? new Date(course.tanggal) : null;
      const formattedDate = dateObj && !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
        : "";
      const schedule = course.hari && course.jam 
        ? (course.tanggal && formattedDate ? `${formattedDate} (${course.hari}), ${course.jam}` : `${course.hari}, ${course.jam}`)
        : "Belum diatur";

      if (mentorEl) mentorEl.textContent = mentor;
      if (scheduleEl) scheduleEl.textContent = schedule;

      const active = isClassActive(course.hari, course.jam, course.tanggal);

      if (statusEl) {
        if (active) {
          statusEl.innerHTML = `
            <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-semibold" style="font-size: 0.85rem;">
              <span class="d-inline-block bg-success rounded-circle animate-pulse" style="width: 8px; height: 8px; margin-right: 6px;"></span>
              Akses Terbuka: Kelas Sedang Aktif
            </span>
          `;
        } else {
          statusEl.innerHTML = `
            <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill fw-semibold" style="font-size: 0.85rem;">
              <span class="d-inline-block bg-danger rounded-circle" style="width: 8px; height: 8px; margin-right: 6px;"></span>
              Akses Terkunci: Di Luar Jadwal
            </span>
          `;
        }
      }

      if (!active) {
        // Tampilkan overlay penguncian jika kelas tidak aktif
        const lockLayer = document.createElement("div");
        lockLayer.id = "lms-lock-layer";
        lockLayer.className = "lms-locked-overlay";
        lockLayer.innerHTML = `
          <div class="lms-locked-icon"><i class="fas fa-lock"></i></div>
          <h4>Akses Pembelajaran Terkunci</h4>
          <p>
            Maaf, materi pembelajaran dan form pengumpulan tugas kelas ini sedang dikunci otomatis.<br>
            Silakan masuk kembali pada jadwal perkuliahan yang telah ditentukan:<br>
            <strong class="text-primary mt-2 d-inline-block" style="font-size: 1.15rem;"><i class="far fa-clock me-1"></i> ${schedule}</strong><br>
            Bersama Mentor: <strong class="text-dark">${mentor}</strong>.
          </p>
        `;
        lmsWrapper.appendChild(lockLayer);
      }
    } else {
      if (mentorEl) mentorEl.textContent = "Belum diatur";
      if (scheduleEl) scheduleEl.textContent = "Belum diatur";
      if (statusEl) statusEl.innerHTML = "";
    }
  } catch (err) {
    console.error("Failed to load active course status", err);
  }

  fetchMaterials(kelas);
  fetchClassTasks(kelas);
  checkActiveAttendance(kelas);
  const username = localStorage.getItem("username");
  if (username) {
    loadStudentAttendanceHistory(username);
  }
}

async function fetchClassTasks(kelas) {
  try {
    const response = await fetch(`/api/class_tasks/${encodeURIComponent(kelas)}`);
    const tasks = await response.json();
    activeTasksList = tasks;
    
    const selectEl = document.getElementById("assignment-task-select");
    if (!selectEl) return;
    
    selectEl.innerHTML = `
      <option value="" disabled selected>Pilih tugas yang ingin dikumpulkan...</option>
      <option value="general">Tugas Bebas / Mandiri (Tanpa Batas Waktu)</option>
    `;
    
    tasks.forEach(task => {
      const option = document.createElement("option");
      option.value = task.id;
      option.textContent = task.title;
      selectEl.appendChild(option);
    });
  } catch (err) {
    console.error("Gagal mengambil tugas kelas:", err);
  }
}

async function showCatalog() {
  document.getElementById("lms-dashboard-view").style.display = "none";
  document.getElementById("class-catalog-view").style.display = "block";

  const grid = document.getElementById("catalog-grid");
  grid.innerHTML =
    '<div class="text-center text-muted">Memuat daftar kelas...</div>';

  try {
    const response = await fetch("/api/courses");
    const courses = await response.json();

    if (courses.length > 0) {
      grid.innerHTML = courses
        .map(
          (c) => {
            const dateObj = c.tanggal ? new Date(c.tanggal) : null;
            const formattedDate = dateObj && !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
              : "";
            const scheduleLabel = c.hari && c.jam 
              ? (c.tanggal && formattedDate ? `${formattedDate} (${c.hari}), ${c.jam}` : `${c.hari}, ${c.jam}`)
              : "Belum diatur";

            const active = isClassActive(c.hari, c.jam, c.tanggal);

            return `
              <div class="col-md-4 mb-4">
                <div class="class-card text-center h-100 d-flex flex-column p-4" style="border-radius: 20px;">
                  <div class="icon-wrapper">
                    <i class="fas fa-graduation-cap"></i>
                  </div>
                  <h4 class="fw-bold mt-2">${c.nama_kelas}</h4>
                  <p class="text-muted small flex-grow-1">${c.deskripsi || "Tidak ada deskripsi."}</p>
                  
                  <div class="class-meta border-top border-bottom py-2 my-3 text-start small">
                    <div class="mb-1 text-truncate"><i class="fas fa-user-tie text-primary me-2"></i><strong>Mentor:</strong> ${c.mentor || "Belum diatur"}</div>
                    <div class="text-truncate"><i class="far fa-calendar-alt text-primary me-2"></i><strong>Jadwal:</strong> ${scheduleLabel}</div>
                  </div>

                  <div class="mb-3">
                    ${active
                      ? `<span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-semibold"><i class="fas fa-circle-play me-1 animate-pulse"></i> Kelas Aktif Sekarang</span>`
                      : `<span class="badge bg-light text-muted border border-secondary-subtle px-3 py-2 rounded-pill"><i class="fas fa-circle-stop me-1"></i> Kelas Tidak Aktif</span>`}
                  </div>

                  <button onclick="enrollClass('${c.nama_kelas}')" class="btn btn-enroll mt-auto w-100">Pilih Kelas</button>
                </div>
              </div>
            `;
          }
        )
        .join("");
    } else {
      grid.innerHTML =
        '<div class="text-center text-muted">Belum ada kelas yang tersedia.</div>';
    }
  } catch (e) {
    grid.innerHTML =
      '<div class="text-center text-danger">Gagal memuat katalog kelas.</div>';
  }
}

async function enrollClass(kelas) {
  const username = localStorage.getItem("username");
  if (!username) {
    await MPIAlert.error("Sesi Habis", "Sesi telah habis, silakan login kembali.");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, kelas }),
    });

    if (response.ok) {
      localStorage.setItem("userKelas", kelas);
      showDashboard(kelas);
    } else {
      await MPIAlert.error("Gagal", "Gagal mendaftar kelas.");
    }
  } catch (e) {
    await MPIAlert.error("Kesalahan Jaringan", "Terjadi kesalahan jaringan.");
  }
}

// Initialize
updateGallery();

// User News Fetching
let globalNewsList = [];

async function fetchUserNews() {
  try {
    const response = await fetch("/api/news", { cache: "no-store" });
    const news = await response.json();
    globalNewsList = news;
    const container = document.getElementById("user-news-container");
    if (!container) return;

    if (news.length === 0) {
      container.innerHTML =
        '<div class="col-12 text-center text-muted">Belum ada berita.</div>';
      return;
    }

    container.innerHTML = news
      .map(
        (n) => `
      <div class="col-md-4 mb-4">
        <div class="card h-100 border-0 shadow-sm" style="border-radius: 20px; overflow: hidden; transition: all 0.3s; cursor: pointer;" onclick="showNewsDetail(${n.id})" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 15px 30px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.05)'">
          ${n.image_path ? `<img src="/gallery/${n.image_path}" class="card-img-top" style="height: 200px; object-fit: cover;">` : `<div style="height: 200px; background: #f1f5f9; display: flex; align-items: center; justify-content: center;"><i class="fas fa-newspaper fa-4x text-muted"></i></div>`}
          <div class="card-body p-4">
            <small class="text-primary fw-bold"><i class="far fa-calendar-alt"></i> ${new Date(n.created_at).toLocaleDateString("id-ID")}</small>
            <h5 class="card-title fw-bold mt-2">${n.title}</h5>
            <p class="card-text text-muted" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${n.content}</p>
          </div>
        </div>
      </div>
    `,
      )
      .join("");
  } catch (e) {
    console.error("Error fetching news", e);
  }
}

function showNewsDetail(id) {
  const news = globalNewsList.find(n => n.id === id);
  if (!news) return;

  const dateStr = new Date(news.created_at).toLocaleDateString("id-ID", {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  document.getElementById("news-detail-title").textContent = news.title;
  document.getElementById("news-detail-date").innerHTML = `<i class="far fa-calendar-alt me-1"></i> ${dateStr}`;
  
  // Format content with paragraphs
  const formattedContent = news.content.split('\\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');
  document.getElementById("news-detail-content").innerHTML = formattedContent;

  const imageContainer = document.getElementById("news-detail-image-container");
  if (news.image_path) {
    imageContainer.innerHTML = `<img src="/gallery/${news.image_path}" class="w-100" style="max-height: 450px; object-fit: cover; border-bottom: 5px solid #4338ca;" alt="News Image">`;
  } else {
    imageContainer.innerHTML = '';
  }

  // Switch section
  showSection('news-detail-page');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// User Settings
async function fetchUserSettings(username) {
  try {
    const response = await fetch(`/api/users/${encodeURIComponent(username)}?t=${Date.now()}`, { cache: "no-store" });
    const user = await response.json();
    if (user) {
      // Sync class with database to avoid any desynchronization
      if (user.kelas !== undefined) {
        const currentLocalKelas = localStorage.getItem("userKelas");
        const dbKelas = user.kelas || "";
        if (dbKelas !== currentLocalKelas) {
          localStorage.setItem("userKelas", dbKelas);
          window.location.reload();
          return;
        }
      }

      document.getElementById("set-nim").value = user.nim || "";
      document.getElementById("set-angkatan").value = user.angkatan || "";
      document.getElementById("set-nomerHp").value = user.nomerHp || "";

      if (user.profile_pic) {
        const picUrl = `/uploads/${user.profile_pic}`;
        document.getElementById("sidebar-profile-pic").src = picUrl;
        document.getElementById("set-profile-preview").src = picUrl;
      }
    }
  } catch (e) {
    console.error("Error fetching user settings", e);
  }
}

let cropper;
let croppedBlob = null;

function previewProfilePic(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("imageToCrop").src = e.target.result;
      const modal = new bootstrap.Modal(
        document.getElementById("cropperModal"),
      );
      modal.show();

      const image = document.getElementById("imageToCrop");
      if (cropper) {
        cropper.destroy();
      }
      // Wait for modal to be fully visible before initializing Cropper
      document.getElementById("cropperModal").addEventListener(
        "shown.bs.modal",
        function () {
          cropper = new Cropper(image, {
            aspectRatio: 1,
            viewMode: 1,
            background: false,
          });
        },
        { once: true },
      );
    };
    reader.readAsDataURL(file);
  }
}

document.getElementById("cropImageBtn")?.addEventListener("click", () => {
  if (cropper) {
    cropper
      .getCroppedCanvas({
        width: 400,
        height: 400,
      })
      .toBlob(
        (blob) => {
          croppedBlob = blob;
          const url = URL.createObjectURL(blob);
          document.getElementById("set-profile-preview").src = url;

          const modal = bootstrap.Modal.getInstance(
            document.getElementById("cropperModal"),
          );
          modal.hide();
        },
        "image/jpeg",
        0.9,
      );
  }
});

document
  .getElementById("settings-form")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const username = localStorage.getItem("username");
    const nim = document.getElementById("set-nim").value;
    const angkatan = document.getElementById("set-angkatan").value;
    const nomerHp = document.getElementById("set-nomerHp").value;
    const password = document.getElementById("set-password").value;

    const formData = new FormData();
    formData.append("nim", nim);
    formData.append("angkatan", angkatan);
    formData.append("nomerHp", nomerHp);
    if (password) formData.append("password", password);

    if (croppedBlob) {
      formData.append("profile_pic", croppedBlob, "profile.jpg");
    } else {
      const profilePicInput = document.getElementById("set-profile-pic");
      if (profilePicInput.files.length > 0) {
        formData.append("profile_pic", profilePicInput.files[0]);
      }
    }

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(username)}`, {
        method: "PUT",
        body: formData,
      });
      if (response.ok) {
        await MPIAlert.success("Pengaturan Disimpan", "Pengaturan akun berhasil disimpan!");
        document.getElementById("set-password").value = "";
        fetchUserSettings(username); // Refresh profile pic
        croppedBlob = null; // Reset
      } else {
        await MPIAlert.error("Gagal", "Gagal menyimpan pengaturan.");
      }
    } catch (e) {
      await MPIAlert.error("Terjadi Kesalahan", "Terjadi kesalahan.");
    }
  });

function initHeroSlideshow() {
  const heroBg = document.querySelector(".hero-bg-image");
  if (!heroBg) return;

  const heroImages = [
    "img/kelas 2.jpeg",
    "img/kelas 1.jpeg",
  ];

  let currentIndex = 0;

  // Set initial background image
  heroBg.style.backgroundImage = `url('${heroImages[currentIndex]}')`;
  heroBg.style.backgroundPosition = "right center";
  heroBg.style.backgroundSize = "cover";
  heroBg.style.backgroundRepeat = "no-repeat";
  heroBg.style.transition = "background-image 1s ease-in-out, opacity 1s ease-in-out";

  setInterval(() => {
    // Fade out
    heroBg.style.opacity = "0";

    setTimeout(() => {
      currentIndex = (currentIndex + 1) % heroImages.length;
      heroBg.style.backgroundImage = `url('${heroImages[currentIndex]}')`;
      // Fade back in to 0.5 (as set in css opacity)
      heroBg.style.opacity = "0.5";
    }, 1000); // match transition duration
  }, 5000); // transition every 5 seconds
}

// 9. LOAD INBOX DATA (GRADES & FEEDBACK) FOR STUDENTS
async function loadInboxData() {
  const username = localStorage.getItem("username");
  const tbody = document.getElementById("inbox-table-body");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center py-4 text-muted">
        <i class="fas fa-spinner fa-spin fa-2x mb-3 text-primary d-block"></i>
        Memuat data inbox...
      </td>
    </tr>
  `;

  try {
    const response = await fetch("/api/assignments");
    const assignments = await response.json();
    
    // Filter assignments for the logged-in student
    const studentAssignments = assignments.filter(a => a.username === username);

    if (studentAssignments.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-5 text-muted">
            <i class="fas fa-envelope-open fa-3x mb-3 text-secondary d-block"></i>
            Belum ada tugas yang dikumpulkan.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = studentAssignments.map(a => {
      const isGraded = a.grade !== null && a.grade !== undefined && a.grade !== "";
      const gradeBadge = isGraded
        ? `<span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-bold" style="font-size: 0.9rem;">
             <i class="fas fa-star me-1"></i> ${a.grade}
           </span>`
        : `<span class="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 rounded-pill">
             <i class="fas fa-clock me-1"></i> Belum Dinilai
           </span>`;
      
      const feedbackText = isGraded
        ? `<div class="p-3 bg-light rounded-3 text-dark fw-medium" style="font-size: 0.88rem; line-height: 1.5; border-left: 4px solid #10b981;">
             ${a.feedback || "Tidak ada saran khusus."}
           </div>`
        : `<span class="text-muted small">Menunggu penilaian mentor.</span>`;

      return `
        <tr class="border-bottom">
          <td>
            <div class="fw-bold text-dark">${a.title}</div>
            <small class="text-muted"><i class="far fa-clock me-1"></i> ${new Date(a.timestamp).toLocaleString("id-ID")}</small>
          </td>
          <td><span class="badge bg-light text-primary border px-2 py-1 rounded" style="font-size: 0.78rem;">${a.kelas}</span></td>
          <td>${gradeBadge}</td>
          <td>${feedbackText}</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Gagal memuat inbox:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4 text-danger">
          <i class="fas fa-exclamation-triangle fa-2x mb-2 d-block"></i>
          Gagal mengambil data inbox dari server.
        </td>
      </tr>
    `;
  }
}

// 10. CHAT SYSTEM INTEGRATION WITH ADMIN
let chatInterval = null;

function toggleAdminChat() {
  let chatWin = document.getElementById("chat-window");
  if (!chatWin) {
    chatWin = document.createElement("div");
    chatWin.id = "chat-window";
    chatWin.className = "chat-window";
    document.body.appendChild(chatWin);
  }

  const isVisible = chatWin.style.display === "flex";
  
  if (isVisible) {
    closeChat();
  } else {
    const adminPic = "/img/1.png"; // default icon for admin
    chatWin.style.display = "flex";
    chatWin.innerHTML = `
      <div class="chat-header" style="background: linear-gradient(135deg, #e40fef, #4338ca);">
        <div class="chat-header-user">
          <img src="${adminPic}" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;">
          <div>
            <h6 class="mb-0 fw-bold">Admin MPI</h6>
            <small style="font-size: 0.7rem; opacity: 0.9;">Online</small>
          </div>
        </div>
        <button class="chat-close-btn" onclick="closeChat()"><i class="fas fa-times"></i></button>
      </div>
      <div class="chat-messages" id="chat-messages-container"></div>
      <div class="chat-typing-indicator" id="chat-typing">sedang mengetik...</div>
      <div class="chat-footer">
        <input type="text" class="chat-input" id="chat-input-field" placeholder="Ketik pesan..." onkeydown="handleChatKey(event)">
        <button class="chat-send-btn" onclick="sendChatMessage()" style="background: linear-gradient(135deg, #e40fef, #4338ca);"><i class="fas fa-paper-plane"></i></button>
      </div>
    `;
    
    const username = localStorage.getItem("username");
    loadChatMessages(username);
    
    // Poll chat messages every 1.5 seconds to simulate real-time chat sync
    chatInterval = setInterval(() => {
      loadChatMessages(username);
    }, 1500);
  }
}

function closeChat() {
  const chatWin = document.getElementById("chat-window");
  if (chatWin) chatWin.style.display = "none";
  if (chatInterval) {
    clearInterval(chatInterval);
    chatInterval = null;
  }
}

function loadChatMessages(username) {
  const container = document.getElementById("chat-messages-container");
  if (!container) return;

  const storageKey = `chat_history_${username}`;
  let history = JSON.parse(localStorage.getItem(storageKey)) || [];

  if (history.length === 0) {
    history = [
      { sender: "system", text: `Mulai percakapan dengan Admin` },
      { sender: "sent", text: "Halo! Ada yang bisa kami bantu terkait sistem akademik Lab MPI?" }
    ];
    localStorage.setItem(storageKey, JSON.stringify(history));
  }

  // Determine current scroll position before render
  const wasAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 40;

  container.innerHTML = history.map(msg => {
    if (msg.sender === "system") {
      return `<div class="text-center text-muted small py-1" style="font-size: 0.75rem;">${msg.text}</div>`;
    }
    
    // In student's view:
    // msg.sender === "received" is the message sent by the student (sent / right side)
    // msg.sender === "sent" is the message sent by the admin (received / left side)
    const isStudentMsg = msg.sender === "received";
    const bubbleClass = isStudentMsg ? "sent" : "received";
    
    return `
      <div class="chat-message ${bubbleClass}">
        ${msg.text}
      </div>
    `;
  }).join("");

  if (wasAtBottom) {
    container.scrollTop = container.scrollHeight;
  }
}

function handleChatKey(event) {
  if (event.key === "Enter") {
    sendChatMessage();
  }
}

function sendChatMessage() {
  const input = document.getElementById("chat-input-field");
  if (!input) return;
  
  const val = input.value.trim();
  if (!val) return;

  const username = localStorage.getItem("username");
  const storageKey = `chat_history_${username}`;
  let history = JSON.parse(localStorage.getItem(storageKey)) || [];

  // push message as "received" in admin-compatible history schema (represents student message)
  history.push({ sender: "received", text: val });
  localStorage.setItem(storageKey, JSON.stringify(history));

  input.value = "";
  loadChatMessages(username);

  // Trigger typing simulation after student sends a message
  const typing = document.getElementById("chat-typing");
  if (typing) {
    typing.style.display = "block";
    setTimeout(() => {
      typing.style.display = "none";
    }, 1500);
  }
}

// Expose functions globally for HTML element handlers
window.toggleAdminChat = toggleAdminChat;
window.closeChat = closeChat;
window.handleChatKey = handleChatKey;
window.sendChatMessage = sendChatMessage;

// 11. CHECK ACTIVE ATTENDANCE SESSIONS & STUDENT SUBMISSION STATUS
async function checkActiveAttendance(kelas) {
  const widget = document.getElementById("attn-student-widget");
  const noSessionWidget = document.getElementById("attn-no-session-widget");
  const noSessionDetail = document.getElementById("attn-no-session-detail");
  if (!widget) return;

  if (!kelas || kelas === "null" || kelas.trim() === "") {
    widget.classList.add("d-none");
    if (noSessionWidget) {
      noSessionWidget.classList.remove("d-none");
      if (noSessionDetail) {
        noSessionDetail.textContent = "Anda belum terdaftar di kelas manapun. Silakan pilih kelas terlebih dahulu di menu Class.";
      }
    }
    localStorage.removeItem("activeAttnSession");
    return;
  }

  try {
    const baseUrl = window.location.protocol === "file:" ? "http://localhost:3001" : "";
    const response = await fetch(baseUrl + `/api/attendance/session/active?kelas=${encodeURIComponent(kelas)}`);
    const data = await response.json();

    if (!data.active) {
      widget.classList.add("d-none");
      if (noSessionWidget) {
        noSessionWidget.classList.remove("d-none");
        if (noSessionDetail) {
          noSessionDetail.textContent = "Silakan periksa lagi nanti atau hubungi mentor Anda jika kelas sedang berlangsung.";
        }
      }
      localStorage.removeItem("activeAttnSession");
      return;
    }

    // Active session exists!
    const session = data.session;
    localStorage.setItem("activeAttnSession", JSON.stringify(session));
    widget.classList.remove("d-none");
    if (noSessionWidget) noSessionWidget.classList.add("d-none");

    const timeBadge = document.getElementById("attn-session-time-badge");
    if (timeBadge) {
      timeBadge.textContent = `${session.waktu_mulai} - ${session.waktu_selesai} WIB`;
    }

    // Check if student already submitted attendance for this session
    const username = localStorage.getItem("username");
    const recResponse = await fetch(baseUrl + `/api/attendance/records?session_id=${session.id}`);
    const records = await recResponse.json();
    const myRecord = records.find(r => r.username === username);

    const form = document.getElementById("student-attendance-form");
    const statusMsg = document.getElementById("attn-status-msg");

    if (myRecord) {
      // Already submitted
      if (form) form.classList.add("d-none");
      
      let badgeStyle = "bg-success text-white px-2 py-1 rounded ms-2";
      if (myRecord.status === "Terlambat") badgeStyle = "bg-warning text-dark px-2 py-1 rounded ms-2";
      if (myRecord.status === "Izin" || myRecord.status === "Sakit") badgeStyle = "bg-info text-white px-2 py-1 rounded ms-2";

      const attnTime = new Date(myRecord.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

      if (statusMsg) {
        statusMsg.innerHTML = `
          <div class="alert alert-success border-0 mb-0 d-flex align-items-center justify-content-between p-3 rounded-4" style="background: rgba(16, 185, 129, 0.1); color: #064e3b;">
            <div>
              <i class="fas fa-check-circle me-2"></i><strong>Absensi Terkirim!</strong> Anda telah mencatatkan kehadiran pada pukul ${attnTime} WIB.
            </div>
            <div>
              Status: <span class="${badgeStyle}">${myRecord.status}</span>
            </div>
          </div>
        `;
      }
    } else {
      // Not submitted yet
      if (form) form.classList.remove("d-none");
      if (statusMsg) {
        statusMsg.innerHTML = `<i class="fas fa-info-circle me-1 text-primary"></i> Silakan mengisi daftar kehadiran kelas Anda sebelum sesi ditutup pada pukul <strong>${session.waktu_selesai} WIB</strong>.`;
      }
    }
  } catch (err) {
    console.error("Error checking active attendance session:", err);
  }
}

async function loadStudentAttendanceHistory(username) {
  const tbody = document.getElementById("student-attendance-history-body");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center py-4 text-muted">
        <i class="fas fa-spinner fa-spin fa-2x mb-3 text-primary d-block"></i>
        Memuat riwayat kehadiran...
      </td>
    </tr>
  `;

  try {
    const baseUrl = window.location.protocol === "file:" ? "http://localhost:3001" : "";
    const response = await fetch(baseUrl + `/api/attendance/student/history?username=${encodeURIComponent(username)}`);
    const history = await response.json();

    if (history.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4 text-muted">
            <i class="fas fa-info-circle fa-2x mb-2 text-secondary d-block"></i>
            Anda belum memiliki riwayat absensi.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = history.map(r => {
      let badgeStyle = "bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill small";
      if (r.status === "Terlambat") badgeStyle = "bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 rounded-pill small";
      if (r.status === "Izin" || r.status === "Sakit") badgeStyle = "bg-info-subtle text-info border border-info-subtle px-2 py-1 rounded-pill small";

      const formattedDate = new Date(r.tanggal).toLocaleDateString("id-ID", {
        day: "numeric", month: "long", year: "numeric"
      });

      const formattedTime = new Date(r.timestamp).toLocaleTimeString("id-ID", {
        hour: "2-digit", minute: "2-digit"
      });

      return `
        <tr>
          <td><div class="fw-bold text-dark">${formattedDate}</div></td>
          <td class="text-muted small">${r.waktu_mulai} - ${r.waktu_selesai} WIB</td>
          <td><span class="${badgeStyle}">${r.status}</span> <small class="text-muted d-block mt-1">${formattedTime} WIB</small></td>
          <td class="text-muted small">${r.keterangan || "-"}</td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error("Error loading student attendance history:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4 text-danger">
          Gagal mengambil data riwayat absensi.
        </td>
      </tr>
    `;
  }
}

window.checkActiveAttendance = checkActiveAttendance;
window.loadStudentAttendanceHistory = loadStudentAttendanceHistory;

