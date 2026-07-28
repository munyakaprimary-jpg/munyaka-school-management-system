"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BackButton from '@/components/ui/BackButton';
import { UserPlus, Phone, Briefcase, MoreHorizontal } from 'lucide-react';
import { STAFF } from '@/lib/mock-data';

const Staff = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton fallback="/" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff & Personnel</h1>
            <p className="text-sm text-slate-500">Manage teachers, administrators, and support personnel.</p>
          </div>
        </div>
        <Link to="/staff/registration">
          <Button className="h-10 px-4 rounded-lg gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm">
            <UserPlus size={16} /> Add Staff Member
          </Button>
        </Link>
      </div>

      {/* Compact 4-Column Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {STAFF.map((member) => (
          <Card key={member.id} className="rounded-xl bg-white border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all group overflow-hidden flex flex-col justify-between">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="w-11 h-11 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <Badge className={
                  member.status === 'Active' 
                  ? "bg-emerald-50 text-emerald-700 border-none text-xs px-2 py-0.5 rounded-md font-medium" 
                  : "bg-slate-100 text-slate-500 border-none text-xs px-2 py-0.5 rounded-md font-medium"
                }>
                  {member.status}
                </Badge>
              </div>

              <div className="mb-3">
                <h3 className="text-base font-bold text-slate-900 truncate">{member.name}</h3>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mt-0.5">{member.role}</p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Briefcase size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{member.subjects.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{member.phone}</span>
                </div>
              </div>
            </CardContent>

            <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center">
              <Link to={`/staff/${member.id}`}>
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-slate-600 hover:text-indigo-600 p-0 h-auto">
                  View Profile
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600">
                <MoreHorizontal size={14} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Staff;