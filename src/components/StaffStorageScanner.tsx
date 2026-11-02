import React, { useState, useEffect } from 'react';
import { Database, Search, RefreshCw, HardDrive, Shield, UserCheck, Layers, AlertCircle, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const STAFF_STORAGE_KEYS = [
  'munyaka_staff',
  'munyaka_staff_directory',
  'munyaka_staff_db',
  'munyaka_staff_master',
  'munyaka_master_staff_list',
  'munyaka_staff_prereg',
  'staff_registry',
  'staff_members',
  'staff',
  'teachers',
  'employees',
  'munyaka_staff_v2'
];

interface StaffMember {
  id?: string;
  staffId?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
  staffCategory?: string;
  department?: string;
  [key: string]: any;
}

interface KeyStorageData {
  key: string;
  exists: boolean;
  rawSize: number;
  items: StaffMember[];
  error?: string;
}

export default function StaffStorageScanner() {
  const [storageData, setStorageData] = useState<KeyStorageData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKeyFilter, setSelectedKeyFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigate = useNavigate();

  const scanStorage = () => {
    setIsRefreshing(true);
    try {
      const results: KeyStorageData[] = STAFF_STORAGE_KEYS.map(key => {
        const raw = localStorage.getItem(key);
        if (!raw) {
          return { key, exists: false, rawSize: 0, items: [] };
        }
        
        let parsed: any[] = [];
        try {
          const json = JSON.parse(raw);
          if (Array.isArray(json)) {
            parsed = json;
          } else if (json && typeof json === 'object') {
            // Check if it has a staff array property
            if (Array.isArray(json.staff)) parsed = json.staff;
            else if (Array.isArray(json.data)) parsed = json.data;
            else parsed = [json];
          }
        } catch (e: any) {
          return { key, exists: true, rawSize: raw.length, items: [], error: 'Invalid JSON format' };
        }

        return {
          key,
          exists: true,
          rawSize: raw.length,
          items: parsed
        };
      });

      setStorageData(results);
    } catch (err) {
      console.error('Error scanning staff storage:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    scanStorage();
  }, []);

  // Aggregate unique staff by id/email/name
  const allStaffMap = new Map<string, { member: StaffMember; keysFound: string[] }>();
  
  storageData.forEach(store => {
    if (store.exists && store.items.length > 0) {
      store.items.forEach(item => {
        const identifier = item.id || item.staffId || item.email || item.name || item.fullName || JSON.stringify(item);
        if (!allStaffMap.has(identifier)) {
          allStaffMap.set(identifier, { member: item, keysFound: [store.key] });
        } else {
          const existing = allStaffMap.get(identifier)!;
          if (!existing.keysFound.includes(store.key)) {
            existing.keysFound.push(store.key);
          }
        }
      });
    }
  });

  const uniqueStaffList = Array.from(allStaffMap.values());

  const filteredStaff = uniqueStaffList.filter(({ member, keysFound }) => {
    const matchesSearch = 
      (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.staffId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.department || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedKeyFilter === 'all') return matchesSearch;
    return matchesSearch && keysFound.includes(selectedKeyFilter);
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-6 space-y-6 animate-in fade-in duration-300 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/staff-registry')}
            className="rounded-xl border-slate-200 dark:border-slate-700"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="text-indigo-600 dark:text-indigo-400" size={28} />
              Staff Storage & Registry Scanner
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Inspect all localStorage keys, persistent stores, and unified staff records across the system.
            </p>
          </div>
        </div>
        <Button
          onClick={scanStorage}
          disabled={isRefreshing}
          className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold shadow-md shadow-indigo-100 dark:shadow-none"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          Rescan Storage Keys
        </Button>
      </div>

      {/* Storage Keys Summary Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <HardDrive size={20} className="text-indigo-500" />
          Storage Keys Overview ({STAFF_STORAGE_KEYS.length} Monitored Keys)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {storageData.map((store) => (
            <Card 
              key={store.key}
              onClick={() => setSelectedKeyFilter(selectedKeyFilter === store.key ? 'all' : store.key)}
              className={`cursor-pointer transition-all rounded-2xl border ${
                selectedKeyFilter === store.key 
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[180px]" title={store.key}>
                    {store.key}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    store.exists && store.items.length > 0 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' 
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {store.exists ? `${store.items.length} records` : 'Empty'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span>Size: {(store.rawSize / 1024).toFixed(1)} KB</span>
                  {store.error && <span className="text-rose-500 text-[10px]">JSON Error</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Staff Explorer Section */}
      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserCheck size={20} className="text-indigo-500" />
                Aggregated System Staff ({filteredStaff.length} unique members found)
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedKeyFilter === 'all' ? 'Showing combined staff across all active storage keys.' : `Filtered by storage key: ${selectedKeyFilter}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Search staff by name, email, role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs sm:text-sm"
                />
              </div>
              {selectedKeyFilter !== 'all' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedKeyFilter('all')}
                  className="rounded-xl text-xs"
                >
                  Clear Key Filter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredStaff.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle className="mx-auto text-slate-400" size={40} />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No staff members found matching your search or filter.</p>
              <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setSelectedKeyFilter('all'); }} className="rounded-xl text-xs">
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Role / Designation</th>
                    <th className="py-3 px-4">Department / Category</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Storage Keys Found In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStaff.map(({ member, keysFound }, idx) => {
                    const name = member.name || member.fullName || member.username || 'Unnamed Staff';
                    const role = member.role || member.designation || 'Staff';
                    const category = member.staffCategory || member.department || 'General';
                    const email = member.email || member.phone || member.tscNumber || member.staffId || member.id || 'N/A';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold">{name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">ID: {member.staffId || member.id || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                            {role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {category}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                          {email}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {keysFound.map(k => (
                              <span key={k} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" title={k}>
                                {k}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
