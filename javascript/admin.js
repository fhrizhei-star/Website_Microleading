// MPIAlert - Premium Custom Notification and Alert System
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

  confirm(title, message) {
    return new Promise((resolve) => {
      const icon = '<i class="fas fa-triangle-exclamation"></i>';
      const buttons = `
        <button class="mpi-alert-btn cancel">Batal</button>
        <button class="mpi-alert-btn confirm-danger">Ya, Hapus</button>
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
  const root = document.documentElement;
  root.setAttribute("data-theme", "light");
  localStorage.setItem("theme", "light");
}

function showAdminSection(sectionId, element) {
  document
    .querySelectorAll(".section")
    .forEach((sec) => sec.classList.remove("active"));
  document
    .querySelectorAll(".nav-link")
    .forEach((link) => link.classList.remove("active"));

  document.getElementById(sectionId).classList.add("active");
  if (element) element.classList.add("active");
}

function logout(event) {
  if (event) event.preventDefault();
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("userRole");
  window.location.replace("login.html");
}

document.addEventListener("DOMContentLoaded", async () => {
  const username = localStorage.getItem("username");
  if (username) {
    const rightSidebarUsername = document.getElementById("right-sidebar-username");
    if (rightSidebarUsername) {
      rightSidebarUsername.textContent = username;
    }

    // Fetch admin profile data
    try {
      const response = await fetch(`/api/users/${username}`);
      const user = await response.json();
      if (user && user.profile_pic) {
        document.getElementById("sidebar-profile-pic").src =
          `/uploads/${user.profile_pic}`;
        
        const rightSidebarProfilePic = document.getElementById("right-sidebar-profile-pic");
        if (rightSidebarProfilePic) {
          rightSidebarProfilePic.src = `/uploads/${user.profile_pic}`;
        }
      }
    } catch (e) {
      console.error("Error fetching admin data", e);
    }
  }

  fetchDashboardData();
  fetchCourses();
  fetchStudents();
  fetchAssignments();
  updateGallery();
  fetchNews();
  loadOnlineUsers();
  initRotator();
  renderCalendar();
  loadMentorSchedules();
  fetchMentorsDropdown();
});

async function fetchMentorsDropdown() {
  try {
    const response = await fetch("/api/mentors");
    const mentors = await response.json();
    
    const select = document.getElementById("course-mentor");
    const schedSelect = document.getElementById("sched-course-mentor");

    if (select) {
      select.innerHTML = '<option value="" disabled selected>Pilih Mentor</option>';
      mentors.forEach(m => {
        const option = document.createElement("option");
        option.value = m.username;
        option.textContent = m.username;
        select.appendChild(option);
      });
    }

    if (schedSelect) {
      schedSelect.innerHTML = '<option value="" disabled selected>Pilih Mentor</option>';
      mentors.forEach(m => {
        const option = document.createElement("option");
        option.value = m.username;
        option.textContent = m.username;
        schedSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Gagal mengambil daftar mentor:", err);
  }
}

async function fetchDashboardData() {
  try {
    const [coursesRes, studentsRes, assignmentsRes, galleryRes, newsRes] = await Promise.all([
      fetch("/api/courses"),
      fetch("/api/users"),
      fetch("/api/assignments"),
      fetch("/api/gallery"),
      fetch("/api/news"),
    ]);

    const courses = await coursesRes.json();
    const students = await studentsRes.json();
    const assignments = await assignmentsRes.json();
    const gallery = await galleryRes.json();
    const news = await newsRes.json();

    const coursesCount = document.getElementById("count-courses");
    if (coursesCount) coursesCount.textContent = courses.length || 0;
    
    const studentsCount = document.getElementById("count-students");
    if (studentsCount) studentsCount.textContent = students.length || 0;
    
    const assignmentsCount = document.getElementById("count-assignments");
    if (assignmentsCount) assignmentsCount.textContent = assignments.length || 0;

    const galleryCount = document.getElementById("count-gallery");
    if (galleryCount) galleryCount.textContent = gallery.length || 0;

    const newsCount = document.getElementById("count-news");
    if (newsCount) newsCount.textContent = news.length || 0;
  } catch (e) {
    console.error("Failed to load dashboard data", e);
  }
}

let coursesListGlobal = [];
let editCourseId = null;

async function fetchCourses() {
  try {
    const response = await fetch("/api/admin/courses");
    const courses = await response.json();
    coursesListGlobal = courses;

    // Populate table
    const tbody = document.getElementById("course-table-body");
    tbody.innerHTML = courses
      .map(
        (c, i) => {
          const isPending = c.status === 'pending';
          const statusBadge = isPending
            ? `<span class="badge bg-warning-subtle text-warning border border-warning-subtle py-2 px-3" style="font-size: 0.78rem; border-radius: 8px;"><i class="fas fa-clock me-1"></i> Pending</span>`
            : `<span class="badge bg-success-subtle text-success border border-success-subtle py-2 px-3" style="font-size: 0.78rem; border-radius: 8px;"><i class="fas fa-check-circle me-1"></i> Aktif</span>`;

          const approveBtn = isPending
            ? `<button class="btn btn-sm btn-outline-success rounded-circle shadow-sm" onclick="approveCourse(${c.id})" style="width: 35px; height: 35px; padding: 0;" title="Setujui Kelas">
                <i class="fas fa-check"></i>
               </button>`
            : '';

          const dateObj = c.tanggal ? new Date(c.tanggal) : null;
          const formattedDate = dateObj && !isNaN(dateObj.getTime())
            ? dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
            : "";
          const scheduleLabel = c.tanggal && formattedDate
            ? `${formattedDate} (${c.hari})`
            : c.hari;

          return `
            <tr>
              <td class="text-muted fw-bold">${i + 1}</td>
              <td class="fw-bold" style="color: var(--primary);">${c.nama_kelas}</td>
              <td class="fw-semibold text-dark">${c.mentor || "-"}</td>
              <td>
                ${c.hari && c.jam ? `<span class="badge bg-light text-primary border border-primary-subtle px-3 py-2" style="font-size: 0.78rem; border-radius: 8px;"><i class="far fa-calendar-alt me-1"></i> ${scheduleLabel}, ${c.jam}</span>` : "-"}
              </td>
              <td class="text-muted" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${c.deskripsi || ''}">${c.deskripsi || "-"}</td>
              <td>${statusBadge}</td>
              <td class="text-center">
                <div class="d-flex justify-content-center gap-2">
                  ${approveBtn}
                  <button class="btn btn-sm btn-outline-primary rounded-circle shadow-sm" onclick="startEditCourse(${c.id})" style="width: 35px; height: 35px; padding: 0;">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger rounded-circle shadow-sm" onclick="deleteCourse(${c.id})" style="width: 35px; height: 35px; padding: 0;">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }
      )
      .join("");

    // Populate select in Materials tab
    const select = document.getElementById("material-class");
    select.innerHTML =
      '<option value="" disabled selected>Pilih Kelas</option>' +
      courses
        .map(
          (c) => `
      <option value="${c.nama_kelas}">${c.nama_kelas}</option>
    `,
        )
        .join("");
  } catch (error) {
    console.error(error);
  }
}

