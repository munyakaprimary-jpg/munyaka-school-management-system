// LAN School Management System - Express Backend Server
// Clean local Wi-Fi configuration
// Run with: node server/index.js
// First install: cd server && npm install

import express from 'express';
import cors from 'cors';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const USERS_FILE = path.join(ROOT, 'data', 'users.json');

const PORT = 5000;
const HOST = '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'munyaka-lan-jwt-secret-key-2026';

// Initialize Express
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper to read users db
function readUsersDb() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return { users: [] };
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { users: [] };
  }
}

// Helper to write users db
function writeUsersDb(db) {
  const dir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// Helper for temporary password generation (MUNYAKA-XXXX)
function generateTemporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomHex = '';
  for (let i = 0; i < 4; i++) {
    randomHex += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MUNYAKA-${randomHex}`;
}

// ============================================
// CENTRAL DB DUMP & SYNC ENDPOINTS
// ============================================
const CENTRAL_DB_FILE = path.join(ROOT, 'data', 'central_db.json');

function readCentralDb() {
  try {
    if (!fs.existsSync(CENTRAL_DB_FILE)) {
      return {
        students: [],
        staff: [],
        attendance: {},
        fees: [],
        grades: {},
        examTypes: [],
        libraryBooks: [],
        feeStructures: [],
        notices: [],
        settings: {}
      };
    }
    const data = fs.readFileSync(CENTRAL_DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function writeCentralDb(db) {
  const dir = path.dirname(CENTRAL_DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CENTRAL_DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

app.get('/api/central-db/dump', (req, res) => {
  try {
    const db = readCentralDb();
    res.status(200).setHeader('Content-Type', 'application/json').json({
      success: true,
      timestamp: new Date().toISOString(),
      data: db
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/central-db/sync', (req, res) => {
  try {
    const incoming = req.body || {};
    const db = readCentralDb();

    // Merge or upsert keys from incoming batch
    for (const [key, value] of Object.entries(incoming)) {
      if (Array.isArray(value)) {
        if (!db[key]) db[key] = [];
        // Merge arrays by ID or item equality
        const map = new Map();
        db[key].forEach((item: any) => {
          const id = item?.id || item?.admissionNumber || item?.staffId || JSON.stringify(item);
          map.set(id, item);
        });
        value.forEach((item: any) => {
          const id = item?.id || item?.admissionNumber || item?.staffId || JSON.stringify(item);
          map.set(id, item);
        });
        db[key] = Array.from(map.values());
      } else if (value && typeof value === 'object') {
        if (!db[key] || typeof db[key] !== 'object') db[key] = {};
        db[key] = { ...db[key], ...value };
      } else {
        db[key] = value;
      }
    }

    writeCentralDb(db);

    res.status(200).setHeader('Content-Type', 'application/json').json({
      success: true,
      message: 'Central DB batch synchronized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
const connectedDevicesMap = new Map();

// POST /api/devices/heartbeat
app.post('/api/devices/heartbeat', (req, res) => {
  try {
    const { deviceId, teacherName, role, ipAddress, appVersion, batteryLevel, pendingSyncCount } = req.body;
    
    if (!deviceId) {
      return res.status(400).setHeader('Content-Type', 'application/json').json({ success: false, message: 'deviceId is required' });
    }

    const deviceData = {
      deviceId,
      teacherName: teacherName || 'Teacher',
      role: role || 'Teacher',
      ipAddress: ipAddress || req.ip || '192.168.1.50',
      appVersion: appVersion || 'v1.0.0',
      batteryLevel: typeof batteryLevel === 'number' ? batteryLevel : 100,
      pendingSyncCount: typeof pendingSyncCount === 'number' ? pendingSyncCount : 0,
      lastSeen: new Date(),
      status: 'Online'
    };

    connectedDevicesMap.set(deviceId, deviceData);

    res.status(200).setHeader('Content-Type', 'application/json').json({
      success: true,
      message: 'Heartbeat received successfully',
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/devices
app.get('/api/admin/devices', (req, res) => {
  try {
    const now = new Date();
    const devices = [];

    for (const [deviceId, device] of connectedDevicesMap.entries()) {
      const diffSeconds = (now.getTime() - new Date(device.lastSeen).getTime()) / 1000;
      // If no heartbeat in over 40 seconds, set status to Offline
      const status = diffSeconds > 40 ? 'Offline' : 'Online';

      devices.push({
        ...device,
        status,
        lastSeen: device.lastSeen.toISOString()
      });
    }

    res.json({
      success: true,
      count: devices.length,
      activeCount: devices.filter(d => d.status === 'Online').length,
      devices
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// HEALTH CHECK ROUTE
// ============================================
app.get('/api/ping', (req, res) => {
  res.status(200).setHeader('Content-Type', 'application/json').json({
    status: 'online',
    message: 'Connected to Admin Server',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'LAN server running',
    timestamp: new Date()
  });
});

// ============================================
// NETWORK INFO ROUTE
// ============================================
app.get('/api/network-info', (req, res) => {
  const interfaces = os.networkInterfaces();
  let primaryIp = '0.0.0.0';
  let allIps = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        allIps.push({
          interface: name,
          address: iface.address,
          netmask: iface.netmask,
          mac: iface.mac
        });

        const isWifi = /wlan|wifi|wireless|en[0-9]/i.test(name);
        if (isWifi && primaryIp === '0.0.0.0') {
          primaryIp = iface.address;
        } else if (primaryIp === '0.0.0.0') {
          primaryIp = iface.address;
        }
      }
    }
  }

  res.json({
    success: true,
    data: {
      primaryIp,
      allInterfaces: allIps,
      hostname: os.hostname(),
      platform: os.platform(),
      timestamp: new Date().toISOString()
    }
  });
});

// ============================================
// AUTH & USERS API ENDPOINTS
// ============================================

// GET /api/users
app.get('/api/users', (req, res) => {
  const db = readUsersDb();
  const sanitized = db.users.map(({ passwordHash, password, ...u }) => u);
  res.json({ success: true, users: sanitized });
});

// POST /api/users (Admin staff creation)
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, name, role, staffCategory, department } = req.body;
    const db = readUsersDb();

    if (!username && !email) {
      return res.status(400).json({ success: false, message: 'Username or email is required' });
    }

    const existing = db.users.find(
      (u) =>
        (username && u.username && u.username.toLowerCase() === username.toLowerCase()) ||
        (email && u.email && u.email.toLowerCase() === email.toLowerCase())
    );

    if (existing) {
      return res.status(400).json({ success: false, message: 'Staff user with this username or email already exists' });
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const newUser = {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      username: username || email.split('@')[0],
      email: email || `${username}@munyaka.sc.ke`,
      name: name || username || 'New Staff',
      role: role || 'TEACHER',
      staffCategory: staffCategory || 'TEACHING',
      department: department || 'ACADEMIC',
      passwordHash,
      mustChangePassword: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeUsersDb(db);

    const { passwordHash: _, password: __, ...safeUser } = newUser;
    res.json({
      success: true,
      user: safeUser,
      tempPassword, // Return plain text temporary password so Admin UI can display it
      mustChangePassword: true
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login or /api/login
app.post(['/api/auth/login', '/api/login'], async (req, res) => {
  try {
    const { identifier, username, email, password } = req.body;
    const loginKey = (identifier || username || email || '').trim().toLowerCase();
    const pwd = password || '';

    if (!loginKey || !pwd) {
      return res.status(400).json({ success: false, message: 'Username/email and password are required' });
    }

    const db = readUsersDb();
    const user = db.users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === loginKey) ||
        (u.email && u.email.toLowerCase() === loginKey)
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    let passwordMatch = false;
    if (user.passwordHash) {
      passwordMatch = await bcrypt.compare(pwd, user.passwordHash);
    } else if (user.password) {
      passwordMatch = (pwd === user.password);
    }

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      mustChangePassword: !!user.mustChangePassword
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // If mustChangePassword is true, return mustChangePassword: true and tempToken
    if (user.mustChangePassword) {
      return res.json({
        success: true,
        mustChangePassword: true,
        tempToken: token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          staffCategory: user.staffCategory,
          department: user.department
        }
      });
    }

    const { passwordHash: _, password: __, ...safeUser } = user;
    res.json({
      success: true,
      mustChangePassword: false,
      token,
      user: safeUser
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const { newPassword, tempToken } = req.body;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : tempToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token is required' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const db = readUsersDb();
    const userIndex = db.users.findIndex((u) => u.id === decoded.id);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    db.users[userIndex].passwordHash = newPasswordHash;
    db.users[userIndex].mustChangePassword = false;
    db.users[userIndex].updatedAt = new Date().toISOString();
    delete db.users[userIndex].password; // clear any legacy plaintext

    writeUsersDb(db);

    const user = db.users[userIndex];
    const newToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        mustChangePassword: false
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, password: __, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Password updated successfully',
      token: newToken,
      user: safeUser
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, HOST, () => {
  const localIP = (() => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  })();

  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║        MUNYAKA LAN SCHOOL MANAGEMENT SERVER ONLINE                   ║');
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log(`║  Local URL:        http://localhost:${PORT}`.padEnd(71) + '║');
  console.log(`║  Network URL:      http://${localIP}:${PORT}`.padEnd(71) + '║');
  console.log(`║  Health check:     http://${localIP}:${PORT}/api/ping`.padEnd(71) + '║');
  console.log(`║  Users API:        http://${localIP}:${PORT}/api/users`.padEnd(71) + '║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
});
