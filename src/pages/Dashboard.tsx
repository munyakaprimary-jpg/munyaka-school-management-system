"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, GraduationCap, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ATTENDANCE_TREND } from '@/lib/mock-data';
import AcademicYearAlertBanner from '@/components/AcademicYearAlertBanner';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { academicYear, promotionsCompleted } = useAcademicYear();
  const currentYear = new Date().getFullYear();
  const promotionNeeded = academicYear !== currentYear || !promotionsCompleted;
  const [showBanner, setShowBanner] = useState(true);
  const navigate = useNavigate();

  // Initialize banner visibility
  useEffect(() => {
    setShowBanner(promotionNeeded);
  }, [academicYear, promotionsCompleted, currentYear]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h1>
            <p className="text-muted-foreground">System vitals for Munyaka Primary and Junior School.</p>
          </div>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Sync Enabled</span>
        </div>
      </div>

      {/* Show banner if promotion is needed */}
      {promotionNeeded && (
        <AcademicYearAlertBanner onPromote={() => navigate('/promote-students')} />
      )}

      {/* Rest of the dashboard content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ... existing cards ... */}
      </div>
    </div>
  );
};

export default Dashboard;