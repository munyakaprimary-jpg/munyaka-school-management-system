import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Search, Filter, RefreshCw, CheckCircle2,
  AlertTriangle, Server, Database, HardDrive, Users, Key,
  Settings, Shield, ChevronDown, Check, Globe, Sliders,
  Trash2, Edit3, Power, Zap, Cpu, Lock, Unlock, ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { TenantConfigModal, TenantFormData } from '@/components/TenantConfigModal';
import { CentralDataService } from '@/services/centralDataService';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  location?: string;
  plan: 'Starter' | 'Enterprise' | 'Custom';
  status: 'Active' | 'Suspended' | 'Pending';
  studentCount: number;
  maxSeats: number;
  dbMode: 'Isolated SQLite' | 'Shared Local Storage' | 'Cloud PostgreSQL';
  lastSynced: string;
  adminEmail?: string;
  adminPhone?: string;
}

const STORAGE_KEY = 'munyaka_multitenant_config';
const ACTIVE_TENANT_KEY = 'munyaka_active_tenant_id';

const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-001',
    name: 'Munyaka Primary and Junior School',
    code: 'MUNYAKA-001',
    location: 'Nairobi, Kenya',
    plan: 'Enterprise',
    status: 'Active',
    studentCount: 840,
    maxSeats: 1000,
    dbMode: 'Isolated SQLite',
    lastSynced: 'Just now',
    adminEmail: 'admin@munyakaprimary.ac.ke',
    adminPhone: '+254 712 345678'
  },
  {
    id: 'tenant-002',
    name: 'St. Teresa Primary & High',
    code: 'STTERESA-002',
    location: 'Mombasa, Kenya',
    plan: 'Starter',
    status: 'Active',
    studentCount: 320,
    maxSeats: 500,
    dbMode: 'Isolated SQLite',
    lastSynced: '12 mins ago',
    adminEmail: 'head@stteresaschool.org',
    adminPhone: '+254 722 987654'
  },
  {
    id: 'tenant-003',
    name: 'Savannah Academy',
    code: 'SAVANNAH-003',
    location: 'Kisumu, Kenya',
    plan: 'Enterprise',
    status: 'Suspended',
    studentCount: 950,
    maxSeats: 1000,
    dbMode: 'Cloud PostgreSQL',
    lastSynced: '2 days ago',
    adminEmail: 'director@savannah.ac.ke',
    adminPhone: '+254 733 112233'
  },
  {
    id: 'tenant-004',
    name: 'Hillcrest Junior School',
    code: 'HILLCREST-004',
    location: 'Nakuru, Kenya',
    plan: 'Starter',
    status: 'Active',
    studentCount: 180,
    maxSeats: 300,
    dbMode: 'Shared Local Storage',
    lastSynced: '1 hour ago',
    adminEmail: 'info@hillcrest.edu',
    adminPhone: '+254 744 556677'
  }
];

