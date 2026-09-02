# Munyaka LAN School Management Server

A lightweight Node.js/Express server with SQLite database for LAN-based school management.

## Quick Start

```bash
cd server
npm install
npm start
```

The server runs on port **5000** by default.

## Features

- **RESTful API** for Students, Teachers, Attendance, and Fees
- **SQLite database** stored locally in `data/school.db`
- **Device tracking** for connected mobile devices
- **Offline sync queue** for data entered on disconnected devices
- **Database backup/restore** via JSON export

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List all students |
| POST | `/api/students` | Create new student |
| GET | `/api/students/:id` | Get student details |
| PUT | `/api/students/:id` | Update student |
| GET | `/api/teachers` | List all teachers |
| POST | `/api/teachers` | Create new teacher |
| PUT | `/api/teachers/:id` | Update teacher |
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
| GET | `/api/backup` | Export database backup |
| POST | `/api/backup/restore` | Restore from backup |
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/server/info` | Server connection info |

## Connecting from Mobile APK

1. Find the Admin PC's IP address (displayed in the Admin Dashboard)
2. Open Settings in the mobile app
3. Enter the IP address (e.g., `192.168.1.100`)
4. Tap "Test Connection" to verify
5. The app will sync data via `http://{IP}:5000/api`

## Database Location

`data/school.db` — automatically created on first run.