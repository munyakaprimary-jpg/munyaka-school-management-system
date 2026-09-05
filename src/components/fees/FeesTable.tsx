"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, FileDown, Edit, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";
// No initial mock fees: load from localStorage, fallback to empty list.
const initialFees: FeeRecord[] = [];

interface FeeRecord {
  id: string;
  student: string;
  total: number;
  paid: number;
  balance?: number;
  status?: string;
}

interface FeesTableProps {
  fees?: FeeRecord[];
  onViewStatement: (fee: FeeRecord) => void;
  onDownloadPDF: (fee: FeeRecord) => void;
  onEdit: (fee: FeeRecord) => void;
  onDelete?: (fee: FeeRecord) => void;
  onRecordUpdated?: () => void;
}

const FeesTable: React.FC<FeesTableProps> = ({
  fees: propFees,
  onViewStatement,
  onDownloadPDF,
  onEdit,
  onDelete,
  onRecordUpdated
}) => {
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>(() => {
    if (propFees && propFees.length > 0) return propFees;
    const saved = localStorage.getItem('munyaka_fees_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse saved fee records:", e);
      }
    }
    return initialFees;
  });

  // Sync with propFees or localStorage changes
  useEffect(() => {
    if (propFees && propFees.length > 0) {
      setFeeRecords(propFees);
    }
  }, [propFees]);

  // Listen for storage events and custom events for instant synchronization
  useEffect(() => {
    const loadFromStorage = () => {
      const saved = localStorage.getItem('munyaka_fees_records');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Also check individual student fee overrides in localStorage (munyaka_fee_<id>)
            const enriched = parsed.map(fee => {
              const itemSaved = localStorage.getItem(`munyaka_fee_${fee.id}`);
              if (itemSaved) {
                try {
                  const itemData = JSON.parse(itemSaved);
                  return {
                    ...fee,
                    total: itemData.termFee !== undefined ? itemData.termFee : (itemData.total !== undefined ? itemData.total : fee.total),
                    paid: itemData.feePaid !== undefined ? itemData.feePaid : (itemData.paid !== undefined ? itemData.paid : fee.paid),
                    status: itemData.status !== undefined ? itemData.status : fee.status,
                  };
                } catch (e) {
                  return fee;
                }
              }
              return fee;
            });
            setFeeRecords(enriched);
            if (onRecordUpdated) {
              onRecordUpdated();
            }
          }
        } catch (e) {
          console.error("Failed to parse localStorage fee records:", e);
        }
      }
    };

    loadFromStorage();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'munyaka_fees_records' || (e.key && e.key.startsWith('munyaka_fee_'))) {
        loadFromStorage();
      }
    };

    const handleCustomSync = () => {
      loadFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('munyaka_fees_updated', handleCustomSync);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('munyaka_fees_updated', handleCustomSync);
    };
  }, [onRecordUpdated]);

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
          {feeRecords.map((fee) => {
            const total = fee.total || 0;
            const paid = fee.paid || 0;
            const balance = Math.max(0, total - paid);
            
            // Dynamic Status Computation
            let status = "Pending";
            if (balance <= 0) {
              status = "Cleared";
            } else if (paid > 0 && balance > 0) {
              status = "Partial";
            } else {
              status = "Pending";
            }

            return (
              <tr key={fee.id} className="hover:bg-slate-50/60 transition-colors group">
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-slate-900">{fee.student}</p>
                  <p className="text-xs text-slate-400">ID: {fee.id}</p>
                </td>
                <td className="px-5 py-3.5 text-center font-medium text-slate-600">KES {total.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-center font-semibold text-emerald-600">KES {paid.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-center font-semibold">
                  <span className={balance > 0 ? "text-rose-600" : "text-slate-400"}>
                    {balance > 0 ? `KES ${balance.toLocaleString()}` : "CLEARED"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <Badge className={cn("rounded-md border-none px-2.5 py-0.5 text-xs font-medium", 
                    status === 'Cleared' ? "bg-emerald-50 text-emerald-700" : 
                    status === 'Partial' ? "bg-amber-50 text-amber-700" : 
                    "bg-slate-100 text-slate-600"
                  )}>
                    {status}
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
                      title="Edit Fee Record"
                    >
                      <Edit size={16} />
                    </Button>
                    {onDelete && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50" 
                        onClick={() => onDelete(fee)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FeesTable;