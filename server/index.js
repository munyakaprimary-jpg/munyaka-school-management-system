// LAN School Management System - Express Backend Server
// Clean local Wi-Fi configuration
// Run with: node server/index.js
// First install: cd server && npm install

import express from 'express';
import cors from 'cors';
import os from 'os';

const PORT = 5000;
const HOST = '0.0.0.0';

// Initialize Express
const app = express();

// CORS middleware configured for local network origins
// Allows: http://localhost, capacitor://localhost, and LAN IP subnets (192.168.x.x, 10.x.x.x)
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow localhost and capacitor://localhost
    if (origin === 'http://localhost' || origin === 'capacitor://localhost') {
      return callback(null, true);
    }

    // Allow any http://localhost:PORT
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // Allow LAN IP subnets: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
    const lanIpRegex = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
    if (lanIpRegex.test(origin)) {
      return callback(null, true);
    }

    // Allow any http:// IP address (for other local networks)
    const anyIpRegex = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/;
    if (anyIpRegex.test(origin)) {
      return callback(null, true);
    }

    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 86400, // cache preflight for 24h
};

app.use(cors(corsOptions));

// Explicit preflight handler
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));

// ============================================
// HEALTH CHECK ROUTE
// ============================================
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'online',
    message: 'Connected to Admin Server',
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

        // Prefer Wi-Fi interfaces (common names: wlan, wifi, wireless, en0, en1)
        const isWifi = /wlan|wifi|wireless|en[0-9]/i.test(name);
        if (isWifi && primaryIp === '0.0.0.0') {
          primaryIp = iface.address;
        }
        // Fallback to first non-internal IPv4
        else if (primaryIp === '0.0.0.0') {
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
    return '0.0.0.0';
  })();

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           MUNYAKA LAN SCHOOL MANAGEMENT SERVER                ║
╠══════════════════════════════════════════════════════════════╣
║  Server binding:  http://${HOST}:${PORT}
║  Local access:     http://localhost:${PORT}
║  Network access:   http://${localIP}:${PORT}
║  Health check:     http://${localIP}:${PORT}/api/ping
║  Network info:     http://${localIP}:${PORT}/api/network-info
╠══════════════════════════════════════════════════════════════╣
║  CORS: Enabled for localhost, capacitor://localhost,         ║
║        and all LAN IP subnets (192.168.x.x, 10.x.x.x,       ║
║        172.16-31.x.x)                                        ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;