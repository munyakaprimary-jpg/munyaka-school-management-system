"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import BookAllocationTable from '@/components/library/BookAllocationTable';
import BookReturnModal from '@/components/library/BookReturnModal';
import { PromotionHeader } from '@/components/promote/PromotionHeader';
import { cn } from '@/lib/utils';
import { FileDown, Loader2, X } from 'lucide-react';
import { BookAllocation, ConditionReturnStatus } from '@/types/library';
import { MOCK_BOOK_ALLOCATIONS } from '@/lib/library-data';

const BookAllocation = () => {
  // Filter states
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [streamFilter, setStreamFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string>('');

  // Data
  const [allLogs, setAllLogs] = useState<BookAllocation[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<BookAllocation[]>([]);

  // Load data
  useEffect(() => {
    setAllLogs(MOCK_BOOK_ALLOCATIONS);
    setFilteredLogs(MOCK_BOOK_ALLOCATIONS);
  }, []);

  // Filtering
  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      const matchesSearch = !searchTerm || 
        log.borrower_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.book_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.accession_no.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGrade = gradeFilter === 'all' || log.grade === gradeFilter;
      const matchesStream = streamFilter === 'all' || log.stream === streamFilter;
      
      return matchesSearch && matchesGrade && matchesStream;
    });
  }, [searchTerm, gradeFilter, streamFilter]);

  // Export handler
  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      showSuccess('Exported book allocation matrix!');
      setIsExporting(false);
    }, 800);
  };

  const handleClearFilters = () => {
    setGradeFilter('all');
    setStreamFilter('all');
    setSearchTerm('');
  };

  // Return handler
  const handleOpenReturnModal = (logId: string) => {
    setSelectedLogId(logId);
  };

  const handleProcessReturn = () => {
    if (selectedLogId) {
      setIsProcessingReturn(true);
      setTimeout(() => {
        setIsProcessingReturn(false);
        showSuccess(`Processed return for ${selectedLogId}`);
        setSelectedLogId('');
      }, 1000);
    }
  };

  // Get unique grades and streams for filters
  const grades = useMemo(() => {
    return [...new Set(allLogs.map(l => log.grade))].sort();
  }, [allLogs]);

  const streams = useMemo(() => {
    return [...new Set(allLogs.map(l => log.stream))].sort();
  }, [allLogs]);

  // Render
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <PromotionHeader onPromoteClick={() => setIsProcessingReturn(true)} />

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Search</Label>
            <Input 
              placeholder="Search by name, accession number, or title..." 
              className="pl-11 h-12 rounded-2xl border-none shadow-sm font-bold" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Grade</Label>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
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

          <div className="space-y-1">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Stream</Label>
            <Select value={streamFilter} onValueChange={setStreamFilter}>
              <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold text-slate-700">
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
      </div>

      {/* Table */}
      <BookAllocationTable
        gradeFilter={gradeFilter}
        streamFilter={streamFilter}
        searchTerm={searchTerm}
        onGradeChange={setGradeFilter}
        onStreamChange={setStreamFilter}
        onSearchChange={setSearchTerm}
        onClearFilters={handleClearFilters}
        grades={grades}
        streams={streams}
      />

      {/* Action Buttons */}
      <div className="flex justify-end">
        <Button 
          onClick={handleExport}
          disabled={isExporting}
          className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-100"
        >
          {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />}
          Export Matrix
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClearFilters}
          className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-2"
        >
          <X size={18} /> Clear Filters
        </Button>
      </div>

      {/* Return Modal */}
      <BookReturnModal
        isOpen={!!selectedLogId}
        onClose={() => setSelectedLogId('')}
        historyLogs={filteredLogs}
        onProcessReturn={handleProcessReturn}
      />
    </div>
  );
};

export default BookAllocation;