function startEditCourse(id) {
  const course = coursesListGlobal.find((c) => c.id === id);
  if (!course) return;

  editCourseId = id;

  document.getElementById("course-name").value = course.nama_kelas;
  
  const mentorSelect = document.getElementById("course-mentor");
  if (mentorSelect && course.mentor) {
    let exists = false;
    for (let i = 0; i < mentorSelect.options.length; i++) {
      if (mentorSelect.options[i].value === course.mentor) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      const option = document.createElement("option");
      option.value = course.mentor;
      option.textContent = course.mentor + " (Legacy / Tidak Terdaftar)";
      mentorSelect.appendChild(option);
    }
  }
  document.getElementById("course-mentor").value = course.mentor || "";
  document.getElementById("course-date").value = course.tanggal || "";

  // Parse time range back to separate inputs
  let startVal = "";
  let endVal = "";
  if (course.jam) {
    const match = course.jam.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    if (match) {
      startVal = match[1];
      endVal = match[2];
    }
  }
  document.getElementById("course-time-start").value = startVal;
  document.getElementById("course-time-end").value = endVal;
  document.getElementById("course-desc").value = course.deskripsi || "";

  // Set advanced configurations
  document.getElementById("course-auto-attn").checked = course.auto_attn === 1 || course.auto_attn === true || course.auto_attn === '1';
  document.getElementById("course-attn-late").value = course.attn_late || 15;
  document.getElementById("course-auto-task").checked = course.auto_task === 1 || course.auto_task === true || course.auto_task === '1';
  document.getElementById("course-task-title").value = course.task_title || "";
  document.getElementById("course-task-desc").value = course.task_desc || "";

  // Expand settings accordion automatically if custom options were defined
  const isAdvSet = (course.auto_attn === 0 || course.attn_late !== 15 || course.auto_task === 1 || course.task_title || course.task_desc);
  if (isAdvSet) {
    const collEl = document.getElementById("collapseAdvSettings");
    if (collEl && !collEl.classList.contains("show")) {
      const bsCollapse = new bootstrap.Collapse(collEl, { toggle: true });
    }
  }

  // Scroll smoothly to form card
  document.getElementById("courses").scrollIntoView({ behavior: "smooth" });

  // Update UI Titles
  const formTitle = document.querySelector("#courses .card h5");
  if (formTitle) {
    formTitle.innerHTML = `<i class="fas fa-edit me-2 text-primary"></i> Edit Kelas: ${course.nama_kelas}`;
  }

  const submitBtn = document.querySelector("#add-course-form button[type='submit']");
  if (submitBtn) {
    submitBtn.innerHTML = `<i class="fas fa-save me-2"></i> Update Kelas`;
  }

  // Show a cancel button if not already present
  let cancelBtn = document.getElementById("cancel-edit-btn");
  if (!cancelBtn) {
    cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.id = "cancel-edit-btn";
    cancelBtn.className = "btn btn-light w-100 mt-2 p-3 fw-bold";
    cancelBtn.style.borderRadius = "12px";
    cancelBtn.style.border = "2px solid #e2e8f0";
    cancelBtn.innerHTML = `<i class="fas fa-times me-2"></i> Batal Edit`;
    cancelBtn.onclick = cancelEditCourse;
    submitBtn.parentNode.appendChild(cancelBtn);
  }
}
window.startEditCourse = startEditCourse;

