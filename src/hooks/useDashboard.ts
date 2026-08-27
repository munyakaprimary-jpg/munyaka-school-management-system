import { useState, useEffect, useCallback } from 'react';
import { DashboardService, DashboardMetrics } from '@/services/dashboard-service';

export const useDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await DashboardService.fetchAllMetrics();
      setMetrics(data);
      setLastSync(data.lastSync);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(message);
      // Set fallback to indicate offline state with safe defaults
      setMetrics({
        totalStudents: 0,
        totalTeachers: 0,
        todaysAttendanceRate: null,
        attendanceTrend: [
          { day: 'Mon', rate: 0, isFactual: false },
          { day: 'Tue', rate: 0, isFactual: false },
          { day: 'Wed', rate: 0, isFactual: false },
          { day: 'Thu', rate: 0, isFactual: false },
          { day: 'Fri', rate: 0, isFactual: false }
        ],
        classParticipation: [],
        recentAlerts: [
          {
            id: 'fallback-1',
            time: '—',
            msg: 'No recent activity',
            type: 'system',
            color: 'bg-slate-500'
          }
        ],
        isLive: false,
        lastSync: format(new Date(), 'HH:mm:ss')
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const refresh = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    lastSync,
    isLive: metrics?.isLive ?? false,
    refresh
  };
};