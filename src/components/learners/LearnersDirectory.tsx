"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  UserPlus, 
  Trash2, 
  GraduationCap, 
  Users,
  FileSpreadsheet,
  Eye,
  AlertCircle
} from 'lucide-react';
import { getStoredLearners, removeStoredLearner } from '@/utils/learnersStore';
import { showSuccess, showError } from '@/utils/toast';

interface LearnersDirectoryProps {
  onRegisterClick: () => void;
  onTransferInClick: () => void;
}

export default function LearnersDirectory({
  onRegisterClick,
  onTransferInClick,
}: LearnersDirectoryProps) {
  const navigate = useNavigate();
  const [learners, setLearners] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  const loadLearners = () => {
    try {
      const stored = getStoredLearners() || [];
      const rawDb = localStorage.getItem('munyaka_central_db');
      const db = rawDb ? JSON.parse(rawDb) : {};
      const centralStudents = Array.isArray(db?.students) ? db.students : [];
      const munyakaStudents = JSON.parse(localStorage.getItem('munyaka_learners_v2') || localStorage.getItem('munyaka_learners') || '[]');

      const combined = [...stored, ...centralStudents, ...munyakaStudents];
      
      // Deduplicate and filter out corrupt/test stubs like MUN-9455-2026 if present
      const uniqueMap = new Map();
      for (const l of combined) {
        if (!l) continue;
        const idStr = String(l.id || l.admNo || l.admissionNumber || '');
        const admStr = String(l.admissionNumber || l.admissionNo || l.admNo || '');
        
        if (/^MUN-9455-2026$/i.test(idStr) || /^MUN-9455-2026$/i.test(admStr)) {
          continue;
        }

        const key = l.id || admStr || l.name;
        if (key && !uniqueMap.has(key)) {
          uniqueMap.set(key, l);
        }
      }

      setLearners(Array.from(uniqueMap.values()));
    } catch (e) {
      console.error('[LearnersDirectory] Failed to load learners:', e);
      setLearners([]);
    }
  };

  useEffect(() => {
    loadLearners();
    const handleUpdate = () => loadLearners();
    window.addEventListener('learners_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('learners_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const filteredLearners = useMemo(() => {
    return learners.filter((l) => {
      if (!l) return false;
      const name = String(l.name || l.fullName || (l.firstName && l.lastName ? `${l.firstName} ${l.lastName}` : l.firstName) || '').toLowerCase();
      const adm = String(l.admissionNumber || l.admissionNo || l.admNo || l.id || '').toLowerCase();
      const assessment = String(l.assessmentNumber || l.assessmentNo || l.assessment || l.birthCertificateNo || '').toLowerCase();
      
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || name.includes(q) || adm.includes(q) || assessment.includes(q);

      const gradeStr = String(l.grade || '').toLowerCase();
      const matchesGrade = gradeFilter === 'ALL' || gradeStr.includes(gradeFilter.toLowerCase());

      const status = String(l.status || 'Active').toLowerCase();
      const isActive = status !== 'transferred' && status !== 'graduated' && status !== 'suspended';

      return matchesSearch && matchesGrade && isActive;
    });
  }, [learners, searchQuery, gradeFilter]);

  const requestDelete = (learner: any) => {
    const id = learner.id || learner.admissionNumber || learner.admissionNo;
    if (!id) return;
    if (window.confirm(`Are you sure you want to remove ${learner.name || 'this learner'} from the directory?`)) {
      removeStoredLearner(id);
      loadLearners();
      showSuccess(`Removed ${learner.name || 'learner'} from directory.`);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Learners Directory</h2>
          <p className="text-sm font-medium text-slate-500">Manage enrolled students, profiles, and records.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onRegisterClick}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-sm"
          >
            <UserPlus size={16} /> Register Learner
          </Button>
          <Button
            onClick={onTransferInClick}
            variant="outline"
            className="rounded-xl border-slate-200 font-bold gap-2 text-slate-700 hover:bg-slate-50"
          >
            <GraduationCap size={16} /> Transfer In
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-none shadow-sm rounded-3xl bg-white p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search by name, admission no, or assessment/NEMIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'].map((g) => (
              <button
                key={g}
                onClick={() => setGradeFilter(g)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  gradeFilter === g
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Clean Learners Table */}
      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[11px] font-black border-b border-slate-100">
                <th className="py-4 px-6">ADMISSION NO.</th>
                <th className="py-4 px-6">ASSESSMENT NO.</th>
                <th className="py-4 px-6">FULL NAME</th>
                <th className="py-4 px-6">GRADE & STREAM</th>
                <th className="py-4 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-400">
                        <Users size={32} />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">No learners found</h3>
                      <p className="text-xs text-slate-500">
                        {searchQuery || gradeFilter !== 'ALL'
                          ? 'No learners match your search criteria.'
                          : 'Get started by registering a new learner or transferring one in.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLearners.map((learner, idx) => {
                  const fullName = learner.name || learner.fullName || (learner.firstName && learner.lastName ? `${learner.firstName} ${learner.lastName}` : (learner.firstName || 'Unnamed Learner'));
                  const admNo = learner.admissionNumber || learner.admissionNo || learner.admNo || '—';
                  const assessmentNo = learner.assessmentNumber || learner.assessmentNo || learner.assessment || learner.birthCertificateNo || '—';
                  const rawGrade = String(learner.grade || '').trim();
                  const gradeStream = rawGrade
                    ? (rawGrade.toLowerCase().startsWith('grade') ? `${rawGrade} • ${learner.stream || 'North'}` : `Grade ${rawGrade} • ${learner.stream || 'North'}`)
                    : (learner.stream || '—');
                  const lookupKey = learner.id || admNo || assessmentNo;

                  return (
                    <tr key={learner.id || admNo || idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900 text-xs">
                        {admNo}
                      </td>
                      <td className="py-4 px-6 font-mono font-medium text-slate-600 text-xs">
                        {assessmentNo}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {fullName}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="outline" className="font-bold text-[11px] bg-slate-50 border-slate-200 text-slate-700 rounded-lg px-2.5 py-0.5">
                          {gradeStream}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/students/${encodeURIComponent(lookupKey)}`)}
                            className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => requestDelete(learner)}
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                            title="Remove Learner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
