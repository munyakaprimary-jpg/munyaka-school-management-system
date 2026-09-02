# Munyaka LAN School Management Server

A pure JavaScript Node.js/Express server for LAN-based school management.
**No native compilation required** — uses `sql.js` (SQLite via WebAssembly) so installation works without Python, node-gyp, or C++ build tools.

## Quick Start

```bash
cd server
npm install
npm start
```

The server runs on port **5000** by default.

## Why sql.js Instead of better-sqlite3?

| Feature | sql.js (this server) | better-sqlite3 |
|---------|---------------------|----------------|
| Native compilation | ❌ Not required | ✅ Required |
| Python needed | ❌ No | ✅ Yes |
| node-gyp | ❌ No | ✅ Yes |
| Cross-platform | ✅ Pure JS/WASM | ❌ Per-platform builds |
| Performance | Good for LAN-scale | Faster |

## Features

- **RESTful API** for Students, Teachers, Attendance, Fees, and Users
- **SQLite database** stored locally in `data/school.db`
- **Device tracking** for connected mobile devices with heartbeat
- **Offline sync queue** for entries made on disconnected devices
- **Database backup/restore** via JSON or native SQLite file export
- **Auto-save** every 30 seconds

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List all students |
| POST | `/api/students` | Create new student |
| GET | `/api/students/:id` | Get student details |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |
| GET | `/api/teachers` | List all teachers |
| POST | `/api/teachers` | Create new teacher |
| PUT | `/api/teachers/:id` | Update teacher |
| DELETE | `/api/teachers/:id` | Delete teacher |
| GET | `/api/attendance` | Get attendance records |
| POST | `/api/attendance` | Record attendance |
| POST | `/api/attendance/bulk` | Bulk record attendance |
| GET | `/api/fees` | Get fee records |
| POST | `/api/fees` | Create fee record |
| POST | `/api/fees/:id/payment` | Record fee payment |
| GET | `/api/devices` | List connected devices |
| POST | `/api/devices/register` | Register device |
| POST | `/api/devices/heartbeat` | Device heartbeat |
| POST | `/api/sync` | Sync offline data |
| GET | `/api/stats` | Database statistics |
| GET | `/api/backup` | Export JSON backup |
| GET | `/api/backup/db` | Export SQLite file backup |
| POST | `/api/backup/restore` | Restore from backup |
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/server/info` | Server connection info |
| GET | `/api/health` | Health check |

## Connecting from Mobile APK

1. Find the Admin PC's IP address (displayed in the Admin Dashboard)
2. Open Settings in the mobile app
3. Enter the IP address (e.g., `192.168.1.100`)
4. Tap "Test Connection" to verify
5. The app will sync data via `http://{IP}:5000/api`

## Database Location

`data/school.db` — automatically created on first run, persists across restarts.