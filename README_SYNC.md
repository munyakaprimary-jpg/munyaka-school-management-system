# Offline-First Wi-Fi Synchronization System

## Overview
This system enables teacher devices to work completely offline, saving all actions locally to SQLite, then automatically synchronizing with the admin host when connected to the school Wi-Fi network.

## Architecture

### Client Layer (Teacher App)
1. **SQLite Database** (`src/lib/offline-db.ts`)
   - `sync_queue` table for pending operations
   - Local caches for attendance, marks, staff check-ins
   - Automatic retry with exponential backoff

2. **Sync Engine** (`src/services/sync-engine.ts`)
   - Background service running every 10 seconds
   - Network state detection via Capacitor Network plugin
   - Batch uploads of 50 items to admin endpoint
   - Automatic conflict detection

3. **UI Components**
   - `SyncStatusHeader` - Real-time sync status indicator
   - `TeacherActionWrapper` - Intercepts form submissions
   - `useOfflineSync` hook - React integration

### Server Layer (Admin Host)
1. **Express Server** (`admin-server.js`)
   - Runs on port 3000, bound to 0.0.0.0
   - `POST /api/sync` endpoint for batch processing
   - SQLite database for persistence
   - WebSocket server for real-time dashboard updates

2. **Conflict Resolution**
   - Last-Write-Wins (LWW) for marks using ISO timestamps
   - Append-only audit trail for attendance
   - Manual conflict resolution via admin dashboard

3. **Admin Dashboard** (`src/pages/AdminDashboard.tsx`)
   - Live sync feed
   - Conflict resolution table
   - Audit trail viewer
   - Network configuration panel

## Data Flow

```
Teacher Action → Local SQLite → sync_queue (PENDING)
                    ↓
            Background Sync Engine (10s interval)
                    ↓
            Network Available? → Yes → POST /api/sync (batch of 50)
                    ↓
            Admin Server Processes:
            - LWW for marks
            - Append-only for attendance
            - Audit trail logging
                    ↓
            Response: { syncedIds: [...] }
                    ↓
            Client: DELETE synced IDs from sync_queue
                    ↓
            Toast: "Sync Complete: Uploaded X records"
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Client
```bash
npm run build
npx cap sync android
```

### 3. Start Admin Server
```bash
npm run admin:server
```
Server will start on port 3000, accessible at `http://<admin-ip>:3000`

### 4. Configure Teacher Devices
Set the sync endpoint on each teacher device:
```
SYNC_ENDPOINT=http://192.168.x.x:3000/api/sync
```

### 5. Run Android App
```bash
npx cap run android
```

## API Endpoints

### Admin Server
- `POST /api/sync` - Batch sync endpoint
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/conflicts` - Pending conflicts
- `POST /api/admin/conflicts/:id/resolve` - Resolve conflict
- `GET /api/admin/audit` - Audit trail
- `GET /health` - Health check

### Sync Payload Format
```json
{
  "items": [
    {
      "id": 1,
      "type": "marks",
      "data": {
        "action": "marks",
        "data": {
          "student_id": "123",
          "subject_id": "math",
          "exam_type": "endterm",
          "term": "term1",
          "academic_year": "2024",
          "score": 85,
          "timestamp": "2024-01-15T10:30:00Z",
          "device_id": "device_abc123",
          "teacher_id": "teacher_001"
        },
        "timestamp": "2024-01-15T10:30:00Z",
        "device_id": "device_abc123",
        "teacher_id": "teacher_001"
      }
    }
  ]
}
```

## Conflict Resolution Rules

### Marks (Last-Write-Wins)
- Compare `updated_at` timestamps
- Newer timestamp wins
- Conflicts flagged for manual review if timestamps equal

### Attendance (Append-Only)
- All entries preserved
- No overwrites
- Duplicate prevention via unique constraints

### Audit Trail
- Every modification logged
- Old and new values stored
- Immutable once written

## Monitoring

### Sync Status Indicators
- 🟢 Green: All synced
- 🟠 Orange: X items pending
- 🟡 Yellow: Syncing in progress
- 🔴 Red: Offline

### Admin Dashboard Metrics
- Total synced today
- Active teachers
- Pending conflicts
- Real-time sync feed

## Troubleshooting

### Sync Not Working
1. Check admin server is running: `curl http://<admin-ip>:3000/health`
2. Verify teacher device on same Wi-Fi network
3. Check sync endpoint configuration
4. Review browser console for errors

### Conflicts Not Resolving
1. Check admin dashboard conflicts tab
2. Verify timestamp format (ISO 8601)
3. Ensure device clocks are synchronized

### Database Issues
1. Clear app data to reset SQLite
2. Check storage permissions
4. Verify Capacitor SQLite plugin installed

## Security Considerations
- Admin server should only be accessible on school Wi-Fi
- Consider adding API key authentication for production
- Use HTTPS in production with valid certificates
- Regular database backups recommended