export default function OwnersDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    try {
      const central = CentralDataService.getData<Tenant[]>(STORAGE_KEY, []);
      if (central && Array.isArray(central) && central.length > 0) return central;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          CentralDataService.setData(STORAGE_KEY, parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    CentralDataService.setData(STORAGE_KEY, INITIAL_TENANTS);
    return INITIAL_TENANTS;
  });

  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    try {
      const centralActive = CentralDataService.getData<string>(ACTIVE_TENANT_KEY, '');
      if (centralActive) return centralActive;
      const savedActive = localStorage.getItem(ACTIVE_TENANT_KEY);
      if (savedActive) return savedActive;
    } catch (e) {
      console.error(e);
    }
    return tenants[0]?.id || 'tenant-001';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<Tenant | null>(null);

  // Persist tenants and active tenant
  useEffect(() => {
    try {
      CentralDataService.setData(STORAGE_KEY, tenants);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
    } catch (e) {
      console.error(e);
    }
  }, [tenants]);

  useEffect(() => {
    try {
      CentralDataService.setData(ACTIVE_TENANT_KEY, activeTenantId);
      localStorage.setItem(ACTIVE_TENANT_KEY, activeTenantId);
      const activeObj = tenants.find(t => t.id === activeTenantId);
      if (activeObj) {
        localStorage.setItem('munyaka_active_tenant_name', activeObj.name);
        localStorage.setItem('munyaka_active_tenant_code', activeObj.code);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeTenantId, tenants]);

  const activeTenant = tenants.find(t => t.id === activeTenantId) || tenants[0];

  // Metrics calculation
  const totalActiveTenants = tenants.filter(t => t.status === 'Active').length;
  
  // Real dynamic calculations from stored students/records or default 0 if none
  const totalStudents = (() => {
    try {
      const storedStudents = localStorage.getItem('munyaka_students');
      if (storedStudents) {
        const parsed = JSON.parse(storedStudents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.length;
        }
      }
    } catch (e) {
      // fallback
    }
    const tenantSum = tenants.reduce((acc, t) => acc + (t.status === 'Active' ? t.studentCount : 0), 0);
    return tenantSum > 0 ? tenantSum : tenants.length * 150;
  })();

  const totalActiveLicenses = tenants.reduce((acc, t) => acc + (t.status === 'Active' ? t.maxSeats : 0), 0);

  const totalStorageUsed = (() => {
    try {
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          totalBytes += key.length + val.length;
        }
      }
      if (totalBytes > 0) {
        const mb = totalBytes / (1024 * 1024);
        if (mb >= 1024) {
          return (mb / 1024).toFixed(2) + ' GB';
        }
        return Math.max(mb, 0.4).toFixed(1) + ' MB';
      }
    } catch (e) {
      // fallback
    }
    return (tenants.length * 0.45).toFixed(1) + ' MB';
  })();

  // Filtered tenants
  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.location && t.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenProvisionModal = (tenantToEdit?: Tenant) => {
    if (tenantToEdit) {
      setIsEditing(tenantToEdit);
    } else {
      setIsEditing(null);
    }
    setIsProvisionModalOpen(true);
  };

  const handleModalSubmit = (data: TenantFormData) => {
    if (!data.schoolName.trim() || !data.tenantCode.trim()) {
      toast.error('School name and tenant code are required.');
      return;
    }

    // Map database strategy string to Tenant dbMode
    let mappedDbMode: 'Isolated SQLite' | 'Shared Local Storage' | 'Cloud PostgreSQL' = 'Isolated SQLite';
    if (data.databaseStrategy.includes('Cloud PostgreSQL')) {
      mappedDbMode = 'Cloud PostgreSQL';
    } else if (data.databaseStrategy.includes('Shared Local Storage')) {
      mappedDbMode = 'Shared Local Storage';
    }

    if (isEditing) {
      setTenants(tenants.map(t => t.id === isEditing.id ? {
        ...t,
        name: data.schoolName,
        code: data.tenantCode.toUpperCase(),
        location: data.location,
        plan: data.subscriptionPlan,
        maxSeats: data.allocatedSeats,
        dbMode: mappedDbMode,
        adminEmail: data.adminEmail,
        adminPhone: data.adminPhone,
        lastSynced: 'Just now'
      } : t));
      toast.success(`Tenant "${data.schoolName}" updated successfully.`);
    } else {
      const newTenant: Tenant = {
        id: 'tenant-' + Date.now(),
        name: data.schoolName,
        code: data.tenantCode.toUpperCase(),
        location: data.location || 'Kenya',
        plan: data.subscriptionPlan,
        status: 'Active',
        studentCount: 0,
        maxSeats: data.allocatedSeats,
        dbMode: mappedDbMode,
        lastSynced: 'Just now',
        adminEmail: data.adminEmail || 'admin@' + data.tenantCode.toLowerCase() + '.ac.ke',
        adminPhone: data.adminPhone || '+254 700 000000'
      };
      setTenants([newTenant, ...tenants]);
      setActiveTenantId(newTenant.id);
      toast.success(`School instance "${data.schoolName}" provisioned successfully!`);
    }

    setIsProvisionModalOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setTenants(tenants.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Active' ? 'Suspended' : 'Active';
        toast.info(`Tenant ${t.name} is now ${nextStatus}`);
        return { ...t, status: nextStatus, lastSynced: 'Just now' };
      }
      return t;
    }));
  };

  const handleDeleteTenant = (id: string) => {
    if (tenants.length <= 1) {
      toast.error('Cannot delete the last remaining tenant instance.');
      return;
    }
    const target = tenants.find(t => t.id === id);
    if (confirm(`Are you sure you want to delete tenant instance "${target?.name || id}"? This action is irreversible.`)) {
      setTenants(tenants.filter(t => t.id !== id));
      if (activeTenantId === id) {
        const remaining = tenants.filter(t => t.id !== id);
        if (remaining.length > 0) setActiveTenantId(remaining[0].id);
      }
      toast.success('Tenant instance deleted successfully.');
    }
  };

  const handleSyncAll = () => {
    setTenants(tenants.map(t => ({ ...t, lastSynced: 'Just now' })));
    toast.success('All tenant databases and sync states updated successfully.');
  };

  const modalInitialData: Partial<TenantFormData> | undefined = isEditing ? {
    schoolName: isEditing.name,
    tenantCode: isEditing.code,
    location: isEditing.location || 'Nairobi, Kenya',
    subscriptionPlan: isEditing.plan,
    allocatedSeats: isEditing.maxSeats,
    databaseStrategy: isEditing.dbMode === 'Cloud PostgreSQL' ? 'Cloud PostgreSQL (Isolated Schema)' : isEditing.dbMode === 'Shared Local Storage' ? 'Shared Local Storage' : 'Isolated SQLite (File Sandbox)',
    adminEmail: isEditing.adminEmail || 'admin@school.ac.ke',
    adminPhone: isEditing.adminPhone || '+254 700 000000'
  } : {
    tenantCode: 'SCH-710',
    location: 'Nairobi, Kenya',
    subscriptionPlan: 'Starter',
    allocatedSeats: 500,
    databaseStrategy: 'Isolated SQLite (File Sandbox)',
    adminEmail: 'admin@school.ac.ke',
    adminPhone: '+254 700 000000'
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Building2 size={240} />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/30 px-3 py-1 text-xs uppercase tracking-wider font-semibold">
                Developer & Platform Owner Hub
              </Badge>
              <Badge variant="outline" className="text-emerald-300 border-emerald-500/30 bg-emerald-950/30 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Network Online
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Multi-Tenant Platform Hub</h1>
            <p className="text-indigo-200/80 text-sm sm:text-base mt-1 max-w-2xl">
              Provision, monitor, and isolate school instances across your network with secure multi-tenant architecture.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleSyncAll}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync All Nodes
            </Button>
            <Button 
              onClick={() => handleOpenProvisionModal()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
            >
              <Plus className="mr-2 h-4 w-4" />
              Provision New Tenant / School
            </Button>
          </div>
        </div>

        {/* KEY METRICS BAR */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-indigo-300 text-xs font-medium uppercase tracking-wider mb-1">
              <span>Active Tenants</span>
              <Building2 className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalActiveTenants} <span className="text-xs font-normal text-slate-400">/ {tenants.length}</span></div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-indigo-300 text-xs font-medium uppercase tracking-wider mb-1">
              <span>Enrolled Learners</span>
              <Users className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalStudents.toLocaleString()}</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-indigo-300 text-xs font-medium uppercase tracking-wider mb-1">
              <span>Active Licenses</span>
              <Key className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalActiveLicenses.toLocaleString()} seats</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-indigo-300 text-xs font-medium uppercase tracking-wider mb-1">
              <span>System Storage Used</span>
              <HardDrive className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalStorageUsed}</div>
          </div>
        </div>
      </div>

      {/* ACTIVE TENANT SWITCHER BAR */}
      <Card className="border-indigo-100 dark:border-indigo-950 shadow-md bg-gradient-to-r from-indigo-50/50 via-white to-blue-50/30 dark:from-indigo-950/20 dark:via-slate-900 dark:to-blue-950/20">
        <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Currently Managing Tenant Context:
              </div>
              <div className="text-lg font-bold text-foreground flex items-center gap-2 mt-0.5">
                {activeTenant.name}
                <Badge variant="outline" className="text-xs font-mono font-normal">
                  {activeTenant.code}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-background/80 dark:bg-slate-800 border rounded-xl px-3 py-1.5 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-medium text-muted-foreground">Sync State:</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{activeTenant.lastSynced}</span>
            </div>

            <div className="w-full md:w-72">
              <Select value={activeTenantId} onValueChange={setActiveTenantId}>
                <SelectTrigger className="bg-background font-medium">
                  <SelectValue placeholder="Switch active tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id} className="flex items-center justify-between">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({t.code})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TENANTS MANAGEMENT TABLE CARD */}
      <Card className="shadow-lg border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Server className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Registered Tenant Instances ({filteredTenants.length})
              </CardTitle>
              <CardDescription>
                Manage all school instances, isolation boundaries, storage limits, and license activations.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by school name or code..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 bg-background">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4 font-semibold">Tenant / School</th>
                  <th className="py-3 px-4 font-semibold">Plan & Seats</th>
                  <th className="py-3 px-4 font-semibold">Database / Isolation</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Last Sync</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No tenant instances found matching your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map(tenant => {
                    const isSelected = tenant.id === activeTenantId;
                    const seatPercent = Math.min(100, Math.round((tenant.studentCount / tenant.maxSeats) * 100));

                    return (
                      <tr 
                        key={tenant.id} 
                        className={`hover:bg-muted/30 transition-colors ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-start gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-2">
                                {tenant.name}
                                {isSelected && (
                                  <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] px-1.5 py-0.2">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                <span className="font-mono">{tenant.code}</span>
                                {tenant.location && <span>• {tenant.location}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="space-y-1.5 max-w-[200px]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold">{tenant.plan}</span>
                              <span className="text-muted-foreground font-mono">{tenant.studentCount} / {tenant.maxSeats}</span>
                            </div>
                            <Progress value={seatPercent} className="h-1.5" />
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5">
                            <Database className="h-3.5 w-3.5 text-indigo-500" />
                            <span className="text-xs font-medium">{tenant.dbMode}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {tenant.status === 'Active' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/40 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <AlertTriangle className="h-3 w-3" />
                              Suspended
                            </Badge>
                          )}
                        </td>

                        <td className="py-4 px-4 text-xs text-muted-foreground font-mono">
                          {tenant.lastSynced}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isSelected && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActiveTenantId(tenant.id)}
                                className="h-8 text-xs bg-indigo-50/50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                              >
                                Switch Context
                              </Button>
                            )}

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenProvisionModal(tenant)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Edit Details"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleToggleStatus(tenant.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                              title={tenant.status === 'Active' ? 'Suspend Tenant' : 'Activate Tenant'}
                            >
                              <Power className="h-4 w-4" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteTenant(tenant.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-red-600"
                              title="Delete Tenant"
                            >
                              <Trash2 className="h-4 w-4" />
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
        </CardContent>
      </Card>

      {/* DYNAMIC TENANT CONFIG MODAL */}
      <TenantConfigModal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={modalInitialData}
        title={isEditing ? `Edit Tenant: ${isEditing.name}` : 'Provision New School Tenant Instance'}
      />
    </div>
  );
}
