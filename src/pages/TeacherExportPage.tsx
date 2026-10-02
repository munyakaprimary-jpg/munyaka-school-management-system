import React from 'react';
import TeacherExportModule from '@/components/teacher/TeacherExportModule';

export const TeacherExportPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full font-sans p-6 md:p-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Teacher Class Package Export
          </h1>
          <p className="text-blue-100 text-sm md:text-base max-w-xl font-medium">
            Bundle your local offline records—attendance, check-ins, CBC assessment rubrics, and inventory assignments—into a secure JSON file for administrator harmonization.
          </p>
        </div>
      </div>

      <TeacherExportModule />
    </div>
  );
};

export default TeacherExportPage;
