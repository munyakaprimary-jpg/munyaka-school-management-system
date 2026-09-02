// LAN School Management System - Express Backend Server
// Run with: node server/index.js
// Make sure to install dependencies: npm install express better-sqlite3 cors

import express from 'express';
import Database from 'better-sqlite3';
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
app.use(express.json());

// Initialize SQLite Database
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
const initDB = () => {
  db.exec(`
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

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_no);
    CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
    CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_device ON sync_queue(device_id);
  `);

  // Insert default admin user if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!adminExists) {
    db.prepare(`
      INSERT INTO users (id, name, email, phone, role, password)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'admin-001',
      'School Administrator',
      'admin@munyaka.local',
      '+254 700 000 000',
      'admin',
      'admin123'
    );
  }
};

initDB();

// Helper function to generate UUID
const generateId = () => crypto.randomUUID();

// Get local IP address
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

// ============ STUDENTS API ============

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
    const students = db.prepare(query).all(...params);
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single student
app.get('/api/students/:id', (req, res) => {
  try {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
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

    db.prepare(`
      INSERT INTO students (id, admission_no, first_name, middle_name, last_name, gender, date_of_birth, grade, stream, parent_name, parent_phone, parent_email, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, admission_no, first_name, middle_name, last_name, gender, date_of_birth, grade, stream, parent_name, parent_phone, parent_email, address);

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update student
app.put('/api/students/:id', (req, res) => {
  try {
    const { admission_no, first_name, middle_name, last_name, gender, date_of_birth, grade, stream, parent_name, parent_phone, parent_email, address, is_active } = req.body;

    db.prepare(`
      UPDATE students SET admission_no=?, first_name=?, middle_name=?, last_name=?, gender=?, date_of_birth=?, grade=?, stream=?, parent_name=?, parent_phone=?, parent_email=?, address=?, is_active=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(admission_no, first_name, middle_name, last_name, gender, date_of_birth, grade, stream, parent_name, parent_phone, parent_email, address, is_active, req.params.id);

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ TEACHERS API ============

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
    const teachers = db.prepare(query).all(...params);
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single teacher
app.get('/api/teachers/:id', (req, res) => {
  try {
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
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

    db.prepare(`
      INSERT INTO teachers (id, staff_id, first_name, last_name, email, phone, gender, id_number, subject_specialization, grade_assigned, stream_assigned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, staff_id, first_name, last_name, email, phone, gender, id_number, subject_specialization, grade_assigned, stream_assigned);

    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update teacher
app.put('/api/teachers/:id', (req, res) => {
  try {
    const { staff_id, first_name, last_name, email, phone, gender, id_number, subject_specialization, grade_assigned, stream_assigned, is_active } = req.body;

    db.prepare(`
      UPDATE teachers SET staff_id=?, first_name=?, last_name=?, email=?, phone=?, gender=?, id_number=?, subject_specialization=?, grade_assigned=?, stream_assigned=?, is_active=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(staff_id, first_name, last_name, email, phone, gender, id_number, subject_specialization, grade_assigned, stream_assigned, is_active, req.params.id);

    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ ATTENDANCE API ============

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
    const attendance = db.prepare(query).all(...params);
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record attendance
app.post('/api/attendance', (req, res) => {
  try {
    const id = generateId();
    const { student_id, teacher_id, type, date, status, remarks, marked_by, device_id } = req.body;

    // Check for duplicate
    const existing = db.prepare(
      'SELECT id FROM attendance WHERE student_id = ? AND teacher_id = ? AND type = ? AND date = ?'
    ).get(student_id, teacher_id, type, date);

    if (existing) {
      // Update existing record
      db.prepare(`
        UPDATE attendance SET status=?, remarks=?, marked_by=?, device_id=?, sync_status='synced'
        WHERE id=?
      `).run(status, remarks, marked_by, device_id, existing.id);
      const record = db.prepare('SELECT * FROM attendance WHERE id = ?').get(existing.id);
      return res.json({ success: true, data: record, updated: true });
    }

    db.prepare(`
      INSERT INTO attendance (id, student_id, teacher_id, type, date, status, remarks, marked_by, device_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, student_id, teacher_id, type, date, status, remarks, marked_by, device_id);

    const record = db.prepare('SELECT * FROM attendance WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk record attendance
app.post('/api/attendance/bulk', (req, res) => {
  try {
    const { records } = req.body;
    const insertStmt = db.prepare(`
      INSERT INTO attendance (id, student_id, teacher_id, type, date, status, remarks, marked_by, device_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((records) => {
      for (const record of records) {
        const existing = db.prepare(
          'SELECT id FROM attendance WHERE student_id = ? AND teacher_id = ? AND type = ? AND date = ?'
        ).get(record.student_id, record.teacher_id, record.type, record.date);

        if (existing) {
          db.prepare(`
            UPDATE attendance SET status=?, remarks=?, marked_by=?, device_id=?, sync_status='synced'
            WHERE id=?
          `).run(record.status, record.remarks, record.marked_by, record.device_id, existing.id);
        } else {
          insertStmt.run(generateId(), record.student_id, record.teacher_id, record.type, record.date, record.status, record.remarks, record.marked_by, record.device_id);
        }
      }
    });

    insertMany(records);
    res.json({ success: true, count: records.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ FEES API ============

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
    const fees = db.prepare(query).all(...params);
    res.json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single fee
app.get('/api/fees/:id', (req, res) => {
  try {
    const fee = db.prepare('SELECT * FROM fees WHERE id = ?').get(req.params.id);
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

    db.prepare(`
      INSERT INTO fees (id, student_id, description, amount, balance, term, year, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, student_id, description, amount, balance || amount, term, year, due_date);

    const fee = db.prepare('SELECT * FROM fees WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: fee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record payment
app.post('/api/fees/:id/payment', (req, res) => {
  try {
    const { amount, payment_date, payment_method, recorded_by } = req.body;
    const receipt_no = `RCP-${Date.now()}`;

    const paymentId = generateId();
    db.prepare(`
      INSERT INTO fee_payments (id, fee_id, student_id, amount, payment_date, payment_method, receipt_no, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(paymentId, req.params.id, req.body.student_id, amount, payment_date, payment_method, receipt_no, recorded_by);

    // Update fee balance
    const fee = db.prepare('SELECT * FROM fees WHERE id = ?').get(req.params.id);
    const newBalance = (fee.balance || 0) - amount;
    const newStatus = newBalance <= 0 ? 'paid' : 'partial';

    db.prepare(`
      UPDATE fees SET balance=?, status=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(Math.max(0, newBalance), newStatus, req.params.id);

    const updatedFee = db.prepare('SELECT * FROM fees WHERE id = ?').get(req.params.id);
    const payment = db.prepare('SELECT * FROM fee_payments WHERE id = ?').get(paymentId);

    res.status(201).json({ success: true, data: { fee: updatedFee, payment } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ SYNC API ============

// Register device
app.post('/api/devices/register', (req, res) => {
  try {
    const { device_id, device_name, device_type, ip_address } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO connected_devices (id, device_id, device_name, device_type, last_seen, ip_address, status)
      VALUES (?, ?, ?, ?, ?, ?, 'online')
      ON CONFLICT(device_id) DO UPDATE SET
        last_seen = excluded.last_seen,
        ip_address = excluded.ip_address,
        device_name = COALESCE(excluded.device_name, connected_devices.device_name),
        status = 'online'
    `).run(generateId(), device_id, device_name, device_type, now, ip_address);

    res.json({ success: true, message: 'Device registered' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Heartbeat to keep device alive
app.post('/api/devices/heartbeat', (req, res) => {
  try {
    const { device_id } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE connected_devices SET last_seen = ?, status = 'online'
      WHERE device_id = ?
    `).run(now, device_id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get connected devices
app.get('/api/devices', (req, res) => {
  try {
    const devices = db.prepare(`
      SELECT *, 
        CASE 
          WHEN datetime(last_seen) < datetime('now', '-5 minutes') THEN 'offline'
          ELSE 'online'
        END as current_status
      FROM connected_devices
      ORDER BY last_seen DESC
    `).all();

    // Update status based on last_seen
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

// Sync offline queue
app.post('/api/sync', (req, res) => {
  try {
    const { device_id, records } = req.body;
    const now = new Date().toISOString();
    const results = [];

    for (const record of records) {
      const { type, data } = record;

      try {
        if (type === 'attendance') {
          const existing = db.prepare(
            'SELECT id FROM attendance WHERE student_id = ? AND teacher_id = ? AND type = ? AND date = ?'
          ).get(data.student_id, data.teacher_id, data.type, data.date);

          if (existing) {
            db.prepare(`
              UPDATE attendance SET status=?, remarks=?, marked_by=?, device_id=?, sync_status='synced'
              WHERE id=?
            `).run(data.status, data.remarks, data.marked_by, device_id, existing.id);
            results.push({ id: existing.id, status: 'updated', originalId: data.id });
          } else {
            const id = data.id || generateId();
            db.prepare(`
              INSERT INTO attendance (id, student_id, teacher_id, type, date, status, remarks, marked_by, device_id, sync_status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
            `).run(id, data.student_id, data.teacher_id, data.type, data.date, data.status, data.remarks, data.marked_by, device_id);
            results.push({ id, status: 'created', originalId: data.id });
          }
        }
      } catch (err) {
        results.push({ id: data.id, status: 'error', error: err.message });
      }
    }

    // Add to sync queue for audit
    db.prepare(`
      INSERT INTO sync_queue (id, device_id, data_type, data_json, synced_at)
      VALUES (?, ?, 'bulk_sync', ?, ?)
    `).run(generateId(), device_id, JSON.stringify(records), now);

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ DATABASE MANAGEMENT API ============

// Get database stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      students: db.prepare('SELECT COUNT(*) as count FROM students WHERE is_active = 1').get().count,
      teachers: db.prepare('SELECT COUNT(*) as count FROM teachers WHERE is_active = 1').get().count,
      attendance_today: db.prepare("SELECT COUNT(*) as count FROM attendance WHERE date = date('now')").get().count,
      pending_fees: db.prepare("SELECT COUNT(*) as count FROM fees WHERE status IN ('pending', 'partial', 'overdue')").get().count,
      connected_devices: db.prepare("SELECT COUNT(*) as count FROM connected_devices WHERE datetime(last_seen) > datetime('now', '-5 minutes')").get().count,
      pending_sync: db.prepare("SELECT COUNT(*) as count FROM sync_queue WHERE synced_at IS NULL").get().count
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Backup database
app.get('/api/backup', (req, res) => {
  try {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      students: db.prepare('SELECT * FROM students').all(),
      teachers: db.prepare('SELECT * FROM teachers').all(),
      attendance: db.prepare('SELECT * FROM attendance').all(),
      fees: db.prepare('SELECT * FROM fees').all(),
      fee_payments: db.prepare('SELECT * FROM fee_payments').all()
    };

    const filename = `munyaka-backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(backup);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Restore from backup
app.post('/api/backup/restore', (req, res) => {
  try {
    const { students, teachers, attendance, fees, fee_payments } = req.body;

    const restore = db.transaction(() => {
      if (students) {
        for (const s of students) {
          db.prepare(`
            INSERT OR REPLACE INTO students (id, admission_no, first_name, middle_name, last_name, gender, date_of_birth, grade, stream, parent_name, parent_phone, parent_email, address, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(s.id, s.admission_no, s.first_name, s.middle_name, s.last_name, s.gender, s.date_of_birth, s.grade, s.stream, s.parent_name, s.parent_phone, s.parent_email, s.address, s.is_active, s.created_at, new Date().toISOString());
        }
      }
      if (teachers) {
        for (const t of teachers) {
          db.prepare(`
            INSERT OR REPLACE INTO teachers (id, staff_id, first_name, last_name, email, phone, gender, id_number, subject_specialization, grade_assigned, stream_assigned, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(t.id, t.staff_id, t.first_name, t.last_name, t.email, t.phone, t.gender, t.id_number, t.subject_specialization, t.grade_assigned, t.stream_assigned, t.is_active, t.created_at, new Date().toISOString());
        }
      }
    });

    restore();
    res.json({ success: true, message: 'Backup restored successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ USER MANAGEMENT API ============

// Get all users
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, phone, role, staff_id, is_active, created_at FROM users ORDER BY role, name').all();
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

    db.prepare(`
      INSERT INTO users (id, name, email, phone, role, password, staff_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, email, phone, role, password, staff_id);

    const user = db.prepare('SELECT id, name, email, phone, role, staff_id, is_active, created_at FROM users WHERE id = ?').get(id);
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
      db.prepare(`
        UPDATE users SET name=?, email=?, phone=?, role=?, password=?, staff_id=?, is_active=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).run(name, email, phone, role, password, staff_id, is_active, req.params.id);
    } else {
      db.prepare(`
        UPDATE users SET name=?, email=?, phone=?, role=?, staff_id=?, is_active=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).run(name, email, phone, role, staff_id, is_active, req.params.id);
    }

    const user = db.prepare('SELECT id, name, email, phone, role, staff_id, is_active, created_at FROM users WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ SERVER INFO ============

// Get server info (for Admin Dashboard)
app.get('/api/server/info', (req, res) => {
  res.json({
    success: true,
    data: {
      ip: getLocalIP(),
      port: PORT,
      url: `http://${getLocalIP()}:${PORT}`,
      database: DB_PATH,
      version: '1.0.0',
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
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  const localIP = getLocalIP();
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           MUNYAKA LAN SCHOOL MANAGEMENT SERVER                ║
╠══════════════════════════════════════════════════════════════╣
║  Server running on: http://${localIP}:${PORT}                  
║  Local access:    http://localhost:${PORT}                     
║  Database:        ${DB_PATH}   
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
║  • GET  /api/backup       - Export database backup           ║
║  • GET  /api/server/info   - Server connection info           ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
