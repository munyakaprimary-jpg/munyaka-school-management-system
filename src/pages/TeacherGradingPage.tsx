"use client";

import React from "react";
import TeacherGradingDashboard from "@/components/assessments/TeacherGradingDashboard";

/**
 * Grading & Marks page.
 * Wraps the TeacherGradingDashboard component which provides:
 * - Auto-grade MCQs
 * - Manual structured question grading with model answer reference
 * - Total score, percentage, and CBC grade level display
 * - Export marks as CSV
 */
const TeacherGradingPage: React.FC = () => {
  return <TeacherGradingDashboard />;
};

export default TeacherGradingPage;
