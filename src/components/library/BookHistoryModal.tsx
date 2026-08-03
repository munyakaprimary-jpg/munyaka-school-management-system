"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { Book, BorrowLog, getLogBalance, getLogStatusInfo } from '@/types/library';
import { ProcessReturnModal } from './ProcessReturnModal';
import { UserCheck, Calendar, RotateCcw, CheckCircle2, Clock, Filter, X, Download, Printer, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';

interface BookHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  historyLogs: BorrowLog[];
  onProcessReturn: (logId: string, qtyReturned: number, qtyLost: number) => void;
}

export const BookHistoryModal: React.FC<BookHistoryModalProps> = ({
  isOpen,
  onClose,
  book,
  historyLogs,
  onProcessReturn
}) => {
  const [selectedLogForReturn, setSelectedLogForReturn] = useState<BorrowLog | null>(null);
  
  // Filter States
  const [gradeFilter, setGradeFilter] = useState("all");
  const [streamFilter, setStreamFilter] = useState("all");

  const gradeOptions = useMemo(() => [
    "PP1", "PP2",
    ...Array.from({ length: 9 }, (_, i) => `Grade ${i + 1}`)
  ], []);

  const streamOptions = useMemo(() => ["Blue", "Green", "Yellow", "Alpha", "Beta"], []);

  const filteredLogs = useMemo(() => {
    if (!book) return [];
    return historyLogs.filter(log => {
      if (log.bookId !== book.id) return false;
      const matchesGrade = gradeFilter === "all" || log.grade === gradeFilter;
      const matchesStream = streamFilter === "all" || log.stream === streamFilter;
      return matchesGrade && matchesStream;
    });
  }, [book, historyLogs, gradeFilter, streamFilter]);

  if (!book) return null;

  // CSV Export Function
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showSuccess("No records to export.");
      return;
    }

    const headers = [
      "Borrower Name", "Role", "Grade", "Stream", 
      "Book Title", "Accession No", "Date Issued", "Due Date", 
      "Qty Issued", "Qty Returned", "Qty Lost", "Balance",
      "Issue Condition", "Return Condition", "Status"
    ];

    const rows = filteredLogs.map(log => {
      const balance = getLogBalance(log.qty_issued, log.qty_returned || 0, log.qty_lost || 0);
      const statusInfo = getLogStatusInfo(log);
      return [
        log.borrowerName,
        log.borrowerType,
        log.grade,
        log.stream,
        log.bookTitle,
        log.accession_no,
        log.issuedDate,
        log.dueDate,
        log.qty_issued,
        log.qty_returned || 0,
        log.qty_lost || 0,
        balance,
        log.condition_on_issue,
        log.condition_on_return,
        statusInfo.label
      ];
    });

    const csvContent = [
      `Library Circulation Report - ${book.title}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      `Filters: Grade=${gradeFilter === 'all' ? 'All' : gradeFilter}, Stream=${streamFilter === 'all' ? 'All' : streamFilter}`,
      "",
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fileName = `Library_Circulation_Report_${book.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showSuccess(`Exported ${filteredLogs.length} records to CSV!`);
  };

  // Print Function
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const todayStr = new Date().toLocaleDateString();
    const gradeLabel = gradeFilter === 'all' ? 'All Grades' : gradeFilter;
    const streamLabel = streamFilter === 'all' ? 'All Streams' : streamFilter;

    const tableRows = filteredLogs.map(log => {
      const balance = getLogBalance(log.qty_issued, log.qty_returned || 0, log.qty_lost || 0);
      const statusInfo = getLogStatusInfo(log);
      return `
        <tr>
          <td>${log.borrowerName}</td>
          <td>${log.borrowerType}</td>
          <td>${log.grade} ${log.stream}</td>
          <td>${log.bookTitle}</td>
          <td>${log.accession_no}</td>
          <td>${log.issuedDate}</td>
          <td>${log.dueDate}</td>
          <td style="text-align:center">${log.qty_issued}</td>
          <td style="text-align:center">${log.qty_returned || 0}</td>
          <td style="text-align:center">${log.qty_lost || 0}</td>
          <td style="text-align:center">${getLogBalance(log.qty_issued, log.qty_returned || 0, log.qty_lost || 0)}</td>
          <td>${log.condition_on_issue}</td>
          <td>${log.condition_on_return}</td>
          <td><span class="status-badge">${statusInfo.label}</span></td>
        </tr>
      `;
    }).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Library Circulation Report - ${book.title}</title>
        <style>
          @media print {
            @page { size: A4 landscape; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; }
            .no-print { display: none !important; }
            table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
            th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; }
            th { background: #f0f0f0; font-weight: bold; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            .header-section { text-align: center; margin-bottom: 20px; }
            .school-name { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
            .report-title { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
            .report-meta { font-size: 10px; color: #555; margin-bottom: 16px; }
            .signature-block { margin-top: 30px; display: flex; justify-content: space-between; }
            .signature-line { width: 200px; border-top: 1px solid #000; padding-top: 4px; text-align: center; font-size: 10px; }
            .status-badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
          }
          /* Screen styles for preview */
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          .header-section { text-align: center; margin-bottom: 20px; }
          .school-name { font-size: 20px; font-weight: bold; margin-bottom: 6px; color: #1e3a5f; }
          .report-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333; }
          .report-meta { font-size: 11px; color: #666; margin-bottom: 16px; }
          .signature-block { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature-line { width: 220px; border-top: 1px solid #333; padding-top: 6px; text-align: center; font-size: 11px; }
          .status-badge { padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; display: inline-block; }
          .status-Active { background: #dcfce7; color: #166534; }
          .status-Returned { background: #f3f4f6; color: #374151; }
          .status-Overdue { background: #fef3c7; color: #92400e; }
          .status-Lost { background: #fee2e2; color: #991b1b; }
          .status-Partially { background: #fef3c7; color: #92400e; }
          .no-print { margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">Print / Save as PDF</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
        </div>
        
        <div class="header-section">
          <div class="school-name">MUNYAKA PRIMARY AND JUNIOR SCHOOL</div>
          <div class="report-title">LIBRARY CIRCULATION REPORT</div>
          <div class="report-meta">
            <strong>Book:</strong> ${book.title} (${book.accession_no}) | 
            <strong>Report Date:</strong> ${todayStr} | 
            <strong>Filters:</strong> Grade: ${gradeLabel}, Stream: ${streamLabel} | 
            <strong>Total Records:</strong> ${filteredLogs.length}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Borrower Name</th>
              <th>Role</th>
              <th>Grade / Stream</th>
              <th>Book Title</th>
              <th>Accession No</th>
              <th>Date Issued</th>
              <th>Due Date</th>
              <th style="text-align:center">Qty Issued</th>
              <th style="text-align:center">Qty Returned</th>
              <th style="text-align:center">Qty Lost</th>
              <th style="text-align:center">Balance</th>
              <th>Issue Condition</th>
              <th>Return Condition</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="signature-block">
          <div class="signature-line">
            Librarian / Issued By<br><span style="font-weight:normal; font-size:9px;">Signature & Date</span>
          </div>
          <div class="signature-line">
            Head Teacher / Approved By<br><span style="font-weight:normal; font-size:9px;">Signature & Date</span>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Circulation History: ${book?.title}`}
        description="View past checkouts, current borrowers, partial returns, and book losses."
        maxWidth="max-w-5xl"
        footer={
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
            Close
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 text-center">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Stock</p>
              <p className="text-xl font-black text-slate-900">{book.stock}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Currently Borrowed</p>
              <p className="text-xl font-black text-indigo-600">{book.borrowed}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Available On Shelf</p>
              <p className="text-xl font-black text-emerald-600">{Math.max(0, book.stock - book.borrowed)}</p>
            </div>
          </div>

          {/* Export & Print Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 shrink-0">
              <FileSpreadsheet size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Export & Print Options</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button 
                variant="outline"
                onClick={handleExportCSV}
                className="rounded-xl h-10 px-4 text-sm font-bold text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 gap-2"
              >
                <FileSpreadsheet size={16} /> Export CSV / Excel
              </Button>

              <Button 
                onClick={handlePrint}
                className="rounded-xl h-10 px-4 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 gap-2"
              >
                <Printer size={16} /> Print / PDF Report
              </Button>
            </div>
          </div>

          {/* Table Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400 shrink-0">
              <Filter size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Filter By Class</span>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Grade Levels</SelectItem>
                  {gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={streamFilter} onValueChange={setStreamFilter}>
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs">
                  <SelectValue placeholder="All Streams" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Streams</SelectItem>
                  {streamOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {(gradeFilter !== "all" || streamFilter !== "all") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setGradeFilter("all"); setStreamFilter("all"); }}
                className="rounded-xl h-10 px-4 text-xs font-bold text-rose-600 hover:bg-rose-50 gap-1.5"
              >
                <X size={14} /> Clear
              </Button>
            )}
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Borrower & Class</th>
                    <th className="px-3 py-3 font-black uppercase tracking-widest text-slate-400">Issued Date</th>
                    <th className="px-3 py-3 font-black uppercase tracking-widest text-slate-400">Due Date</th>
                    <th className="px-2 py-3 font-black uppercase tracking-widest text-slate-400 text-center">Issued Qty</th>
                    <th className="px-2 py-3 font-black uppercase tracking-widest text-slate-400 text-center">Returned Qty</th>
                    <th className="px-2 py-3 font-black uppercase tracking-widest text-slate-400 text-center">Lost</th>
                    <th className="px-2 py-3 font-black uppercase tracking-widest text-slate-400 text-center">Balance</th>
                    <th className="px-3 py-3 font-black uppercase tracking-widest text-slate-400">Condition</th>
                    <th className="px-3 py-3 font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => {
                      const balance = getLogBalance(log.qty_issued, log.qty_returned || 0, log.qty_lost || 0);
                      const statusInfo = getLogStatusInfo(log);

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <UserCheck size={16} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{log.borrowerName}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{log.borrowerType}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[10px] font-bold text-indigo-500">{log.grade} {log.stream}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 text-slate-600 font-medium">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="text-slate-400" />
                              <span>{log.issuedDate}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 text-slate-600 font-medium">
                            <div className="flex items-center gap-1">
                              <Clock size={12} className="text-slate-400" />
                              <span>{log.dueDate}</span>
                            </div>
                          </td>
                          <td className="px-2 py-3.5 text-center font-black text-slate-800 bg-slate-50/30">
                            {log.qty_issued}
                          </td>
                          <td className="px-2 py-3.5 text-center font-bold text-emerald-600">
                            {log.qty_returned || 0}
                          </td>
                          <td className="px-2 py-3.5 text-center font-bold text-rose-600">
                            {log.qty_lost || 0}
                          </td>
                          <td className="px-2 py-3.5 text-center font-black text-indigo-600 bg-indigo-50/20">
                            {balance}
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className={cn("rounded-lg border-none text-[10px]", 
                                log.condition_on_issue === 'New' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                                log.condition_on_issue === 'Good' && 'bg-blue-50 text-blue-700 border-blue-100',
                                log.condition_on_issue === 'Fair' && 'bg-amber-50 text-amber-700',
                                log.condition_on_issue === 'Damaged' && 'bg-rose-50 text-rose-700'
                              )}>
                                {log.condition_on_issue}
                              </Badge>
                              {log.condition_on_return !== 'Pending' && (
                                <Badge variant="outline" className={cn("rounded-lg border-none text-[10px]", 
                                  log.condition_on_return === 'Good' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                                  log.condition_on_return === 'Damaged' && 'bg-rose-50 text-rose-700',
                                  log.condition_on_return === 'Lost' && 'bg-red-500 text-red-600',
                                  'bg-slate-200 text-slate-400'
                                )}>
                                  Ret: {log.condition_on_return}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <Badge className={cn("rounded-lg border font-bold text-[10px]", statusInfo.color)}>
                              {statusInfo.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {balance > 0 ? (
                              <Button 
                                size="sm"
                                onClick={() => setSelectedLogForReturn(log)}
                                className="rounded-xl h-8 px-3 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                              >
                                <RotateCcw size={12} /> Process Return
                              </Button>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-bold text-[10px]">
                                <CheckCircle2 size={14} /> Closed
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-slate-50 rounded-full text-slate-200">
                            <Filter size={32} />
                          </div>
                          <p className="text-slate-500 font-bold">No circulation records match the current class filter.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Process Return / Loss Sub-Modal */}
      <ProcessReturnModal
        isOpen={!!selectedLogForReturn}
        onClose={() => setSelectedLogForReturn(null)}
        log={selectedLogForReturn}
        onConfirmReturn={onProcessReturn}
      />
    </>
  );
};