function cancelEditCourse() {
  editCourseId = null;
  document.getElementById("add-course-form").reset();

  const formTitle = document.querySelector("#courses .card h5");
  if (formTitle) {
    formTitle.innerHTML = `<i class="fas fa-plus-circle me-2"></i> Tambah Kelas Baru`;
  }

  const submitBtn = document.querySelector("#add-course-form button[type='submit']");
  if (submitBtn) {
    submitBtn.innerHTML = `<i class="fas fa-save me-2"></i> Simpan Kelas`;
  }

  const cancelBtn = document.getElementById("cancel-edit-btn");
  if (cancelBtn) cancelBtn.remove();
}
window.cancelEditCourse = cancelEditCourse;

document
  .getElementById("add-course-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const nama_kelas = document.getElementById("course-name").value;
    const mentor = document.getElementById("course-mentor").value;
    const tanggal = document.getElementById("course-date").value;
    
    // Automatically calculate Day Name in Indonesian based on chosen Date!
    const daysArr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const dateObj = new Date(tanggal);
    const hari = daysArr[dateObj.getDay()];

    const timeStart = document.getElementById("course-time-start").value;
    const timeEnd = document.getElementById("course-time-end").value;
    const jam = `${timeStart} - ${timeEnd} WIB`;
    const deskripsi = document.getElementById("course-desc").value;

    const auto_attn = document.getElementById("course-auto-attn").checked ? 1 : 0;
    const attn_late = parseInt(document.getElementById("course-attn-late").value) || 15;
    const auto_task = document.getElementById("course-auto-task").checked ? 1 : 0;
    const task_title = document.getElementById("course-task-title").value || "";
    const task_desc = document.getElementById("course-task-desc").value || "";

    try {
      let url = "/api/courses";
      let method = "POST";

      if (editCourseId) {
        url = `/api/courses/${editCourseId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_kelas, deskripsi, mentor, hari, jam, tanggal, auto_attn, attn_late, auto_task, task_title, task_desc }),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan kelas");
      }

      if (editCourseId) {
        await MPIAlert.success("Update Berhasil", `Kelas "${nama_kelas}" telah sukses diperbarui.`);
        cancelEditCourse();
      } else {
        await MPIAlert.success("Simpan Berhasil", `Kelas "${nama_kelas}" dengan mentor ${mentor} telah sukses ditambahkan.`);
        document.getElementById("add-course-form").reset();
      }

      fetchCourses();
      fetchDashboardData();
    } catch (e) {
      console.error(e);
      await MPIAlert.error("Gagal Menyimpan", "Terjadi kesalahan saat menyimpan kelas ke sistem.");
    }
  });

async function deleteCourse(id) {
  const approved = await MPIAlert.confirm("Hapus Kelas", "Apakah Anda yakin ingin menghapus kelas ini secara permanen?");
  if (!approved) return;
  try {
    const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      throw new Error("Gagal menghapus kelas");
    }
    await MPIAlert.success("Hapus Berhasil", "Kelas telah berhasil dihapus dari sistem.");
    if (editCourseId === id) {
      cancelEditCourse();
    }
    fetchCourses();
    fetchDashboardData();
    loadMentorSchedules(); // Segarkan daftar agenda dasbor
  } catch (e) {
    console.error(e);
    await MPIAlert.error("Gagal Menghapus", "Terjadi kesalahan saat menghapus kelas dari sistem.");
  }
}

async function approveCourse(id) {
  try {
    const res = await fetch(`/api/admin/courses/${id}/approve`, {
      method: "PUT"
    });
    if (!res.ok) {
      throw new Error("Gagal menyetujui kelas");
    }
    await MPIAlert.success("Kelas Disetujui", "Kelas usulan mentor telah berhasil disetujui dan diterbitkan.");
    fetchCourses();
    fetchDashboardData();
    loadMentorSchedules(); // Segarkan daftar agenda dasbor
  } catch (e) {
    console.error("Error approving course:", e);
    await MPIAlert.error("Gagal Menyetujui", "Terjadi kesalahan saat menyetujui kelas.");
  }
}
window.approveCourse = approveCourse;

async function fetchStudents() {
  try {
    const response = await fetch("/api/users");
    const students = await response.json();
    const tbody = document.getElementById("student-table-body");
    tbody.innerHTML = students
      .map(
        (s) => `
      <tr>
        <td class="fw-bold">${s.username}</td>
        <td class="text-muted">${s.nim || "-"}</td>
        <td class="text-muted">${s.angkatan || "-"}</td>
        <td>
          <span class="badge" style="background: var(--primary-gradient);">${s.kelas || "Belum memilih"}</span>
        </td>
        <td class="text-muted">${s.nomerHp || "-"}</td>
        <td class="text-muted"><small>${new Date(s.created_at).toLocaleDateString("id-ID")}</small></td>
      </tr>
    `,
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

document
  .getElementById("upload-material-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const kelas = document.getElementById("material-class").value;
    const title = document.getElementById("material-title").value;
    const file = document.getElementById("material-file").files[0];

    const formData = new FormData();
    formData.append("kelas", kelas);
    formData.append("title", title);
    formData.append("file", file);

    try {
      await fetch("/api/materials", {
        method: "POST",
        body: formData,
      });
      await MPIAlert.success("Unggah Berhasil", "Materi pembelajaran telah sukses didistribusikan ke kelas.");
      document.getElementById("upload-material-form").reset();
    } catch (e) {
      console.error(e);
      await MPIAlert.error("Gagal", "Terjadi kesalahan saat mengunggah materi.");
    }
  });

async function fetchAssignments() {
  try {
    const response = await fetch("/api/assignments");
    const assignments = await response.json();
    const tbody = document.getElementById("assignment-table-body");
    tbody.innerHTML = assignments
      .map(
        (a) => `
      <tr>
        <td class="fw-bold text-dark">${a.username}</td>
        <td><span class="badge" style="background: var(--card-gradient-1);">${a.kelas}</span></td>
        <td class="fw-medium">${a.title}</td>
        <td>
          <a href="/uploads/${a.path}" target="_blank" class="btn btn-sm rounded-pill px-3" style="background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0;">
            <i class="fas fa-cloud-download-alt text-primary me-1"></i> Unduh
          </a>
        </td>
        <td class="text-muted"><small><i class="far fa-clock me-1"></i> ${new Date(a.timestamp).toLocaleString("id-ID")}</small></td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-danger rounded-circle shadow-sm" onclick="deleteAssignment('${a.id}')" style="width: 35px; height: 35px; padding: 0;" title="Hapus Tugas">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `,
      )
      .join("");
  } catch (e) {
    console.error(e);
  }
}

