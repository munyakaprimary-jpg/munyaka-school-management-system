/**
 * Dashboard Service — LOCAL SERVER VERSION
 *
 * All PocketBase SDK calls have been replaced with direct fetch() calls
 * to the local LAN Express server (http://localhost:5000).
 *
 * The unified /api/dashboard/stats endpoint returns everything in a
 * single round-trip so the admin dashboard never needs to know about
 * PocketBase, Supabase, or any external service.
 */

// ─── Types (unchanged from PocketBase version) ────────────────────────────────

export interface DashboardStats {
  totalActiveStudents: number;
  totalActiveTeachers: number;
  todayAttendancePercentage: number;
  weeklyAttendanceTrend: WeeklyAttendancePoint[];
  classParticipation: ClassParticipation[];
  recentAlerts: RecentAlert[];
}

export interface WeeklyAttendancePoint {
  day: string;   // Mon, Tue, Wed, Thu, Fri
  date: string;  // YYYY-MM-DD
  rate: number;  // 0–100
  isToday: boolean;
}

export interface ClassParticipation {
  className: string;
  totalEnrolled: number;
  presentToday: number;
  attendanceRate: number;
}

export interface RecentAlert {
  id: string;
  type: 'fee_receipt' | 'roll_call' | 'student_registration' | 'staff_attendance' | 'general';
  message: string;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}

// ─── Server communication ──────────────────────────────────────────────────────

/** Resolve the LAN server base URL, with fallback to localhost for dev. */
const getServerUrl = (): string => {
  try {
    const configured = localStorage.getItem('lan_server_url');
    if (configured && String(configured || '').trim()) return String(configured || '').trim();
    const legacy = localStorage.getItem('munyaka_lan_server_url');
    if (legacy && String(legacy || '').trim()) return String(legacy || '').trim();
  } catch { /* ignore */ }
  // Development fallback: try to connect to the Vite dev server proxy
  return 'http://localhost:5000';
};

/** Fetch JSON from the LAN server, returning null on any network/error. */
const serverGet = async <T = unknown>(path: string): Promise<T | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`${getServerUrl()}${path}`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const json = await response.json() as T;
    return json;
  } catch {
    return null;
  }
};

// ─── Service ───────────────────────────────────────────────────────────────────

class DashboardService {
  /**
   * Returns the complete dashboard stats object in a single API call.
   * The server aggregates all counts server-side — no client-side joins needed.
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const result = await serverGet<{ success?: boolean; data?: Partial<DashboardStats> }>(
      '/api/dashboard/stats'
    );

    if (result?.success && result.data) {
      return {
        totalActiveStudents: result.data.totalActiveStudents ?? 0,
        totalActiveTeachers: result.data.totalActiveTeachers ?? 0,
        todayAttendancePercentage: result.data.todayAttendancePercentage ?? 0,
        weeklyAttendanceTrend: result.data.weeklyAttendanceTrend ?? this.getEmptyWeeklyTrend(),
        classParticipation: result.data.classParticipation ?? [],
        recentAlerts: result.data.recentAlerts ?? [],
      };
    }

    // Server unreachable — fall back to local seed data
    console.warn('[DashboardService] LAN server unreachable — using seed data fallback');
    return this.getSeedFallback();
  }

  // ── Individual getters (used directly by components that need one metric) ──

  async getTotalActiveStudents(): Promise<number> {
    const result = await serverGet<{ success?: boolean; data?: { totalActiveStudents?: number } }>(
      '/api/dashboard/stats'
    );
    return result?.data?.totalActiveStudents ?? 0;
  }

  async getTotalActiveTeachers(): Promise<number> {
    const result = await serverGet<{ success?: boolean; data?: { totalActiveTeachers?: number } }>(
      '/api/dashboard/stats'
    );
    return result?.data?.totalActiveTeachers ?? 0;
  }

  async getTodayAttendancePercentage(): Promise<number> {
    const result = await serverGet<{ success?: boolean; data?: { todayAttendancePercentage?: number } }>(
      '/api/dashboard/stats'
    );
    return result?.data?.todayAttendancePercentage ?? 0;
  }

  async getWeeklyAttendanceTrend(): Promise<WeeklyAttendancePoint[]> {
    const result = await serverGet<{ success?: boolean; data?: { weeklyAttendanceTrend?: WeeklyAttendancePoint[] } }>(
      '/api/dashboard/stats'
    );
    return result?.data?.weeklyAttendanceTrend ?? this.getEmptyWeeklyTrend();
  }

  async getClassParticipation(): Promise<ClassParticipation[]> {
    const result = await serverGet<{ success?: boolean; data?: { classParticipation?: ClassParticipation[] } }>(
      '/api/dashboard/stats'
    );
    return result?.data?.classParticipation ?? [];
  }

  async getRecentAlerts(limit = 5): Promise<RecentAlert[]> {
    const result = await serverGet<{ success?: boolean; data?: { recentAlerts?: RecentAlert[] } }>(
      '/api/dashboard/stats'
    );
    return (result?.data?.recentAlerts ?? []).slice(0, limit);
  }

  // ── Fallbacks ─────────────────────────────────────────────────────────────

  private getEmptyWeeklyTrend(): WeeklyAttendancePoint[] {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const todayISO = new Date().toISOString().split('T')[0];
    return dayNames.map((day, i) => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay() + 1 + i);
      return {
        day,
        date: d.toISOString().split('T')[0],
        rate: 0,
        isToday: d.toISOString().split('T')[0] === todayISO,
      };
    });
  }

  private getSeedFallback(): DashboardStats {
    return {
      totalActiveStudents: 0,
      totalActiveTeachers: 0,
      todayAttendancePercentage: 0,
      weeklyAttendanceTrend: this.getEmptyWeeklyTrend(),
      classParticipation: [],
      recentAlerts: [],
    };
  }
}

export const dashboardService = new DashboardService();
