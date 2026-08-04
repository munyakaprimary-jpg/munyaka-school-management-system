"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, FileDown, Edit, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface FeeRecord {
  id: string;
  student: string;
  total: number;
  paid: number;
  balance: number;
  status: string;
}

interface FeesTableProps {
  fees: FeeRecord[];
  onViewStatement: (fee: FeeRecord) => void;
  onDownloadPDF: (fee: FeeRecord) => void;
  onEdit: (fee: FeeRecord) => void;
  onDelete: (fee: FeeRecord) => void;
}

const FeesTable: React.FC<FeesTableProps> = ({
  fees,
  onViewStatement,
  onDownloadPDF,
  onEdit,
  onDelete
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50/80 border-b border-slate-200/80">
          <tr>
            <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Details</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Term Fee</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Paid</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {fees.map((fee) => (
            <tr key={fee.id} className="hover:bg-slate-50/60 transition-colors group">
              <td className="px-5 py-3.5">
                <p className="font-semibold text-slate-900">{fee.student}</p>
                <p className="text-xs text-slate-400">Assessment: A8273{fee.id}</p>
              </td>
              <td className="px-5 py-3.5 text-center font-medium text-slate-600">KES {fee.total.toLocaleString()}</td>
              <td className="px-5 py-3.5 text-center font-semibold text-emerald-600">KES {fee.paid.toLocaleString()}</td>
              <td className="px-5 py-3.5 text-center font-semibold">
                <span className={fee.balance > 0 ? "text-rose-600" : "text-slate-400"}>
                  {fee.balance > 0 ? `KES ${fee.balance.toLocaleString()}` : "CLEARED"}
                </span>
              </td>
              <td className="px-5 py-3.5 text-center">
                <Badge className={cn("rounded-md border-none px-2.5 py-0.5 text-xs font-medium", 
                  fee.status === 'Cleared' ? "bg-emerald-50 text-emerald-700" : 
                  fee.status === 'Partial' ? "bg-amber-50 text-amber-700" : 
                  "bg-slate-100 text-slate-600"
                )}>
                  {fee.status}
                </Badge>
              </td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex justify-end gap-1 no-print">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50" 
                    onClick={() => onViewStatement(fee)}
                    title="View Statement"
                  >
                    <Eye size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50" 
                    onClick={() => onDownloadPDF(fee)}
                    title="Download PDF"
                  >
                    <FileDown size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50" 
                    onClick={() => onEdit(fee)}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50" 
                    onClick={() => onDelete(fee)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FeesTable;