async function deleteAssignment(id) {
  const approved = await MPIAlert.confirm("Hapus Tugas", "Apakah Anda yakin ingin menghapus pengumpulan tugas ini secara permanen dari semua dasbor?");
  if (!approved) return;
  try {
    const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      throw new Error("Gagal menghapus tugas");
    }
    await MPIAlert.success("Tugas Dihapus", "Pengumpulan tugas telah berhasil dihapus secara permanen.");
    fetchAssignments();
    fetchDashboardData();
  } catch (e) {
    console.error(e);
    await MPIAlert.error("Gagal", "Terjadi kesalahan saat menghapus pengumpulan tugas.");
  }
}
window.deleteAssignment = deleteAssignment;

// Gallery Logic
document
  .getElementById("gallery-form")
  ?.addEventListener("submit", function (e) {
    e.preventDefault();
    const fileInput = document.getElementById("gallery-input");
    const file = fileInput.files[0];
    if (file && file.type.startsWith("image/")) {
      const formData = new FormData();
      formData.append("image", file);
      fetch("/api/gallery", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          updateGallery();
          fetchDashboardData();
          document.getElementById("gallery-form").reset();
        })
        .catch((error) => console.error("Error uploading image:", error));
    }
  });

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
            <div class="card border-0 shadow-sm overflow-hidden" style="border-radius: 15px; position: relative;">
                <img src="/api/gallery/${img.id}/image" class="card-img-top" style="height: 200px; object-fit: cover;" alt="Gallery Image">
                <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle shadow" onclick="deleteGalleryImage(${img.id})" style="width: 35px; height: 35px;">
                  <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(imgElement);
      });
    })
    .catch((error) => console.error("Error fetching gallery:", error));
}

