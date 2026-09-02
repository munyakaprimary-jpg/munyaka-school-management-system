// LAN School Management System - Express Backend Server
// Pure JavaScript implementation using sql.js (no native compilation required)
// Run with: node server/index.js
// First install: cd server && npm install

import express from 'express';
import initSqlJs from 'sql.js';
import cors from 'cors';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'data', 'school.db');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ============================================
// SQLite Database Setup using sql.js
// ============================================

let db = null;
let SQL = null;

/**
 * Load or initialize the SQL.js database
 */
const loadDatabase = async () => {
  SQL = await initSqlJs();

  // Try to load existing database
  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      console.log('✓ Loaded existing database');
    } catch (err) {
      console.warn('Could not load existing database, creating new one:', err.message);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('✓ Created new database');
  }
};

/**
 * Save database to disk
 */
const saveDatabase = () => {
  try {
    if (db) {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    }
  } catch (err) {
    console.error('Failed to save database:', err.message);
  }
};

/**
 * Execute a SELECT query and return all rows as objects
 */
const dbAll = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (err) {
    console.error('dbAll error:', err.message, '\nSQL:', sql);
    return [];
  }
};

/**
 * Execute a SELECT query and return first row
 */
const dbGet = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  } catch (err) {
    console.error('dbGet error:', err.message, '\nSQL:', sql);
    return null;
  }
};

/**
 * Execute an INSERT/UPDATE/DELETE query
 * Returns { lastInsertRowid, changes }
 */
const dbRun = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    const changes = db.getRowsModified();
    const lastInsertRowid = changes > 0 ? db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] : null;
    stmt.free();
    return { lastInsertRowid, changes };
  } catch (err) {
    console.error('dbRun error:', err.message, '\nSQL:', sql, '\nParams:', JSON.stringify(params));
    throw err;
  }
};

/**
 * Execute multiple SQL statements (for schema init)
 */
const dbExec = (sql) => {
  try {
    db.exec(sql);
  } catch (err) {
    console.error('dbExec error:', err.message);
    throw err;
  }
};

/**
 * Initialize database schema
 */
