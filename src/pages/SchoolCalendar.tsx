"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { showSuccess } from "@/utils/toast";

const SchoolCalendar = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="outline" className="rounded-2xl border-slate-200" onClick={() => showSuccess('Calendar exported!')}>
          Export Ical
        </Button>
        <Button className="rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-100" onClick={() => showSuccess('Event created!')}>
          <Plus size={18} /> New Event
        </Button>
      </div>
    </div>
  );
};

export default SchoolCalendar;