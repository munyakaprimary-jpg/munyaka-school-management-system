"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

const SchoolCalendar = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="outline" className="rounded-2xl border-slate-200">
          Export Ical
        </Button>
        <Button className="rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-100">
          <Plus size={18} /> New Event
        </Button>
      </div>
    </div>
  );
};

export default SchoolCalendar;