async function deleteGalleryImage(id) {
  const approved = await MPIAlert.confirm("Hapus Gambar", "Apakah Anda yakin ingin menghapus foto kegiatan ini?");
  if (!approved) return;
  fetch(`/api/gallery/${id}`, { method: "DELETE" })
    .then((response) => response.json())
    .then((data) => {
      updateGallery();
      fetchDashboardData();
    })
    .catch((error) => console.error("Error deleting image:", error));
}

// News Logic
document
  .getElementById("news-form")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const title = document.getElementById("news-title").value;
    const content = document.getElementById("news-content").value;
    const imageInput = document.getElementById("news-image");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (imageInput.files[0]) {
      formData.append("image", imageInput.files[0]);
    }

    try {
      await fetch("/api/news", {
        method: "POST",
        body: formData,
      });
      document.getElementById("news-form").reset();
      fetchNews();
      fetchDashboardData();
    } catch (e) {
      console.error("Error posting news", e);
    }
  });

async function fetchNews() {
  try {
    const response = await fetch("/api/news");
    const news = await response.json();
    const tbody = document.getElementById("news-table-body");
    if (!tbody) return;

    tbody.innerHTML = news
      .map(
        (n) => `
      <tr>
        <td>
          ${n.image_path ? `<img src="/gallery/${n.image_path}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;">` : `<div class="bg-light text-center rounded" style="width: 60px; height: 40px; line-height: 40px;"><i class="fas fa-image text-muted"></i></div>`}
        </td>
        <td class="fw-bold">${n.title}</td>
        <td class="text-muted">${new Date(n.created_at).toLocaleDateString("id-ID")}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger rounded-circle shadow-sm" onclick="deleteNews(${n.id})" style="width: 35px; height: 35px; padding: 0;">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `,
      )
      .join("");
  } catch (e) {
    console.error("Error fetching news", e);
  }
}

async function deleteNews(id) {
  const approved = await MPIAlert.confirm("Hapus Berita", "Apakah Anda yakin ingin menghapus berita ini secara permanen?");
  if (!approved) return;
  try {
    await fetch(`/api/news/${id}`, { method: "DELETE" });
    fetchNews();
    fetchDashboardData();
  } catch (e) {
    console.error("Error deleting news", e);
  }
}

// Right Sidebar & Simulated Live Chat Features
async function loadOnlineUsers() {
  try {
    const response = await fetch("/api/users");
    const users = await response.json();
    const onlineList = document.getElementById("online-users-list");
    if (!onlineList) return;

    // Filter out admin
    const students = users.filter(u => u.username !== "admin");

    const onlineCountEl = document.getElementById("online-count");
    if (onlineCountEl) onlineCountEl.textContent = students.length;

    if (students.length === 0) {
      onlineList.innerHTML = `
        <div class="text-center text-muted py-4">
          <p class="mb-0 small">Belum ada mahasiswa terdaftar</p>
        </div>
      `;
      return;
    }

    onlineList.innerHTML = students.map(u => {
      const pic = u.profile_pic ? `/uploads/${u.profile_pic}` : "/img/1.png";
      return `
        <div class="online-user-item" onclick="openChat('${u.username}', '${pic}')">
          <div class="d-flex align-items-center gap-2">
            <img src="${pic}" class="online-user-avatar" alt="Avatar">
            <div class="online-user-info">
              <h6>${u.username}</h6>
              <small class="d-block text-truncate" style="max-width: 140px;">${u.kelas || "Belum pilih kelas"}</small>
            </div>
          </div>
          <span class="d-inline-block bg-success rounded-circle" style="width: 8px; height: 8px;"></span>
        </div>
      `;
    }).join("");
  } catch (e) {
    console.error("Error loading online users", e);
  }
}

let activeChatUser = null;

