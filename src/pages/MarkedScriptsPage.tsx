/**
 * MarkedScriptsPage
 *
 * Full-page wrapper for the Marked Scripts management view.
 * Used by the `/assessments/marked-scripts` route.
 */
import React from "react";
import MarkedScriptsList from "@/components/assessments/MarkedScriptsList";

const MarkedScriptsPage: React.FC = () => {
  return <MarkedScriptsList />;
};

export default MarkedScriptsPage;
