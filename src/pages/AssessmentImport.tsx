"use client";

import React from "react";
import CSVAssessmentImporter from "@/components/assessments/CSVAssessmentImporter";

/**
 * Question Bank & Import page.
 * Wraps the CSVAssessmentImporter component which provides:
 * - Download CSV template
 * - Upload & parse CSV
 * - Preview with inline validation
 * - Save to question bank
 */
const AssessmentImport: React.FC = () => {
  return <CSVAssessmentImporter />;
};

export default AssessmentImport;