function openChat(username, pic) {
  activeChatUser = username;
  
  let chatWin = document.getElementById("chat-window");
  if (!chatWin) {
    chatWin = document.createElement("div");
    chatWin.id = "chat-window";
    chatWin.className = "chat-window";
    document.body.appendChild(chatWin);
  }

  chatWin.style.display = "flex";
  chatWin.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-user">
        <img src="${pic}" class="rounded-circle" style="width: 32px; height: 32px; object-fit: cover;">
        <div>
          <h6 class="mb-0 fw-bold">${username}</h6>
          <small style="font-size: 0.7rem; opacity: 0.9;">Online</small>
        </div>
      </div>
      <button class="chat-close-btn" onclick="closeChat()"><i class="fas fa-times"></i></button>
    </div>
    <div class="chat-messages" id="chat-messages-container"></div>
    <div class="chat-typing-indicator" id="chat-typing">sedang mengetik...</div>
    <div class="chat-footer">
      <input type="text" class="chat-input" id="chat-input-field" placeholder="Ketik pesan..." onkeydown="handleChatKey(event)">
      <button class="chat-send-btn" onclick="sendChatMessage()"><i class="fas fa-paper-plane"></i></button>
    </div>
  `;

  loadChatMessages(username);
}

function closeChat() {
  const chatWin = document.getElementById("chat-window");
  if (chatWin) chatWin.style.display = "none";
  activeChatUser = null;
}

function loadChatMessages(username) {
  const container = document.getElementById("chat-messages-container");
  if (!container) return;

  const storageKey = `chat_history_${username}`;
  let history = JSON.parse(localStorage.getItem(storageKey)) || [];

  if (history.length === 0) {
    history = [
      { sender: "system", text: `Mulai percakapan dengan ${username}` },
      { sender: "received", text: "Halo pak! Ada yang bisa saya bantu terkait perkuliahan MPI?" }
    ];
    localStorage.setItem(storageKey, JSON.stringify(history));
  }

  container.innerHTML = history.map(msg => {
    if (msg.sender === "system") {
      return `<div class="text-center text-muted small py-1" style="font-size: 0.75rem;">${msg.text}</div>`;
    }
    return `
      <div class="chat-message ${msg.sender}">
        ${msg.text}
      </div>
    `;
  }).join("");

  container.scrollTop = container.scrollHeight;
}

function handleChatKey(event) {
  if (event.key === "Enter") {
    sendChatMessage();
  }
}

function sendChatMessage() {
  const input = document.getElementById("chat-input-field");
  if (!input || !input.value.trim() || !activeChatUser) return;

  const text = input.value.trim();
  input.value = "";

  const storageKey = `chat_history_${activeChatUser}`;
  let history = JSON.parse(localStorage.getItem(storageKey)) || [];

  // Add sent message
  history.push({ sender: "sent", text: text });
  localStorage.setItem(storageKey, JSON.stringify(history));

  loadChatMessages(activeChatUser);

  // Simulated student typing reply after 1.5s
  const typing = document.getElementById("chat-typing");
  if (typing) typing.style.display = "block";

  const container = document.getElementById("chat-messages-container");
  if (container) container.scrollTop = container.scrollHeight;

  const chatUserAtSending = activeChatUser;

  setTimeout(() => {
    if (typing) typing.style.display = "none";
    if (activeChatUser !== chatUserAtSending) return; // guard against user switching chats

    const replies = [
      "Baik pak, terima kasih banyak informasinya.",
      "Saya akan segera menyelesaikan tugas kelas MPI saya pak.",
      "Siap pak, mohon bimbingannya selalu.",
      "Apakah materi hari ini sudah di-upload di LMS pak?",
      "Terima kasih atas masukannya pak, sangat membantu proses belajar saya!",
      "Bagian tugas kelompok itu dikumpul sebelum minggu depan ya pak?"
    ];
    const randomReply = replies[Math.floor(Math.random() * replies.length)];

    let currentHistory = JSON.parse(localStorage.getItem(storageKey)) || [];
    currentHistory.push({ sender: "received", text: randomReply });
    localStorage.setItem(storageKey, JSON.stringify(currentHistory));

    if (activeChatUser === chatUserAtSending) {
      loadChatMessages(chatUserAtSending);
    }
  }, 1500);
}

// Toggle Right Sidebar drawer and morph toggler button state
function toggleRightSidebar() {
  const sidebar = document.querySelector(".right-sidebar");
  const toggler = document.querySelector(".right-sidebar-toggler");
  
  if (sidebar && toggler) {
    sidebar.classList.toggle("show");
    toggler.classList.toggle("active");
    
    // Morph icon elegantly between user icon and close icon
    const icon = toggler.querySelector("i");
    if (icon) {
      if (sidebar.classList.contains("show")) {
        icon.className = "fas fa-times";
      } else {
        icon.className = "fas fa-user";
      }
    }
  }
}

// Live Parameter Rotator (Cycles 5 stats cards in a single card container)
let rotatorIndex = 0;
let rotatorInterval = null;

function initRotator() {
  const slides = document.querySelectorAll(".rotator-slide");
  if (slides.length === 0) return;

  if (rotatorInterval) clearInterval(rotatorInterval);

  rotatorInterval = setInterval(() => {
    rotatorIndex = (rotatorIndex + 1) % slides.length;
    showRotatorSlide(rotatorIndex);
  }, 4000); // Rotate every 4 seconds
}

function showRotatorSlide(index) {
  const slides = document.querySelectorAll(".rotator-slide");
  const dots = document.querySelectorAll(".rotator-indicators .dot");
  if (slides.length === 0) return;

  rotatorIndex = index;
  window.rotatorIndex = index; // Synchronize with global scope

  slides.forEach((slide) => {
    slide.classList.remove("active");
  });
  dots.forEach((dot) => {
    dot.classList.remove("active");
  });

  slides[index].classList.add("active");
  if (dots[index]) dots[index].classList.add("active");
}

function setRotatorSlide(index) {
  showRotatorSlide(index);
  // Reset interval to keep it consistent
  initRotator();
}

function prevSlide() {
  const slides = document.querySelectorAll(".rotator-slide");
  if (slides.length === 0) return;
  const newIndex = (rotatorIndex - 1 + slides.length) % slides.length;
  setRotatorSlide(newIndex);
}

function nextSlide() {
  const slides = document.querySelectorAll(".rotator-slide");
  if (slides.length === 0) return;
  const newIndex = (rotatorIndex + 1) % slides.length;
  setRotatorSlide(newIndex);
}

// Expose rotator actions globally
window.prevSlide = prevSlide;
window.nextSlide = nextSlide;
window.rotatorIndex = rotatorIndex;
window.setRotatorSlide = setRotatorSlide;

// Interactive Premium Calendar Widget
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const monthsIndonesian = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

async function renderCalendar() {
  const monthYearEl = document.getElementById("calendar-month-year");
  const daysContainer = document.getElementById("calendar-days-container");
  if (!monthYearEl || !daysContainer) return;

  monthYearEl.textContent = `${monthsIndonesian[currentMonth]} ${currentYear}`;
  daysContainer.innerHTML = "";

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();

  // Load custom schedules from localStorage
  const localSchedules = JSON.parse(localStorage.getItem("mentor_schedules")) || [];

  // Load actual scheduled courses from SQL database
  let dbCourses = [];
  try {
    const res = await fetch("/api/courses");
    dbCourses = await res.json();
  } catch (err) {
    console.error("Gagal mengambil kelas untuk kalender admin:", err);
  }

  // Empty days from previous month
  for (let x = firstDayIndex; x > 0; x--) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day empty text-muted opacity-25";
    dayDiv.textContent = prevLastDay - x + 1;
    daysContainer.appendChild(dayDiv);
  }

  // Days of current month
  const today = new Date();
  for (let i = 1; i <= lastDay; i++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    dayDiv.textContent = i;

    // Highlight today
    if (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
      dayDiv.classList.add("today");
    }

    // Check if this date has events scheduled (from either localStorage or DB)
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const hasLocalEvent = localSchedules.some(s => s.date === dateStr);
    const hasDbEvent = dbCourses.some(c => c.tanggal === dateStr);

    if (hasLocalEvent || hasDbEvent) {
      dayDiv.classList.add("has-event");
    }

    dayDiv.onclick = () => selectCalendarDate(dateStr, i, dbCourses);

    daysContainer.appendChild(dayDiv);
  }
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
}

// Global exposure for event handlers
window.prevMonth = prevMonth;

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
}

window.nextMonth = nextMonth;

async function selectCalendarDate(dateStr, dayNum, dbCourses) {
  const localSchedules = JSON.parse(localStorage.getItem("mentor_schedules")) || [];
  const dayLocalSchedules = localSchedules.filter(s => s.date === dateStr);
  
  // Filter courses in DB for this date
  const dayDbCourses = (dbCourses || []).filter(c => c.tanggal === dateStr);
  
  let listItems = [];
  
  dayLocalSchedules.forEach(s => {
    listItems.push(`• ${s.time} | ${s.title} (${s.class})`);
  });
  
  dayDbCourses.forEach(c => {
    listItems.push(`• ${c.jam} | Perkuliahan: ${c.nama_kelas} (Mentor: ${c.mentor || 'Belum diatur'})`);
  });
  
  if (listItems.length > 0) {
    await MPIAlert.info(`Agenda - ${dayNum} ${monthsIndonesian[currentMonth]}`, listItems.join("\n"));
  } else {
    await MPIAlert.info(`Agenda - ${dayNum} ${monthsIndonesian[currentMonth]}`, "Tidak ada agenda kelas terdaftar pada tanggal ini.");
  }
}

window.selectCalendarDate = selectCalendarDate;

// Mentor Schedule & Agenda Manager Functions (SQL Database Linked)
async function loadMentorSchedules() {
  const container = document.getElementById("schedule-list-container");
  if (!container) return;

  try {
    const res = await fetch("/api/admin/courses");
    const courses = await res.json();
    
    // Ambil kelas yang memiliki tanggal & jam valid dan disetujui (Approved)
    const schedules = courses.filter(c => {
      if (!c.tanggal || !c.jam || c.status !== 'approved') return false;
      const d = new Date(c.tanggal);
      return !isNaN(d.getTime());
    });

    // Urutkan berdasarkan tanggal terdekat secara kronologis
    schedules.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    if (schedules.length === 0) {
      container.innerHTML = `
        <div class="text-center text-muted py-5">
          <i class="fas fa-calendar-xmark fa-3x mb-3 text-secondary opacity-50"></i>
          <p class="mb-0 fw-medium">Belum ada agenda kelas aktif terjadwal</p>
        </div>
      `;
      // Pemicu rendering ulang kalender agar selaras
      renderCalendar();
      return;
    }

    container.innerHTML = schedules.map(s => {
      const sDate = new Date(s.tanggal);
      const day = sDate.getDate();
      const month = monthsIndonesian[sDate.getMonth()].substring(0, 3);
      
      return `
        <div class="schedule-item">
          <div class="schedule-date-badge">
            <span class="day">${day}</span>
            <span class="month">${month}</span>
          </div>
          <div class="schedule-details" style="flex-grow: 1; cursor: pointer;" onclick="editDashboardSchedule(${s.id})" title="Klik untuk mengedit kelas ini">
            <h6>${s.nama_kelas}</h6>
            <div class="meta">
              <span><i class="fas fa-user-tie text-primary"></i> ${s.mentor || "Belum diatur"}</span>
              <span><i class="far fa-clock text-primary"></i> ${s.jam}</span>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-link text-primary p-0 me-2" onclick="editDashboardSchedule(${s.id})" title="Edit Jadwal Kelas" style="font-size: 1.1rem; border: none; background: transparent; transition: all 0.2s;">
              <i class="fas fa-edit"></i>
            </button>
            <button class="schedule-delete-btn" onclick="deleteCourse(${s.id})" title="Hapus Kelas">
              <i class="fas fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    }).join("");

    // Re-render calendar so that event dots are updated!
    renderCalendar();

  } catch (err) {
    console.error("Gagal memuat jadwal kelas di dasbor:", err);
    container.innerHTML = `
      <div class="text-center text-danger py-4">
        Gagal memuat agenda kelas dari database.
      </div>
    `;
  }
}

