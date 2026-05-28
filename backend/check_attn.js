require("dotenv").config();
const mysql = require("mysql2/promise");

async function checkAttn() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "Lab_MPI",
  });

  try {
    const [sessions] = await pool.query("SHOW TABLES LIKE 'attendance_sessions'");
    console.log("attendance_sessions table exists:", sessions.length > 0);

    const [records] = await pool.query("SHOW TABLES LIKE 'attendance_records'");
    console.log("attendance_records table exists:", records.length > 0);

  } catch (err) {
    console.error("Check failed:", err);
  } finally {
    await pool.end();
  }
}

checkAttn();
