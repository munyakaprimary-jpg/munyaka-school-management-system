const express = require('express');
const cors = require('cors');
const { Database } = require('better-sqlite3');
const { WebSocketServer } = require('ws');
const os = require('os');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Database setup
const dbPath = path.join(__dirname, 'admin_sync.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id TEXT NOT NULL,
    device_id TEXT,
    payload_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT DEFAULT 'RECEIVED',
    conflict_resolution TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS student_marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    term TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    score INTEGER NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    teacher_id TEXT,
    device_id TEXT,
    UNIQUE(student_id, subject_id, exam_type, term, academic_year)
  );

  CREATE TABLE IF NOT EXISTS attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    date TEXT NOT NULL,
    session TEXT NOT NULL,
    status TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    teacher_id TEXT,
    device_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS staff_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_id TEXT NOT NULL,
    date TEXT NOT NULL,
    session TEXT NOT NULL,
    status TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    location_lat REAL,
    location_lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_data TEXT,
    new_data TEXT,
    teacher_id TEXT,
    device_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conflicts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_key TEXT NOT NULL,
    local_data TEXT NOT NULL,
    incoming_data TEXT NOT NULL,
    resolution TEXT DEFAULT 'PENDING',
    resolved_by TEXT,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_sync_log_teacher ON sync_log(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_sync_log_created ON sync_log(created_at);
  CREATE INDEX IF NOT EXISTS idx_conflicts_status ON conflicts(resolution);
`);

// WebSocket for real-time updates
const wss = new WebSocketServer({ noServer: true });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});

function broadcast(message: any) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

// Helper: Get local IP addresses
function getLocalIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

// LWW Conflict Resolution for Marks
function resolveMarksConflict(existing: any, incoming: any): { winner: any; resolution: string } {
  const existingTime = new Date(existing.updated_at).getTime();
  const incomingTime = new Date(incoming.updated_at || incoming.timestamp).getTime();
  
  if (incomingTime > existingTime) {
    return { winner: incoming, resolution: 'INCOMING_WINS_LWW' };
  }
  return { winner: existing, resolution: 'EXISTING_WINS_LWW' };
}

// Audit trail helper
function logAudit(tableName: string, recordId: string, action: string, oldData: any, newData: any, teacherId: string, deviceId: string) {
  db.prepare(`
    INSERT INTO audit_trail (table_name, record_id, action, old_data, new_data, teacher_id, device_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(tableName, recordId, action, JSON.stringify(oldData), JSON.stringify(newData), teacherId, deviceId);
}

// Sync endpoint
app.post('/api/sync', async (req, res) => {
  const { items } = req.body;
  
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ status: 'error', message: 'Invalid payload' });
  }

  const syncedIds: number[] = [];
  const conflicts: any[] = [];

  // Process in transaction
  const transaction = db.transaction((items) => {
    for (const item of items) {
      const { id, type, data } = item;
      const { teacher_id, device_id, timestamp } = data;

      // Log sync receipt
      db.prepare(`
        INSERT INTO sync_log (teacher_id, device_id, payload_type, payload, status)
        VALUES (?, ?, ?, ?, 'RECEIVED')
      `).run(teacher_id, device_id, type, JSON.stringify(data));

      try {
        switch (type) {
          case 'marks': {
            const existing = db.prepare(`
              SELECT * FROM student_marks 
              WHERE student_id = ? AND subject_id = ? AND exam_type = ? AND term = ? AND academic_year = ?
            `).get(data.student_id, data.subject_id, data.exam_type, data.term, data.academic_year);

            if (existing) {
              const { winner, resolution } = resolveMarksConflict(existing, { ...data, updated_at: timestamp });
              if (resolution === 'INCOMING_WINS_LWW') {
                db.prepare(`
                  UPDATE student_marks 
                  SET score = ?, updated_at = ?, teacher_id = ?, device_id = ?
                  WHERE student_id = ? AND subject_id = ? AND exam_type = ? AND term = ? AND academic_year = ?
                `).run(winner.score, timestamp, teacher_id, device_id, data.student_id, data.subject_id, data.exam_type, data.term, data.academic_year);
                logAudit('student_marks', `${data.student_id}-${data.subject_id}-${data.exam_type}-${data.term}-${data.academic_year}`, 'UPDATE', existing, winner, teacher_id, device_id);
              } else {
                conflicts.push({
                  id,
                  table: 'student_marks',
                  key: `${data.student_id}-${data.subject_id}-${data.exam_type}-${data.term}-${data.academic_year}`,
                  local: existing,
                  incoming: data,
                  resolution: 'EXISTING_WINS_LWW'
                });
              }
            } else {
              db.prepare(`
                INSERT INTO student_marks (student_id, subject_id, exam_type, term, academic_year, score, updated_at, teacher_id, device_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(data.student_id, data.subject_id, data.exam_type, data.term, data.academic_year, data.score, timestamp, teacher_id, device_id);
              logAudit('student_marks', `${data.student_id}-${data.subject_id}-${data.exam_type}-${data.term}-${data.academic_year}`, 'INSERT', null, data, teacher_id, device_id);
            }
            break;
          }

          case 'attendance': {
            // Append-only for attendance
            db.prepare(`
              INSERT OR IGNORE INTO attendance_records (student_id, date, session, status, timestamp, teacher_id, device_id)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(data.student_id, data.date, data.session, data.status, timestamp, teacher_id, device_id);
            logAudit('attendance_records', `${data.student_id}-${data.date}-${data.session}`, 'INSERT', null, data, teacher_id, device_id);
            break;
          }

          case 'staff_checkin': {
            db.prepare(`
              INSERT OR IGNORE INTO staff_checkins (staff_id, date, session, status, timestamp, location_lat, location_lng)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(data.staff_id, data.date, data.session, data.status, timestamp, data.location_lat, data.location_lng);
            logAudit('staff_checkins', `${data.staff_id}-${data.date}-${data.session}`, 'INSERT', null, data, teacher_id, device_id);
            break;
          }

          case 'student_registration': {
            // Handle student registration sync
            db.prepare(`
              INSERT OR IGNORE INTO students (id, name, assessment, grade, stream, guardian, phone, email)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(data.id, data.name, data.assessment, data.grade, data.stream, data.guardian, data.phone, data.email);
            break;
          }

          case 'fee_payment': {
            db.prepare(`
              INSERT INTO fee_transactions (student_id, amount, method, reference, category, date, recorded_by)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(data.student_id, data.amount, data.method, data.reference, data.category, data.date, teacher_id);
            break;
          }
        }

        syncedIds.push(id);
      } catch (error) {
        console.error(`Error processing item ${id}:`, error);
        conflicts.push({ id, error: error.message });
      }
    }
  });

  try {
    transaction(items);
    
    // Log conflicts if any
    for (const conflict of conflicts) {
      if (conflict.table) {
        db.prepare(`
          INSERT INTO conflicts (table_name, record_key, local_data, incoming_data, resolution)
          VALUES (?, ?, ?, ?, 'PENDING')
        `).run(conflict.table, conflict.key, JSON.stringify(conflict.local), JSON.stringify(conflict.incoming));
      }
    }

    // Broadcast real-time update
    broadcast({ type: 'SYNC_COMPLETE', syncedCount: syncedIds.length, timestamp: new Date().toISOString() });

    res.json({ status: 'success', syncedIds });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Admin Dashboard API endpoints
app.get('/api/admin/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const totalSyncedToday = db.prepare(`
    SELECT COUNT(*) as count FROM sync_log WHERE date(created_at) = ?
  `).get(today)?.count || 0;

  const activeTeachers = db.prepare(`
    SELECT COUNT(DISTINCT teacher_id) as count FROM sync_log WHERE date(created_at) = ?
  `).get(today)?.count || 0;

  const pendingConflicts = db.prepare(`
    SELECT COUNT(*) as count FROM conflicts WHERE resolution = 'PENDING'
  `).get()?.count || 0;

  const recentSyncs = db.prepare(`
    SELECT teacher_id, payload_type, status, created_at 
    FROM sync_log 
    ORDER BY created_at DESC 
    LIMIT 50
  `).all();

  res.json({
    totalSyncedToday,
    activeTeachers,
    pendingConflicts,
    recentSyncs,
    serverIPs: getLocalIPs(),
    port: PORT
  });
});

app.get('/api/admin/conflicts', (req, res) => {
  const conflicts = db.prepare(`
    SELECT * FROM conflicts WHERE resolution = 'PENDING' ORDER BY created_at DESC
  `).all();
  res.json(conflicts);
});

app.post('/api/admin/conflicts/:id/resolve', (req, res) => {
  const { id } = req.params;
  const { resolution, resolvedData } = req.body; // resolution: 'LOCAL' | 'INCOMING' | 'MERGE'
  
  const conflict = db.prepare('SELECT * FROM conflicts WHERE id = ?').get(id);
  if (!conflict) {
    return res.status(404).json({ status: 'error', message: 'Conflict not found' });
  }

  let finalData;
  if (resolution === 'LOCAL') {
    finalData = JSON.parse(conflict.local_data);
  } else if (resolution === 'INCOMING') {
    finalData = JSON.parse(conflict.incoming_data);
  } else {
    finalData = resolvedData; // Manual merge
  }

  // Apply resolution based on table
  switch (conflict.table_name) {
    case 'student_marks':
      db.prepare(`
        UPDATE student_marks 
        SET score = ?, updated_at = datetime('now')
        WHERE student_id = ? AND subject_id = ? AND exam_type = ? AND term = ? AND academic_year = ?
      `).run(finalData.score, finalData.student_id, finalData.subject_id, finalData.exam_type, finalData.term, finalData.academic_year);
      break;
  }

  db.prepare(`
    UPDATE conflicts SET resolution = ?, resolved_by = 'admin', resolved_at = datetime('now') WHERE id = ?
  `).run(resolution, id);

  broadcast({ type: 'CONFLICT_RESOLVED', conflictId: id });
  res.json({ status: 'success' });
});

app.get('/api/admin/audit', (req, res) => {
  const { table, limit = 100 } = req.query;
  let query = 'SELECT * FROM audit_trail';
  const params: any[] = [];
  
  if (table) {
    query += ' WHERE table_name = ?';
    params.push(table);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  
  const audit = db.prepare(query).all(...params);
  res.json(audit);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), ips: getLocalIPs() });
});

// Start HTTP server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Admin Sync Server running on port ${PORT}`);
  console.log('Available on:');
  getLocalIPs().forEach(ip => console.log(`  http://${ip}:${PORT}`));
  console.log(`  http://localhost:${PORT}`);
});

// WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

module.exports = app;