"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: string;
  name: string;
  assessment: string;
  grade: string;
  stream: string;
  phone: string;
  guardian: string;
}

interface StudentTableProps {
  students: Student[];
  onViewProfile: (id: string) => void;
  onDelete: (student: { id: string; name: string }) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  onViewProfile,
  onDelete
}) => {
  const navigate = useNavigate();

  return (
    <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
      <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Learner Master List</CardTitle>
          <p className="text-sm text-slate-500 font-medium">Tabular view for bulk student management.</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold px-4 py-1.5 rounded-xl">
          {students.length} Active Records
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 bg-slate-50/50 border-b">
              <tr>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Learner Name</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Assessment ID</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Class Level</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Stream</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Guardian Contact</th>
                <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{student.name}</p>
                  </td>
                  <td className="px-8 py-5">
                    <code className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase">{student.assessment}</code>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-bold text-slate-700">Grade {student.grade}</span>
                  </td>
                  <td className="px-8 py-5">
                    <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-600 font-bold">
                      {student.stream}
                    </Badge>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{student.phone}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{student.guardian}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        onClick={() => onViewProfile(student.id)}
                        title="View Profile"
                      >
                        <Eye size={18} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        onClick={() => onDelete({ id: student.id, name: student.name })}
                        title="Delete Record"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search size={32} className="text-slate-200" />
                      <p className="text-slate-500 font-bold">No records match the current criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};