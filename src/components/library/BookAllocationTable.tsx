"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookAllocation, ConditionStatus, ConditionReturnStatus, BookAllocationStatus } from '@/types/library';
import { MOCK_BOOK_ALLOCATIONS } from '@/lib/library-data';
import { Eye, Trash2 } from 'lucide-react';

interface BookAllocationFiltersProps {
  gradeFilter: string;
  streamFilter: string;
  searchTerm: string;
  onGradeChange: (grade: string) => void;
  onStreamChange: (stream: string) => void;
  onSearchChange: (term: string) => void;
  onClearFilters: () => void;
  grades: string[];
  streams: string[];
}

const BookAllocationTable: React.FC<BookAllocationFiltersProps> = ({
  gradeFilter,
  streamFilter,
  searchTerm,
  onGradeChange,
  onStreamChange,
  onSearchChange,
  onClearFilters,
  grades,
  streams
}) => {
  const [filteredLogs, setFilteredLogs] = useState<BookAllocation[]>(MOCK_BOOK_ALLOCATIONS);

  // Filter logs based on current filters
  useEffect(() => {
    const filtered = MOCK_BOOK_ALLOCATIONS.filter(log => {
      const matchesSearch = !searchTerm || 
        log.borrower_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.book_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.accession_no.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGrade = gradeFilter === 'all' || log.grade === gradeFilter;
      const matchesStream = streamFilter === 'all' || log.stream === streamFilter;
      
      return matchesSearch && matchesGrade && matchesStream;
    });
    setFilteredLogs(filtered);
  }, [searchTerm, gradeFilter, streamFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleGradeChange = (grade: string) => {
    onGradeChange(grade);
  };

  const handleStreamChange = (stream: string) => {
    onStreamChange(stream);
  };

  const handleClearFilters = () => {
    onGradeChange('all');
    setStreamFilter('');
    setSearchTerm('');
    onClearFilters();
  };

  const filteredLogs = useMemo(() => filteredLogs, [filteredLogs]);

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
      <CardHeader className="p-6 border-b bg-slate-50/50">
        <CardTitle className="text-lg font-black text-slate-900">Book Allocation & Condition Matrix</CardTitle>
        <p className="text-sm text-slate-500">Track active borrowers, book conditions, and status across grades and streams.</p>
      </CardHeader>

      <CardContent className="p-6">
        {/* Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Search</Label>
                    <Input
                      placeholder="Search by name, accession number, or title..."
                      className="pl-11 h-12 rounded-2xl border-none bg-slate-50 font-bold"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>
        
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Grade</Label>
                    <Select value={gradeFilter} onValueChange={onGradeChange}>
                      <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-700">
                        <SelectValue placeholder="All Grades" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {grades.map(g => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
        
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Stream</Label>
                    <Select value={streamFilter} onValueChange={onStreamChange}>
                      <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-slate-700">
                        <SelectValue placeholder="All Streams" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="all">All Streams</SelectItem>
                        {streams.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 border-r">Borrower Details</th>
              <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-r">Book</th>
              <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-r">Issued</th>
              <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-r">Condition</th>
              <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-center border-r">Status</th>
              <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, i) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700">{log.borrower_name}</span>
                      <span className="text-sm text-slate-400">{log.grade} • {log.stream}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{log.book_title}</span>
                      <span className="text-sm text-slate-400">{log.accession_no}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">Date: {log.date_issued}</span>
                      <span className="text-sm text-slate-400">Due: {log.due_date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <Badge variant="outline" className={cn(
                      "rounded-lg border-none",
                      log.condition_on_issue === 'New' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                      log.condition_on_issue === 'Good' && 'bg-blue-50 text-blue-700 border-blue-100',
                      log.condition_on_issue === 'Fair' && 'bg-amber-50 text-amber-700',
                      log.condition_on_issue === 'Damaged' && 'bg-rose-50 text-rose-700'
                    )}>
                      {log.condition_on_issue}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <Badge variant="outline" className={cn(
                      "rounded-lg border-none",
                      log.status === 'Active' && "bg-emerald-50 text-emerald-700",
                      log.status === 'Returned' && 'bg-gray-200 text-gray-600',
                      log.status === 'Overdue' && 'bg-rose-50 text-rose-700',
                      log.status === 'Lost' && 'bg-red-500 text-red-600',
                      'bg-slate-200 text-slate-400'
                    )}>
                      {log.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => onProcessReturn(log.id)}
                                          className="rounded-lg h-8 w-8 p-0 text-slate-400 hover:bg-indigo-50"
                                          title="View Details"
                                        >
                                          <Eye size={14} />
                                        </Button>
                                                                              </div>
                                                                            </td>
                                                          </tr>
                                                        ))}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                </Card>
                                              </div>
                                            </div>
                                          );
                                        };
                                        
                                        export default BookAllocationTable;