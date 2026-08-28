/**
 * Mock attendance data for the StudentProfile consolidated summary.
 * Self-contained so the page works before real attendance records are
 * populated.
 */

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
}

export const attendance: {
  byStudent: Record<string, AttendanceSummary>;
} = {
  byStudent: {
    '1787737452457': {
      present: 42,
      absent: 2,
      late: 1,
    },
  },
};