const initDB = () => {
  const schema = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'teacher',
      password TEXT,
      staff_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Students table
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      admission_no TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      middle_name TEXT,
      last_name TEXT NOT NULL,
      gender TEXT,
      date_of_birth TEXT,
      grade TEXT NOT NULL,
      stream TEXT,
      parent_name TEXT,
      parent_phone TEXT,
      parent_email TEXT,
      address TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Teachers table
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      staff_id TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      gender TEXT,
      id_number TEXT,
      subject_specialization TEXT,
      grade_assigned TEXT,
      stream_assigned TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Attendance records
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT,
      teacher_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('student', 'teacher')),
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late', 'excused')),
      remarks TEXT,
      marked_by TEXT,
      device_id TEXT,
      sync_status TEXT DEFAULT 'synced',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    );

    -- Fees table
    CREATE TABLE IF NOT EXISTS fees (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      balance REAL DEFAULT 0,
      term TEXT,
      year INTEGER,
      due_date TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'partial', 'paid', 'overdue')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    -- Fee payments
    CREATE TABLE IF NOT EXISTS fee_payments (
      id TEXT PRIMARY KEY,
      fee_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT,
      receipt_no TEXT,
      recorded_by TEXT,
      sync_status TEXT DEFAULT 'synced',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fee_id) REFERENCES fees(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    -- Sync queue for offline entries
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      data_type TEXT NOT NULL,
      data_json TEXT NOT NULL,
      synced_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Connected devices tracking
    CREATE TABLE IF NOT EXISTS connected_devices (
      id TEXT PRIMARY KEY,
      device_id TEXT UNIQUE NOT NULL,
      device_name TEXT,
      device_type TEXT,
      last_seen TEXT,
      ip_address TEXT,
      status TEXT DEFAULT 'online',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_no);
    CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
    CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_device ON sync_queue(device_id);
  `;

  dbExec(schema);

  // Insert default admin user if not exists
  const adminExists = dbGet('SELECT id FROM users WHERE role = ?', ['admin']);
  if (!adminExists) {
    dbRun(
      `INSERT INTO users (id, name, email, phone, role, password) VALUES (?, ?, ?, ?, ?, ?)`,
      ['admin-001', 'School Administrator', 'admin@munyaka.local', '+254 700 000 000', 'admin', 'admin123']
    );
  }

  saveDatabase();
};

// Periodic auto-save every 30 seconds
setInterval(saveDatabase, 30000);

// Save on exit
process.on('SIGINT', () => {
  saveDatabase();
  console.log('\n✓ Database saved. Server shutting down.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  saveDatabase();
  console.log('\n✓ Database saved. Server shutting down.');
  process.exit(0);
});

// ============================================
// Helper functions
// ============================================

const generateId = () => crypto.randomUUID();

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
};

// ============================================
// STUDENTS API
// ============================================

// Get all students
app.get('/api/students', (req, res) => {
  try {
    const { grade, search, active } = req.query;
    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];

    if (grade) {
      query += ' AND grade = ?';
      params.push(grade);
    }
    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR admission_no LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    if (active !== undefined) {
      query += ' AND is_active = ?';
      params.push(active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY last_name, first_name';
    const students = dbAll(query, params);
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single student
app.get('/api/students/:id', (req, res) => {
  try {
    const student = dbGet('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create student
app.post('/api/students', (req, res) => {
  try {
    const id = generateId();
    const {
      admission_no, first_name, middle_name, last_name, gender,
      date_of_birth, grade, stream, parent_name, parent_phone, parent_email, address
    } = req.body;

    dbRun(
      `INSERT INTO students (id, admission_no, first_name, middle_name, last_name, gender, date_of_birth, grade, stream, parent_name, parent_phone, parent_email, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, admission_no, first_name, middle_name, last_name, gender, date_of_birth, grade, stream, parent_name, parent_phone, parent_email, address]
    );

    saveDatabase();
    const student = dbGet('SELECT * FROM students WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update student
app.put('/api/students/:id', (req, res) => {
  try {
    const { admission_no, first_name, middle_name, last_name, gender, date_of_birth, grade, stream, parent_name, parent_phone, parent_email, address, is_active } = req.body;

    dbRun(
      `UPDATE students SET admission_no=?, first_name=?, middle_name=?, last_name=?, gender=?, date_of_birth=?, grade=?, stream=?, parent_name=?, parent_phone=?, parent_email=?, address=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [admission_no, first_name, middle_name, last_name, gender, date_of_birth, grade, stream, parent_name, parent_phone, parent_email, address, is_active, req.params.id]
    );

    saveDatabase();
    const student = dbGet('SELECT * FROM students WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete student
app.delete('/api/students/:id', (req, res) => {
  try {
    dbRun('DELETE FROM students WHERE id = ?', [req.params.id]);
    saveDatabase();
    res.json({ success: true, message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// TEACHERS API
// ============================================

// Get all teachers
app.get('/api/teachers', (req, res) => {
  try {
    const { search, active } = req.query;
    let query = 'SELECT * FROM teachers WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR staff_id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    if (active !== undefined) {
      query += ' AND is_active = ?';
      params.push(active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY last_name, first_name';
    const teachers = dbAll(query, params);
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single teacher
app.get('/api/teachers/:id', (req, res) => {
  try {
    const teacher = dbGet('SELECT * FROM teachers WHERE id = ?', [req.params.id]);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create teacher
app.post('/api/teachers', (req, res) => {
  try {
    const id = generateId();
    const {
      staff_id, first_name, last_name, email, phone, gender,
      id_number, subject_specialization, grade_assigned, stream_assigned
    } = req.body;

    dbRun(
      `INSERT INTO teachers (id, staff_id, first_name, last_name, email, phone, gender, id_number, subject_specialization, grade_assigned, stream_assigned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, staff_id, first_name, last_name, email, phone, gender, id_number, subject_specialization, grade_assigned, stream_assigned]
    );

    saveDatabase();
    const teacher = dbGet('SELECT * FROM teachers WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update teacher
app.put('/api/teachers/:id', (req, res) => {
  try {
    const { staff_id, first_name, last_name, email, phone, gender, id_number, subject_specialization, grade_assigned, stream_assigned, is_active } = req.body;

    dbRun(
      `UPDATE teachers SET staff_id=?, first_name=?, last_name=?, email=?, phone=?, gender=?, id_number=?, subject_specialization=?, grade_assigned=?, stream_assigned=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [staff_id, first_name, last_name, email, phone, gender, id_number, subject_specialization, grade_assigned, stream_assigned, is_active, req.params.id]
    );

    saveDatabase();
    const teacher = dbGet('SELECT * FROM teachers WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete teacher
app.delete('/api/teachers/:id', (req, res) => {
  try {
    dbRun('DELETE FROM teachers WHERE id = ?', [req.params.id]);
    saveDatabase();
    res.json({ success: true, message: 'Teacher deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ATTENDANCE API
// ============================================

// Get attendance records
app.get('/api/attendance', (req, res) => {
  try {
    const { date, type, student_id, teacher_id } = req.query;
    let query = 'SELECT * FROM attendance WHERE 1=1';
    const params = [];

    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (student_id) {
      query += ' AND student_id = ?';
      params.push(student_id);
    }
    if (teacher_id) {
      query += ' AND teacher_id = ?';
      params.push(teacher_id);
    }

    query += ' ORDER BY date DESC, created_at DESC';
    const attendance = dbAll(query, params);
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record attendance (single)
app.post('/api/attendance', (req, res) => {
  try {
    const { student_id, teacher_id, type, date, status, remarks, marked_by, device_id } = req.body;

    // Check for duplicate
    const existing = dbGet(
      'SELECT id FROM attendance WHERE student_id = ? AND teacher_id = ? AND type = ? AND date = ?',
      [student_id, teacher_id, type, date]
    );

    if (existing) {
      dbRun(
        `UPDATE attendance SET status=?, remarks=?, marked_by=?, device_id=?, sync_status='synced' WHERE id=?`,
        [status, remarks, marked_by, device_id, existing.id]
      );
      saveDatabase();
      const record = dbGet('SELECT * FROM attendance WHERE id = ?', [existing.id]);
      return res.json({ success: true, data: record, updated: true });
    }

    const id = generateId();
    dbRun(
      `INSERT INTO attendance (id, student_id, teacher_id, type, date, status, remarks, marked_by, device_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, student_id, teacher_id, type, date, status, remarks, marked_by, device_id]
    );

    saveDatabase();
    const record = dbGet('SELECT * FROM attendance WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk record attendance
app.post('/api/attendance/bulk', (req, res) => {
  try {
    const { records } = req.body;
    let processed = 0;

    for (const record of records) {
      const existing = dbGet(
        'SELECT id FROM attendance WHERE student_id = ? AND teacher_id = ? AND type = ? AND date = ?',
        [record.student_id, record.teacher_id, record.type, record.date]
      );

      if (existing) {
        dbRun(
          `UPDATE attendance SET status=?, remarks=?, marked_by=?, device_id=?, sync_status='synced' WHERE id=?`,
          [record.status, record.remarks, record.marked_by, record.device_id, existing.id]
        );
      } else {
        dbRun(
          `INSERT INTO attendance (id, student_id, teacher_id, type, date, status, remarks, marked_by, device_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [generateId(), record.student_id, record.teacher_id, record.type, record.date, record.status, record.remarks, record.marked_by, record.device_id]
        );
      }
      processed++;
    }

    saveDatabase();
    res.json({ success: true, count: processed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// FEES API
// ============================================

// Get fee records
app.get('/api/fees', (req, res) => {
  try {
    const { student_id, status, term, year } = req.query;
    let query = 'SELECT * FROM fees WHERE 1=1';
    const params = [];

    if (student_id) {
      query += ' AND student_id = ?';
      params.push(student_id);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (term) {
      query += ' AND term = ?';
      params.push(term);
    }
    if (year) {
      query += ' AND year = ?';
      params.push(year);
    }

    query += ' ORDER BY due_date DESC';
    const fees = dbAll(query, params);
    res.json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single fee
app.get('/api/fees/:id', (req, res) => {
  try {
    const fee = dbGet('SELECT * FROM fees WHERE id = ?', [req.params.id]);
    if (!fee) {
      return res.status(404).json({ success: false, error: 'Fee record not found' });
    }
    res.json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create fee
app.post('/api/fees', (req, res) => {
  try {
    const id = generateId();
    const { student_id, description, amount, balance, term, year, due_date } = req.body;

    dbRun(
      `INSERT INTO fees (id, student_id, description, amount, balance, term, year, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, student_id, description, amount, balance || amount, term, year, due_date]
    );

    saveDatabase();
    const fee = dbGet('SELECT * FROM fees WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record payment
app.post('/api/fees/:id/payment', (req, res) => {
  try {
    const { amount, payment_date, payment_method, recorded_by, student_id } = req.body;
    const receipt_no = `RCP-${Date.now()}`;
    const paymentId = generateId();

    dbRun(
      `INSERT INTO fee_payments (id, fee_id, student_id, amount, payment_date, payment_method, receipt_no, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [paymentId, req.params.id, student_id, amount, payment_date, payment_method, receipt_no, recorded_by]
    );

    // Update fee balance
    const fee = dbGet('SELECT * FROM fees WHERE id = ?', [req.params.id]);
    if (fee) {
      const newBalance = Math.max(0, (fee.balance || 0) - amount);
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';

      dbRun(
        `UPDATE fees SET balance=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [newBalance, newStatus, req.params.id]
      );
    }

    saveDatabase();
    const updatedFee = dbGet('SELECT * FROM fees WHERE id = ?', [req.params.id]);
    const payment = dbGet('SELECT * FROM fee_payments WHERE id = ?', [paymentId]);

    res.status(201).json({ success: true, data: { fee: updatedFee, payment } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DEVICES API
// ============================================

// Register device
app.post('/api/devices/register', (req, res) => {
  try {
    const { device_id, device_name, device_type, ip_address } = req.body;
    const now = new Date().toISOString();

    // Check if device exists
    const existing = dbGet('SELECT id FROM connected_devices WHERE device_id = ?', [device_id]);

    if (existing) {
      dbRun(
        `UPDATE connected_devices SET last_seen=?, ip_address=?, device_name=COALESCE(?, device_name), status='online' WHERE device_id=?`,
        [now, ip_address, device_name, device_id]
      );
    } else {
      dbRun(
        `INSERT INTO connected_devices (id, device_id, device_name, device_type, last_seen, ip_address, status)
         VALUES (?, ?, ?, ?, ?, ?, 'online')`,
        [generateId(), device_id, device_name, device_type, now, ip_address]
      );
    }

    saveDatabase();
    res.json({ success: true, message: 'Device registered' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Heartbeat
app.post('/api/devices/heartbeat', (req, res) => {
  try {
    const { device_id } = req.body;
    const now = new Date().toISOString();

    dbRun(
      `UPDATE connected_devices SET last_seen=?, status='online' WHERE device_id=?`,
      [now, device_id]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get connected devices
app.get('/api/devices', (req, res) => {
  try {
    const devices = dbAll(`SELECT * FROM connected_devices ORDER BY last_seen DESC`);
    const now = new Date();

    const updatedDevices = devices.map(d => {
      const lastSeen = new Date(d.last_seen);
      const diffMinutes = (now - lastSeen) / (1000 * 60);
      return {
        ...d,
        current_status: diffMinutes > 5 ? 'offline' : 'online'
      };
    });

    res.json({ success: true, data: updatedDevices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SYNC API
// ============================================

// Sync offline records
app.post('/api/sync', (req, res) => {
  try {
    const { device_id, records } = req.body;
    const now = new Date().toISOString();
    const results = [];

    for (const record of records) {
      const { type, data } = record;

      try {
        if (type === 'attendance') {
          const existing = dbGet(
            'SELECT id FROM attendance WHERE student_id = ? AND teacher_id = ? AND type = ? AND date = ?',
            [data.student_id, data.teacher_id, data.type, data.date]
          );

          if (existing) {
            dbRun(
              `UPDATE attendance SET status=?, remarks=?, marked_by=?, device_id=?, sync_status='synced' WHERE id=?`,
              [data.status, data.remarks, data.marked_by, device_id, existing.id]
            );
            results.push({ id: existing.id, status: 'updated', originalId: data.id });
          } else {
            const id = data.id || generateId();
            dbRun(
              `INSERT INTO attendance (id, student_id, teacher_id, type, date, status, remarks, marked_by, device_id, sync_status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
              [id, data.student_id, data.teacher_id, data.type, data.date, data.status, data.remarks, data.marked_by, device_id]
            );
            results.push({ id, status: 'created', originalId: data.id });
          }
        } else if (type === 'fee') {
          if (data.id) {
            const existing = dbGet('SELECT id FROM fees WHERE id = ?', [data.id]);
            if (existing) {
              dbRun(
                `UPDATE fees SET description=?, amount=?, balance=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
                [data.description, data.amount, data.balance, data.status, data.id]
              );
              results.push({ id: data.id, status: 'updated' });
            } else {
              dbRun(
                `INSERT INTO fees (id, student_id, description, amount, balance, term, year, due_date, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [data.id, data.student_id, data.description, data.amount, data.balance, data.term, data.year, data.due_date, data.status]
              );
              results.push({ id: data.id, status: 'created' });
            }
          }
        } else if (type === 'student') {
          if (data.id) {
            const existing = dbGet('SELECT id FROM students WHERE id = ?', [data.id]);
            if (existing) {
              dbRun(
                `UPDATE students SET admission_no=?, first_name=?, middle_name=?, last_name=?, gender=?, grade=?, stream=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
                [data.admission_no, data.first_name, data.middle_name, data.last_name, data.gender, data.grade, data.stream, data.id]
              );
              results.push({ id: data.id, status: 'updated' });
            } else {
              dbRun(
                `INSERT INTO students (id, admission_no, first_name, middle_name, last_name, gender, grade, stream)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [data.id, data.admission_no, data.first_name, data.middle_name, data.last_name, data.gender, data.grade, data.stream]
              );
              results.push({ id: data.id, status: 'created' });
            }
          }
        }
      } catch (err) {
        results.push({ id: data.id, status: 'error', error: err.message });
      }
    }

    // Add to sync queue for audit
    dbRun(
      `INSERT INTO sync_queue (id, device_id, data_type, data_json, synced_at) VALUES (?, ?, 'bulk_sync', ?, ?)`,
      [generateId(), device_id, JSON.stringify(records), now]
    );

    saveDatabase();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DATABASE MANAGEMENT API
// ============================================

// Get database stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      students: dbGet('SELECT COUNT(*) as count FROM students WHERE is_active = 1')?.count || 0,
      teachers: dbGet('SELECT COUNT(*) as count FROM teachers WHERE is_active = 1')?.count || 0,
      attendance_today: dbGet(`SELECT COUNT(*) as count FROM attendance WHERE date = date('now')`)?.count || 0,
      pending_fees: dbGet(`SELECT COUNT(*) as count FROM fees WHERE status IN ('pending', 'partial', 'overdue')`)?.count || 0,
      connected_devices: dbGet(`SELECT COUNT(*) as count FROM connected_devices WHERE datetime(last_seen) > datetime('now', '-5 minutes')`)?.count || 0,
      pending_sync: dbGet(`SELECT COUNT(*) as count FROM sync_queue WHERE synced_at IS NULL`)?.count || 0
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Backup database (JSON export)
app.get('/api/backup', (req, res) => {
  try {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      students: dbAll('SELECT * FROM students'),
      teachers: dbAll('SELECT * FROM teachers'),
      attendance: dbAll('SELECT * FROM attendance'),
      fees: dbAll('SELECT * FROM fees'),
      fee_payments: dbAll('SELECT * FROM fee_payments'),
      users: dbAll('SELECT id, name, email, phone, role, staff_id, is_active FROM users')
    };

    const filename = `munyaka-backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(backup);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Backup as SQLite file download
app.get('/api/backup/db', (req, res) => {
  try {
    const data = db.export();
    const filename = `munyaka-db-${new Date().toISOString().split('T')[0]}.sqlite`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(Buffer.from(data));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Restore from backup
app.post('/api/backup/restore', (req, res) => {
  try {
    const { students, teachers, attendance, fees, fee_payments, users } = req.body;

    if (students && Array.isArray(students)) {
      for (const s of students) {
        const existing = dbGet('SELECT id FROM students WHERE id = ?', [s.id]);
        if (existing) {
          dbRun(
            `UPDATE students SET admission_no=?, first_name=?, middle_name=?, last_name=?, gender=?, date_of_birth=?, grade=?, stream=?, parent_name=?, parent_phone=?, parent_email=?, address=?, is_active=? WHERE id=?`,
            [s.admission_no, s.first_name, s.middle_name, s.last_name, s.gender, s.date_of_birth, s.grade, s.stream, s.parent_name, s.parent_phone, s.parent_email, s.address, s.is_active, s.id]
          );
        } else {
          dbRun(
            `INSERT INTO students (id, admission_no, first_name, middle_name, last_name, gender, date_of_birth, grade, stream, parent_name, parent_phone, parent_email, address, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [s.id, s.admission_no, s.first_name, s.middle_name, s.last_name, s.gender, s.date_of_birth, s.grade, s.stream, s.parent_name, s.parent_phone, s.parent_email, s.address, s.is_active, s.created_at || new Date().toISOString()]
          );
        }
      }
    }

    if (teachers && Array.isArray(teachers)) {
      for (const t of teachers) {
        const existing = dbGet('SELECT id FROM teachers WHERE id = ?', [t.id]);
        if (existing) {
          dbRun(
            `UPDATE teachers SET staff_id=?, first_name=?, last_name=?, email=?, phone=?, gender=?, id_number=?, subject_specialization=?, grade_assigned=?, stream_assigned=?, is_active=? WHERE id=?`,
            [t.staff_id, t.first_name, t.last_name, t.email, t.phone, t.gender, t.id_number, t.subject_specialization, t.grade_assigned, t.stream_assigned, t.is_active, t.id]
          );
        } else {
          dbRun(
            `INSERT INTO teachers (id, staff_id, first_name, last_name, email, phone, gender, id_number, subject_specialization, grade_assigned, stream_assigned, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [t.id, t.staff_id, t.first_name, t.last_name, t.email, t.phone, t.gender, t.id_number, t.subject_specialization, t.grade_assigned, t.stream_assigned, t.is_active, t.created_at || new Date().toISOString()]
          );
        }
      }
    }

    saveDatabase();
    res.json({ success: true, message: 'Backup restored successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// USERS API
// ============================================

// Get all users
app.get('/api/users', (req, res) => {
  try {
    const users = dbAll('SELECT id, name, email, phone, role, staff_id, is_active, created_at FROM users ORDER BY role, name');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create user
app.post('/api/users', (req, res) => {
  try {
    const id = generateId();
    const { name, email, phone, role, password, staff_id } = req.body;

    dbRun(
      `INSERT INTO users (id, name, email, phone, role, password, staff_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, phone, role, password, staff_id]
    );

    saveDatabase();
    const user = dbGet('SELECT id, name, email, phone, role, staff_id, is_active, created_at FROM users WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user
app.put('/api/users/:id', (req, res) => {
  try {
    const { name, email, phone, role, password, staff_id, is_active } = req.body;

    if (password) {
      dbRun(
        `UPDATE users SET name=?, email=?, phone=?, role=?, password=?, staff_id=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [name, email, phone, role, password, staff_id, is_active, req.params.id]
      );
    } else {
      dbRun(
        `UPDATE users SET name=?, email=?, phone=?, role=?, staff_id=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [name, email, phone, role, staff_id, is_active, req.params.id]
      );
    }

    saveDatabase();
    const user = dbGet('SELECT id, name, email, phone, role, staff_id, is_active, created_at FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  try {
    dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
    saveDatabase();
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SERVER INFO
// ============================================

app.get('/api/server/info', (req, res) => {
  res.json({
    success: true,
    data: {
      ip: getLocalIP(),
      port: PORT,
      url: `http://${getLocalIP()}:${PORT}`,
      database: DB_PATH,
      version: '1.0.0',
      engine: 'sql.js (pure JavaScript SQLite)',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    engine: 'sql.js',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    await loadDatabase();
    initDB();

    app.listen(PORT, '0.0.0.0', () => {
      const localIP = getLocalIP();
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║           MUNYAKA LAN SCHOOL MANAGEMENT SERVER                ║
╠══════════════════════════════════════════════════════════════╣
║  Server running on: http://${localIP}:${PORT}                  
║  Local access:    http://localhost:${PORT}                     
║  Database:        ${DB_PATH}   
║  Engine:          sql.js (Pure JavaScript SQLite - WASM)
╠══════════════════════════════════════════════════════════════╣
║  API Endpoints:                                                ║
║  • GET  /api/students     - List all students                 ║
║  • POST /api/students     - Create student                    ║
║  • GET  /api/teachers     - List all teachers                 ║
║  • POST /api/teachers     - Create teacher                    ║
║  • GET  /api/attendance   - Get attendance records            ║
║  • POST /api/attendance   - Record attendance                 ║
║  • GET  /api/fees         - Get fee records                  ║
║  • POST /api/fees         - Create fee record                 ║
║  • GET  /api/devices      - List connected devices            ║
║  • POST /api/sync         - Sync offline data                ║
║  • GET  /api/stats        - Database statistics              ║
║  • GET  /api/backup       - Export database backup (JSON)    ║
║  • GET  /api/backup/db    - Export SQLite file               ║
║  • GET  /api/server/info   - Server connection info           ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

export default app;