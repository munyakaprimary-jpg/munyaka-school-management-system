"use client";

import React from "react";
import { useSearchParams } from "react-router-dom";
import TeacherGradingDashboard from "@/components/assessments/TeacherGradingDashboard";

/**
 * Grading & Marks page.
 * Reads `?id=` to pre-select a specific assessment in the grading dashboard.
 */
const TeacherGradingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get("id") || undefined;

  return <TeacherGradingDashboard preselectedAssessmentId={preselectedId} />;
};

export default TeacherGradingPage;
