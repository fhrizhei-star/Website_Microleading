require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3001;

// Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "Lab_MPI",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Auto-initialize tables if they don't exist
async function initDB() {
  try {
    const connection = await pool.getConnection();

    // Create classes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id VARCHAR(50) PRIMARY KEY,
        nama VARCHAR(255),
        email VARCHAR(255),
        minatKelas VARCHAR(255),
        nomerHp VARCHAR(50),
        timestamp VARCHAR(255)
      )
    `);

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add new columns for detailed registration & role
    const addColumn = async (columnDef) => {
      try {
        await connection.query(`ALTER TABLE users ADD COLUMN ${columnDef}`);
      } catch (e) {
        // Ignore errors if column already exists
      }
    };

    await addColumn("nim VARCHAR(50)");
    await addColumn("angkatan VARCHAR(50)");
    await addColumn("kelas VARCHAR(100)");
    await addColumn("nomerHp VARCHAR(50)");
    await addColumn("role VARCHAR(20) DEFAULT 'user'");
    await addColumn("profile_pic VARCHAR(255)");

    // Update existing admin if role is missing, or create if not exists
    try {
      const [adminExists] = await connection.query("SELECT * FROM users WHERE username = 'admin'");
      if (adminExists.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        await connection.query(
          "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
          ['admin', hashedPassword, 'admin']
        );
      } else {
        await connection.query("UPDATE users SET role = 'admin' WHERE username = 'admin'");
      }
    } catch(e) {
      console.error("Error creating/updating admin:", e);
    }

    // Create course_list table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS course_list (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_kelas VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add columns for mentor, hari, jam in course_list
    const addCourseColumn = async (columnDef) => {
      try {
        await connection.query(`ALTER TABLE course_list ADD COLUMN ${columnDef}`);
      } catch (e) {
        // Ignore if exists
      }
    };
    await addCourseColumn("mentor VARCHAR(255)");
    await addCourseColumn("hari VARCHAR(50)");
    await addCourseColumn("jam VARCHAR(100)");
    await addCourseColumn("status VARCHAR(50) DEFAULT 'approved'");
    await addCourseColumn("tanggal VARCHAR(100)");
    await addCourseColumn("auto_attn TINYINT DEFAULT 1");
    await addCourseColumn("attn_late INT DEFAULT 15");
    await addCourseColumn("auto_task TINYINT DEFAULT 1");
    await addCourseColumn("task_title VARCHAR(255)");
    await addCourseColumn("task_desc TEXT");

    // Insert default courses if empty
    const [courses] = await connection.query("SELECT * FROM course_list");
    if (courses.length === 0) {
      const defaultCourses = [
        "Naskah dan Publikasi Karya Tulis Ilmiah",
        "Public Speaking",
        "Leadership & Entrepreneurship",
        "Baca Tulis Al-Qur'an",
        "Informasi & Teknologi"
      ];
      for (const course of defaultCourses) {
        await connection.query("INSERT INTO course_list (nama_kelas) VALUES (?)", [course]);
      }
    }

    // Create materials table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id VARCHAR(50) PRIMARY KEY,
        kelas VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        filename VARCHAR(255),
        path VARCHAR(255),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create assignments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        kelas VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        filename VARCHAR(255),
        path VARCHAR(255),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add columns for grades and feedback in assignments table
    const addAssignmentColumn = async (columnDef) => {
      try {
        await connection.query(`ALTER TABLE assignments ADD COLUMN ${columnDef}`);
      } catch (e) {
        // Ignore if exists
      }
    };
    await addAssignmentColumn("grade VARCHAR(50)");
    await addAssignmentColumn("feedback TEXT");
    await addAssignmentColumn("task_id VARCHAR(50)");

    // Create class_tasks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS class_tasks (
        id VARCHAR(50) PRIMARY KEY,
        kelas VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        deadline VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);


    // Create files table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS files (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        filename VARCHAR(255),
        type VARCHAR(100),
        size INT,
        path VARCHAR(255),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create gallery table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        filename VARCHAR(255),
        type VARCHAR(100),
        size INT,
        path VARCHAR(255),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create attendance_sessions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id VARCHAR(50) PRIMARY KEY,
        kelas VARCHAR(255) NOT NULL,
        tanggal VARCHAR(50) NOT NULL,
        waktu_mulai VARCHAR(50) NOT NULL,
        waktu_selesai VARCHAR(50) NOT NULL,
        batas_terlambat INT DEFAULT 15,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create attendance_records table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id VARCHAR(50) PRIMARY KEY,
        session_id VARCHAR(50) NOT NULL,
        username VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        keterangan TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create news table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image_path VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Database connected and tables verified.");
    connection.release();
  } catch (error) {
    console.error("Error initializing database tables:", error);
  }
}

initDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve login.html on the root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../login.html"));
});

app.use(express.static(path.join(__dirname, "../"))); // Serve static files from root
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/gallery", express.static(path.join(__dirname, "gallery")));

// Multer disk storage for files
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const uploadFile = multer({ storage: fileStorage });

// Multer disk storage for gallery
const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "gallery"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const uploadGallery = multer({ storage: galleryStorage });

// Helper functions for MySQL
async function getFiles() {
  const [rows] = await pool.query(
    "SELECT * FROM files ORDER BY timestamp DESC",
  );
  return rows;
}

async function addFile(fileData) {
  const id = Date.now().toString();
  await pool.query(
    "INSERT INTO files (id, name, filename, type, size, path) VALUES (?, ?, ?, ?, ?, ?)",
    [
      id,
      fileData.name,
      fileData.filename,
      fileData.type,
      fileData.size,
      fileData.path,
    ],
  );
  return id;
}

async function deleteFile(id) {
  await pool.query("DELETE FROM files WHERE id = ?", [id]);
}

async function autoCreateAttendanceAndTask(course) {
  try {
    const { nama_kelas, tanggal, jam, auto_attn, attn_late, auto_task, task_title, task_desc } = course;
    if (!nama_kelas || !tanggal || !jam) return;

    // Parse start and end times from jam (e.g. "08:00 - 10:30 WIB")
    const timeMatch = jam.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    const startHM = timeMatch ? timeMatch[1] : "08:00";
    const endHM = timeMatch ? timeMatch[2] : "10:00";

    // 1. Create Attendance Session automatically if auto_attn is active
    if (auto_attn === 1 || auto_attn === true || auto_attn === '1' || auto_attn === 'true') {
      const sessionId = Date.now().toString() + "_auto";
      
      // Check if session for this class and date already exists
      const [existingAttn] = await pool.query(
        "SELECT * FROM attendance_sessions WHERE kelas = ? AND tanggal = ?",
        [nama_kelas, tanggal]
      );
      if (existingAttn.length === 0) {
        await pool.query(
          "INSERT INTO attendance_sessions (id, kelas, tanggal, waktu_mulai, waktu_selesai, batas_terlambat) VALUES (?, ?, ?, ?, ?, ?)",
          [sessionId, nama_kelas, tanggal, startHM, endHM, attn_late || 15]
        );
        console.log(`Auto-created attendance session for class: ${nama_kelas} on ${tanggal}`);
      }
    }

    // 2. Create Class Task automatically if auto_task is active
    if (auto_task === 1 || auto_task === true || auto_task === '1' || auto_task === 'true') {
      const taskId = Date.now().toString() + "_auto";
      const finalTitle = task_title || `Tugas Utama Pertemuan - ${nama_kelas}`;
      const finalDesc = task_desc || `Silakan kumpulkan tugas atau laporan hasil pembelajaran Anda untuk pertemuan hari ini di sini.`;
      
      // Deadline default to end of day of the class: YYYY-MM-DD 23:59
      const finalDeadline = `${tanggal} 23:59`;

      // Check if task with this title for this class already exists
      const [existingTask] = await pool.query(
        "SELECT * FROM class_tasks WHERE kelas = ? AND title = ?",
        [nama_kelas, finalTitle]
      );
      if (existingTask.length === 0) {
        await pool.query(
          "INSERT INTO class_tasks (id, kelas, title, description, deadline) VALUES (?, ?, ?, ?, ?)",
          [taskId, nama_kelas, finalTitle, finalDesc, finalDeadline]
        );
        console.log(`Auto-created class task for class: ${nama_kelas}`);
      }
    }
  } catch (error) {
    console.error("Error in autoCreateAttendanceAndTask:", error);
  }
}

async function getGallery() {
  const [rows] = await pool.query(
    "SELECT * FROM gallery ORDER BY timestamp DESC",
  );
  return rows;
}

async function addGallery(imageData) {
  const id = Date.now().toString();
  await pool.query(
    "INSERT INTO gallery (id, name, filename, type, size, path) VALUES (?, ?, ?, ?, ?, ?)",
    [
      id,
      imageData.name,
      imageData.filename,
      imageData.type,
      imageData.size,
      imageData.path,
    ],
  );
  return id;
}

async function deleteGallery(id) {
  await pool.query("DELETE FROM gallery WHERE id = ?", [id]);
}

async function getClasses() {
  const [rows] = await pool.query("SELECT * FROM classes");
  return rows;
}

async function addClass(classData) {
  const id = Date.now().toString();
  const timestamp = classData.timestamp || new Date().toISOString();
  await pool.query(
    "INSERT INTO classes (id, nama, email, minatKelas, nomerHp, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    [
      id,
      classData.nama,
      classData.email,
      classData.minatKelas,
      classData.nomerHp,
      timestamp,
    ],
  );
  return id;
}

// Authentication Routes
app.post("/api/register", async (req, res) => {
  try {
    const { username, password, nim, angkatan, kelas, nomerHp, adminSecret, mentorSecret, role: reqRole } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    // Check if user already exists
    const [existing] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine role
    let role = 'user';
    if (reqRole === 'admin') {
      if (adminSecret !== 'ADMIN_SECRET_2026') {
        return res.status(400).json({ error: "Kode Rahasia Admin salah!" });
      }
      role = 'admin';
    } else if (reqRole === 'mentor') {
      if (mentorSecret !== 'MENTOR_SECRET_2026') {
        return res.status(400).json({ error: "Kode Rahasia Mentor salah!" });
      }
      role = 'mentor';
    } else {
      // Legacy check or default
      if (adminSecret && adminSecret === 'ADMIN_SECRET_2026') {
        role = 'admin';
      }
    }

    // Insert user
    await pool.query(
      "INSERT INTO users (username, password, nim, angkatan, kelas, nomerHp, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [username, hashedPassword, nim || null, angkatan || null, kelas || null, nomerHp || null, role]
    );

    res.json({ message: "User registered successfully", role });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    // Find user
    const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = users[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Login successful
    res.json({
      message: "Login successful",
      user: { id: user.id, username: user.username, kelas: user.kelas, role: user.role, profile_pic: user.profile_pic },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// File routes
app.post("/api/files", uploadFile.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  try {
    const fileData = {
      name: req.file.originalname,
      filename: req.file.filename,
      type: req.file.mimetype,
      size: req.file.size,
      path: req.file.filename,
    };
    const id = await addFile(fileData);
    res.json({
      message: "File uploaded successfully",
      file: { id, ...fileData },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

app.get("/api/files", async (req, res) => {
  try {
    const files = await getFiles();
    res.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

app.get("/api/files/:id/download", async (req, res) => {
  try {
    const files = await getFiles();
    const file = files.find((f) => f.id == req.params.id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    res.download(path.join(__dirname, "uploads", file.path), file.name);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
});

app.delete("/api/files/:id", async (req, res) => {
  try {
    const files = await getFiles();
    const file = files.find((f) => f.id == req.params.id);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    fs.unlinkSync(path.join(__dirname, "uploads", file.path));
    await deleteFile(req.params.id);
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// Admin & LMS Routes

// Logika Pembersihan Otomatis Kelas Kadaluwarsa (Dinonaktifkan agar data kelas tidak hilang)
async function cleanupExpiredCourses() {
  // Pembersihan otomatis dinonaktifkan demi keutuhan data tugas mahasiswa dan rekam jejak penilaian kelas.
  return;
}

// 1. Course List (for Register dropdown and Admin)
app.get("/api/courses", async (req, res) => {
  try {
    await cleanupExpiredCourses();
    const [courses] = await pool.query("SELECT * FROM course_list WHERE status = 'approved' ORDER BY nama_kelas ASC");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

app.get("/api/admin/courses", async (req, res) => {
  try {
    await cleanupExpiredCourses();
    const [courses] = await pool.query("SELECT * FROM course_list ORDER BY status DESC, nama_kelas ASC");
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admin courses" });
  }
});

app.put("/api/admin/courses/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE course_list SET status = 'approved' WHERE id = ?", [id]);
    
    // Auto-synchronize mentor's class in users table and trigger auto generation!
    const [courses] = await pool.query("SELECT * FROM course_list WHERE id = ?", [id]);
    if (courses.length > 0) {
      const course = courses[0];
      if (course.mentor) {
        await pool.query("UPDATE users SET kelas = ? WHERE username = ? AND role = 'mentor'", [course.nama_kelas, course.mentor]);
      }
      await autoCreateAttendanceAndTask(course);
    }

    res.json({ message: "Course approved successfully" });
  } catch (error) {
    console.error("Error approving course:", error);
    res.status(500).json({ error: "Failed to approve course" });
  }
});

app.post("/api/mentor/courses", async (req, res) => {
  try {
    const { nama_kelas, deskripsi, mentor, hari, jam, tanggal, auto_attn, attn_late, auto_task, task_title, task_desc } = req.body;
    await pool.query(
      "INSERT INTO course_list (nama_kelas, deskripsi, mentor, hari, jam, tanggal, auto_attn, attn_late, auto_task, task_title, task_desc, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')",
      [
        nama_kelas,
        deskripsi,
        mentor,
        hari,
        jam,
        tanggal || null,
        auto_attn !== undefined ? (auto_attn === true || auto_attn === 1 || auto_attn === 'true' || auto_attn === '1' ? 1 : 0) : 1,
        attn_late !== undefined ? parseInt(attn_late) : 15,
        auto_task !== undefined ? (auto_task === true || auto_task === 1 || auto_task === 'true' || auto_task === '1' ? 1 : 0) : 1,
        task_title || null,
        task_desc || null
      ]
    );
    res.json({ message: "Course proposed successfully" });
  } catch (error) {
    console.error("Error proposing course:", error);
    res.status(500).json({ error: "Failed to propose course" });
  }
});

app.get("/api/mentor/courses", async (req, res) => {
  try {
    const { mentor } = req.query;
    if (!mentor) {
      return res.status(400).json({ error: "Mentor is required" });
    }
    const [courses] = await pool.query(
      "SELECT * FROM course_list WHERE mentor = ? ORDER BY created_at DESC",
      [mentor]
    );
    res.json(courses);
  } catch (error) {
    console.error("Error fetching mentor proposed courses:", error);
    res.status(500).json({ error: "Failed to fetch proposed courses" });
  }
});

app.post("/api/courses", async (req, res) => {
  try {
    const { nama_kelas, deskripsi, mentor, hari, jam, tanggal, auto_attn, attn_late, auto_task, task_title, task_desc } = req.body;
    
    const parsedAutoAttn = auto_attn !== undefined ? (auto_attn === true || auto_attn === 1 || auto_attn === 'true' || auto_attn === '1' ? 1 : 0) : 1;
    const parsedAttnLate = attn_late !== undefined ? parseInt(attn_late) : 15;
    const parsedAutoTask = auto_task !== undefined ? (auto_task === true || auto_task === 1 || auto_task === 'true' || auto_task === '1' ? 1 : 0) : 1;

    await pool.query(
      "INSERT INTO course_list (nama_kelas, deskripsi, mentor, hari, jam, tanggal, auto_attn, attn_late, auto_task, task_title, task_desc, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')",
      [
        nama_kelas,
        deskripsi,
        mentor || null,
        hari || null,
        jam || null,
        tanggal || null,
        parsedAutoAttn,
        parsedAttnLate,
        parsedAutoTask,
        task_title || null,
        task_desc || null
      ]
    );

    // Auto-synchronize mentor's class in users table!
    if (mentor) {
      await pool.query("UPDATE users SET kelas = ? WHERE username = ? AND role = 'mentor'", [nama_kelas, mentor]);
    }

    // Automatically generate attendance and class tasks
    await autoCreateAttendanceAndTask({
      nama_kelas,
      tanggal,
      jam,
      auto_attn: parsedAutoAttn,
      attn_late: parsedAttnLate,
      auto_task: parsedAutoTask,
      task_title,
      task_desc
    });

    res.json({ message: "Course added successfully" });
  } catch (error) {
    console.error("Error adding course:", error);
    res.status(500).json({ error: "Failed to add course" });
  }
});

app.put("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kelas, deskripsi, mentor, hari, jam, tanggal } = req.body;
    await pool.query(
      "UPDATE course_list SET nama_kelas = ?, deskripsi = ?, mentor = ?, hari = ?, jam = ?, tanggal = ? WHERE id = ?",
      [nama_kelas, deskripsi, mentor || null, hari || null, jam || null, tanggal || null, id]
    );

    // Auto-synchronize mentor's class in users table!
    if (mentor) {
      await pool.query("UPDATE users SET kelas = ? WHERE username = ? AND role = 'mentor'", [nama_kelas, mentor]);
    }

    res.json({ message: "Course updated successfully" });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
});

app.delete("/api/courses/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM course_list WHERE id = ?", [req.params.id]);
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete course" });
  }
});

// 2. Users (for Admin & Enrollment & Settings)
app.get("/api/users", async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id, username, nim, angkatan, kelas, nomerHp, role, profile_pic, created_at FROM users WHERE role = 'user' ORDER BY created_at DESC");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/api/mentors", async (req, res) => {
  try {
    const [mentors] = await pool.query("SELECT username FROM users WHERE role = 'mentor' ORDER BY username ASC");
    res.json(mentors);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch mentors" });
  }
});

app.get("/api/users/:username", async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id, username, nim, angkatan, kelas, nomerHp, role, profile_pic FROM users WHERE username = ?", [req.params.username]);
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.put("/api/users/:username", uploadFile.single("profile_pic"), async (req, res) => {
  try {
    console.log("UPDATE USER REQUEST BODY:", req.body);
    const { nim, angkatan, nomerHp, password } = req.body;
    const username = req.params.username;
    const profile_pic = req.file ? req.file.filename : null;
    
    let query = "UPDATE users SET nim = ?, angkatan = ?, nomerHp = ? WHERE username = ?";
    let params = [nim || null, angkatan || null, nomerHp || null, username];

    if (profile_pic) {
      query = "UPDATE users SET nim = ?, angkatan = ?, nomerHp = ?, profile_pic = ? WHERE username = ?";
      params = [nim || null, angkatan || null, nomerHp || null, profile_pic, username];
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      if (profile_pic) {
        query = "UPDATE users SET nim = ?, angkatan = ?, nomerHp = ?, password = ?, profile_pic = ? WHERE username = ?";
        params = [nim || null, angkatan || null, nomerHp || null, hashedPassword, profile_pic, username];
      } else {
        query = "UPDATE users SET nim = ?, angkatan = ?, nomerHp = ?, password = ? WHERE username = ?";
        params = [nim || null, angkatan || null, nomerHp || null, hashedPassword, username];
      }
    }

    await pool.query(query, params);
    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.post("/api/enroll", async (req, res) => {
  try {
    const { username, kelas } = req.body;
    if (!username || !kelas) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    await pool.query("UPDATE users SET kelas = ? WHERE username = ?", [kelas, username]);
    res.json({ message: "Successfully enrolled in class" });
  } catch (error) {
    console.error("Error enrolling class:", error);
    res.status(500).json({ error: "Failed to enroll" });
  }
});

// 3. Materials (for Admin to upload, Users to view)
app.get("/api/materials/:kelas", async (req, res) => {
  try {
    const [materials] = await pool.query("SELECT * FROM materials WHERE kelas = ? ORDER BY timestamp DESC", [req.params.kelas]);
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});

app.post("/api/materials", uploadFile.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const { kelas, title } = req.body;
    const id = Date.now().toString();
    await pool.query(
      "INSERT INTO materials (id, kelas, title, filename, path) VALUES (?, ?, ?, ?, ?)",
      [id, kelas, title, req.file.originalname, req.file.filename]
    );
    res.json({ message: "Material uploaded successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload material" });
  }
});

// 4. Assignments (for Users to upload, Admin to view)
app.get("/api/assignments", async (req, res) => {
  try {
    const [assignments] = await pool.query("SELECT * FROM assignments ORDER BY timestamp DESC");
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

app.post("/api/assignments", uploadFile.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const { username, kelas, title, task_id } = req.body;
    const id = Date.now().toString();
    await pool.query(
      "INSERT INTO assignments (id, username, kelas, title, filename, path, task_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, username, kelas, title, req.file.originalname, req.file.filename, task_id || null]
    );
    res.json({ message: "Assignment submitted successfully" });
  } catch (error) {
    console.error("Error submitting assignment:", error);
    res.status(500).json({ error: "Failed to submit assignment" });
  }
});

app.delete("/api/assignments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Find assignment to get file path
    const [assignments] = await pool.query("SELECT path FROM assignments WHERE id = ?", [id]);
    if (assignments.length > 0 && assignments[0].path) {
      const filePath = path.join(__dirname, "uploads", assignments[0].path);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error("Failed to delete assignment file:", err);
      }
    }
    // Delete from DB
    await pool.query("DELETE FROM assignments WHERE id = ?", [id]);
    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

// 4.0 Class Tasks / Assignments Created by Mentor (with deadlines)
app.get("/api/class_tasks/:kelas", async (req, res) => {
  try {
    const [tasks] = await pool.query(
      "SELECT * FROM class_tasks WHERE kelas = ? ORDER BY created_at DESC",
      [req.params.kelas]
    );
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching class tasks:", error);
    res.status(500).json({ error: "Failed to fetch class tasks" });
  }
});

app.post("/api/class_tasks", async (req, res) => {
  try {
    const { kelas, title, description, deadline } = req.body;
    if (!kelas || !title) {
      return res.status(400).json({ error: "Kelas and Title are required" });
    }
    const id = Date.now().toString();
    await pool.query(
      "INSERT INTO class_tasks (id, kelas, title, description, deadline) VALUES (?, ?, ?, ?, ?)",
      [id, kelas, title, description || null, deadline || null]
    );
    res.json({ message: "Task created successfully", id });
  } catch (error) {
    console.error("Error creating class task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.delete("/api/class_tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM class_tasks WHERE id = ?", [id]);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting class task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// ================= ATTENDANCE SYSTEM ROUTES =================

app.post("/api/attendance/session", async (req, res) => {
  try {
    const { kelas, tanggal, waktu_mulai, waktu_selesai, batas_terlambat } = req.body;
    if (!kelas || !tanggal || !waktu_mulai || !waktu_selesai) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const id = Date.now().toString();
    await pool.query(
      "INSERT INTO attendance_sessions (id, kelas, tanggal, waktu_mulai, waktu_selesai, batas_terlambat) VALUES (?, ?, ?, ?, ?, ?)",
      [id, kelas, tanggal, waktu_mulai, waktu_selesai, batas_terlambat || 15]
    );
    res.json({ message: "Attendance session configured successfully", id });
  } catch (error) {
    console.error("Error creating attendance session:", error);
    res.status(500).json({ error: "Failed to configure attendance session" });
  }
});

app.get("/api/attendance/session/active", async (req, res) => {
  try {
    const { kelas } = req.query;
    if (!kelas) {
      return res.status(400).json({ error: "Kelas is required" });
    }
    // Find active session for today
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    
    const [sessions] = await pool.query(
      "SELECT * FROM attendance_sessions WHERE kelas = ? AND tanggal = ? ORDER BY created_at DESC LIMIT 1",
      [kelas, todayStr]
    );

    if (sessions.length === 0) {
      return res.json({ active: false });
    }

    const session = sessions[0];
    const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (currentHM >= session.waktu_mulai && currentHM <= session.waktu_selesai) {
      res.json({ active: true, session });
    } else {
      res.json({ active: false });
    }
  } catch (error) {
    console.error("Error getting active attendance session:", error);
    res.status(500).json({ active: false, error: "Failed to get active session" });
  }
});

app.post("/api/attendance/submit", async (req, res) => {
  try {
    const { session_id, username, status, keterangan } = req.body;
    if (!session_id || !username || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if already checked in
    const [existing] = await pool.query(
      "SELECT * FROM attendance_records WHERE session_id = ? AND username = ?",
      [session_id, username]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Anda sudah melakukan absensi untuk sesi ini!" });
    }

    const id = Date.now().toString();
    await pool.query(
      "INSERT INTO attendance_records (id, session_id, username, status, keterangan) VALUES (?, ?, ?, ?, ?)",
      [id, session_id, username, status, keterangan || null]
    );
    res.json({ message: "Absensi berhasil disimpan!" });
  } catch (error) {
    console.error("Error submitting attendance:", error);
    res.status(500).json({ error: "Gagal memproses absensi" });
  }
});

app.get("/api/attendance/records", async (req, res) => {
  try {
    const { session_id, kelas } = req.query;
    if (session_id) {
      const [records] = await pool.query(
        "SELECT * FROM attendance_records WHERE session_id = ? ORDER BY timestamp DESC",
        [session_id]
      );
      return res.json(records);
    } else if (kelas) {
      // Get all records in this class grouped or joined with session dates
      const [records] = await pool.query(
        `SELECT r.*, s.tanggal, s.waktu_mulai 
         FROM attendance_records r 
         JOIN attendance_sessions s ON r.session_id = s.id 
         WHERE s.kelas = ? 
         ORDER BY s.tanggal DESC, r.timestamp DESC`,
        [kelas]
      );
      return res.json(records);
    }
    res.status(400).json({ error: "Session ID or Kelas required" });
  } catch (error) {
    console.error("Error getting attendance records:", error);
    res.status(500).json({ error: "Failed to get records" });
  }
});

app.get("/api/attendance/student/history", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }
    const [records] = await pool.query(
      `SELECT r.*, s.tanggal, s.waktu_mulai, s.waktu_selesai 
       FROM attendance_records r 
       JOIN attendance_sessions s ON r.session_id = s.id 
       WHERE r.username = ? 
       ORDER BY s.tanggal DESC`,
      [username]
    );
    res.json(records);
  } catch (error) {
    console.error("Error fetching student attendance history:", error);
    res.status(500).json({ error: "Failed to fetch attendance history" });
  }
});

// 4.1 Mentor Specific Routes (for Mentor Dashboard)
app.get("/api/mentor/assignments", async (req, res) => {
  try {
    const { kelas } = req.query;
    if (!kelas) {
      return res.status(400).json({ error: "Kelas is required" });
    }
    const [assignments] = await pool.query(
      "SELECT * FROM assignments WHERE kelas = ? ORDER BY timestamp DESC",
      [kelas]
    );
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching mentor assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

app.put("/api/mentor/assignments/:id/grade", async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;
    await pool.query(
      "UPDATE assignments SET grade = ?, feedback = ? WHERE id = ?",
      [grade, feedback, id]
    );
    res.json({ message: "Assignment graded successfully" });
  } catch (error) {
    console.error("Error grading assignment:", error);
    res.status(500).json({ error: "Failed to grade assignment" });
  }
});

app.get("/api/mentor/stats", async (req, res) => {
  try {
    const { kelas } = req.query;
    if (!kelas) {
      return res.status(400).json({ error: "Kelas is required" });
    }
    
    const [[studentCount]] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE kelas = ? AND role = 'user'",
      [kelas]
    );
    
    const [[assignmentCount]] = await pool.query(
      "SELECT COUNT(*) as count FROM assignments WHERE kelas = ?",
      [kelas]
    );
    
    const [[gradedCount]] = await pool.query(
      "SELECT COUNT(*) as count FROM assignments WHERE kelas = ? AND grade IS NOT NULL",
      [kelas]
    );

    res.json({
      students: studentCount.count || 0,
      assignments: assignmentCount.count || 0,
      graded: gradedCount.count || 0
    });
  } catch (error) {
    console.error("Error fetching mentor stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});


// Gallery routes
app.post("/api/gallery", uploadGallery.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }
  try {
    const imageData = {
      name: req.file.originalname,
      filename: req.file.filename,
      type: req.file.mimetype,
      size: req.file.size,
      path: req.file.filename,
    };
    const id = await addGallery(imageData);
    res.json({
      message: "Image uploaded successfully",
      image: { id, ...imageData },
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

app.get("/api/gallery", async (req, res) => {
  try {
    const images = await getGallery();
    res.json(images);
  } catch (error) {
    console.error("Error fetching gallery:", error);
    res.status(500).json({ error: "Failed to fetch gallery" });
  }
});

app.get("/api/gallery/:id/image", async (req, res) => {
  try {
    const images = await getGallery();
    const image = images.find((i) => i.id == req.params.id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }
    res.sendFile(path.join(__dirname, "gallery", image.path));
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

app.delete("/api/gallery/:id", async (req, res) => {
  try {
    const images = await getGallery();
    const image = images.find((i) => i.id == req.params.id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }
    fs.unlinkSync(path.join(__dirname, "gallery", image.path));
    await deleteGallery(req.params.id);
    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

// Class routes
app.post("/api/classes", async (req, res) => {
  try {
    const classData = req.body;
    const id = await addClass(classData);
    res.json({
      message: "Class registration submitted successfully",
      registration: { id, ...classData },
    });
  } catch (error) {
    console.error("Error submitting class registration:", error);
    res.status(500).json({ error: "Failed to submit registration" });
  }
});

app.get("/api/classes", async (req, res) => {
  try {
    const classes = await getClasses();
    res.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});

// News Routes
app.get("/api/news", async (req, res) => {
  try {
    const [news] = await pool.query("SELECT * FROM news ORDER BY created_at DESC");
    res.json(news);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

app.post("/api/news", uploadGallery.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;
    const imagePath = req.file ? req.file.filename : null;
    
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    await pool.query(
      "INSERT INTO news (title, content, image_path) VALUES (?, ?, ?)",
      [title, content, imagePath]
    );
    res.json({ message: "News created successfully" });
  } catch (error) {
    console.error("Error creating news:", error);
    res.status(500).json({ error: "Failed to create news" });
  }
});

app.delete("/api/news/:id", async (req, res) => {
  try {
    const [news] = await pool.query("SELECT image_path FROM news WHERE id = ?", [req.params.id]);
    if (news.length > 0 && news[0].image_path) {
      try {
        fs.unlinkSync(path.join(__dirname, "gallery", news[0].image_path));
      } catch (e) {
        console.error("Could not delete image file", e);
      }
    }
    await pool.query("DELETE FROM news WHERE id = ?", [req.params.id]);
    res.json({ message: "News deleted successfully" });
  } catch (error) {
    console.error("Error deleting news:", error);
    res.status(500).json({ error: "Failed to delete news" });
  }
});

// Start background periodic check for expired courses every 1 minute
setInterval(cleanupExpiredCourses, 60000);
// Run once shortly after startup
setTimeout(cleanupExpiredCourses, 5000);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
