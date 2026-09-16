import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, History, UserCheck, Key, Sliders, Lock, ShieldCheck } from 'lucide-react';
import { CentralDataService } from '@/services/centralDataService';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorRole: string;
  actorName: string;
  action: string;
  ipAddress: string;
}

const AUDIT_LOGS_KEY = 'munyaka_security_audit_logs';

const INITIAL_AUDITS: AuditLogEntry[] = [
  { id: 'LOG-9021', timestamp: 'Today, 14:22 EAT', actorRole: 'System Administrator', actorName: 'Admin Munyaka', action: 'Geofence Radius Configuration Update', ipAddress: '192.168.1.50' },
  { id: 'LOG-9020', timestamp: 'Today, 11:05 EAT', actorRole: 'Head Teacher', actorName: 'Dr. Kiprop', action: 'Term 1 Exam Marks Locked & Archived', ipAddress: '192.168.1.12' },
  { id: 'LOG-9019', timestamp: 'Yesterday, 16:40 EAT', actorRole: 'Platform Owner', actorName: 'Super Developer', action: 'Tenant Multi-Tenant Instance Provisioned', ipAddress: '10.0.0.4' },
  { id: 'LOG-9018', timestamp: 'Yesterday, 09:15 EAT', actorRole: 'Bursar', actorName: 'Finance Desk', action: 'Fee Structure Bounds Modified', ipAddress: '192.168.1.25' }
];

export default function SecurityAuditTrailCard() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const central = CentralDataService.getData<AuditLogEntry[]>(AUDIT_LOGS_KEY, []);
      if (central && Array.isArray(central) && central.length > 0) return central;
      const saved = localStorage.getItem(AUDIT_LOGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          CentralDataService.setData(AUDIT_LOGS_KEY, parsed);
          return parsed;
        }
      }
    } catch {}
    CentralDataService.setData(AUDIT_LOGS_KEY, INITIAL_AUDITS);
    return INITIAL_AUDITS;
  });

  useEffect(() => {
    try {
      CentralDataService.setData(AUDIT_LOGS_KEY, logs);
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
    } catch {}
  }, [logs]);

  return (
    <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
      <CardHeader className="p-6 sm:p-8 border-b bg-gradient-to-r from-slate-50 to-indigo-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-600" />
              Immutable Ledger
            </Badge>
          </div>
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="text-indigo-600" size={22} />
            System Security Audit Trail
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-1">
            Read-only log of high-privilege configuration and authentication events.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50/60 text-[10px] uppercase tracking-wider text-slate-400 font-black">
                <th className="py-3.5 px-6">Timestamp / ID</th>
                <th className="py-3.5 px-6">Admin / User Role</th>
                <th className="py-3.5 px-6">Action Taken</th>
                <th className="py-3.5 px-6 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900 block">{log.timestamp}</span>
                    <span className="text-xs font-mono text-slate-400">{log.id}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-indigo-900 block">{log.actorRole}</span>
                    <span className="text-xs text-slate-500">{log.actorName}</span>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-700">
                    {log.action}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-xs text-slate-500">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