function editDashboardSchedule(id) {
  // Pindahkan seksi aktif ke manajemen kelas di sidebar
  const navLink = document.querySelector('.nav-link[onclick*="courses"]');
  showAdminSection('courses', navLink);
  
  // Pemicu edit kelas utama (scroll & populasi form otomatis)
  startEditCourse(id);
}

window.editDashboardSchedule = editDashboardSchedule;

window.loadMentorSchedules = loadMentorSchedules;

function showAddScheduleModal() {
  const modal = new bootstrap.Modal(document.getElementById("scheduleModal"));
  modal.show();
}

window.showAddScheduleModal = showAddScheduleModal;

async function saveNewSchedule(event) {
  event.preventDefault();
  
  const nama_kelas = document.getElementById("sched-course-name").value;
  const mentor = document.getElementById("sched-course-mentor").value;
  const tanggal = document.getElementById("sched-course-date").value;
  
  // Hitung Hari Otomatis dalam Bahasa Indonesia
  const daysArr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dateObj = new Date(tanggal);
  const hari = daysArr[dateObj.getDay()];

  const timeStart = document.getElementById("sched-course-time-start").value;
  const timeEnd = document.getElementById("sched-course-time-end").value;
  const jam = `${timeStart} - ${timeEnd} WIB`;
  const deskripsi = document.getElementById("sched-course-desc").value;

  const btnSubmit = document.querySelector("#add-schedule-form button[type='submit']");
  const origText = btnSubmit.innerHTML;
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i> Menyimpan...`;

  try {
    const response = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama_kelas, deskripsi, mentor, hari, jam, tanggal }),
    });

    if (!response.ok) {
      throw new Error("Gagal menyimpan jadwal kelas baru");
    }

    await MPIAlert.success("Jadwal Tersimpan", `Jadwal kelas "${nama_kelas}" dengan mentor ${mentor} telah sukses ditambahkan.`);
    
    // Reset Form & Tutup Modal
    document.getElementById("add-schedule-form").reset();
    const modalEl = document.getElementById("scheduleModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    // Segarkan Data Dasbor Secara Real-time
    loadMentorSchedules();
    fetchCourses();
    fetchDashboardData();

  } catch (err) {
    console.error(err);
    await MPIAlert.error("Gagal Menyimpan", "Terjadi kesalahan saat menyimpan jadwal kelas ke database.");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = origText;
  }
}

window.saveNewSchedule = saveNewSchedule;
window.setRotatorSlide = setRotatorSlide;
