"use client";

export interface SessionAttendance {
  status: string; // 'P' | 'A' | 'L' (Present, Absent, Late)
  time: string;
}

export interface StudentAttendance {
  morning?: SessionAttendance;
  afternoon?: SessionAttendance;
}