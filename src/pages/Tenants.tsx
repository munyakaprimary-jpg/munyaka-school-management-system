import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Building2, Users, HardDrive, DollarSign, Plus, Search, Key, Power, RefreshCw, 
  CheckCircle2, AlertTriangle, Shield, Laptop, Copy, Check, ArrowRight, Settings, Sparkles, Server, Globe
} from 'lucide-react';
import { 
  Tenant, getTenants, saveTenants, getActiveTenantCode, setActiveTenantCode, 
  getActiveTenant, DEFAULT_TENANTS 
} from '@/services/tenantService';
import { showSuccess, showError } from '@/utils/toast';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>(getTenants());
  const [activeCode, setActiveCode] = useState<string>(getActiveTenantCode());
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'All' | 'Starter' | 'Enterprise'>('All');

  // Modals
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [selectedTenantForLicense, setSelectedTenantForLicense] = useState<Tenant | null>(null);

  // New Tenant Form State
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newTenantCode, setNewTenantCode] = useState('');
  const [newYearEst, setNewYearEst] = useState('1991');
  const [newTier, setNewTier] = useState<'Starter' | 'Enterprise'>('Enterprise');
  const [newMaxSeats, setNewMaxSeats] = useState('1000');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminContact, setNewAdminContact] = useState('');
  const [newIsolation, setNewIsolation] = useState<'Isolated SQLite DB' | 'Local Namespace'>('Isolated SQLite DB');

  // License Modal State
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [licenseDuration, setLicenseDuration] = useState('30 Days');
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    // Auto-generate code when school name changes if code is empty or matches slugified previous
    if (newSchoolName) {
      const slug = newSchoolName.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').slice(0, 15);
      setNewTenantCode(slug);
    }
  }, [newSchoolName]);

  const handleContextChange = (code: string) => {
    setActiveTenantCode(code);
    setActiveCode(code);
    const tenant = tenants.find(t => t.code === code);
    showSuccess(`Switched active developer context to ${tenant?.name || code}`);
  };

  const handleToggleSuspend = (tenant: Tenant) => {
    const updated = tenants.map(t => {
      if (t.id === tenant.id) {
        const nextStatus = t.licenseStatus === 'Suspended' ? 'Active' : 'Suspended';
        return { ...t, licenseStatus: nextStatus as any };
      }
      return t;
    });
    setTenants(updated);
    saveTenants(updated);
    showSuccess(`Tenant ${tenant.name} status updated.`);
  };

  const handleOpenLicense = (tenant: Tenant) => {
    setSelectedTenantForLicense(tenant);
    setLicenseKeyInput(`MUNYAKA-${tenant.code}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
    setIsLicenseModalOpen(true);
  };

  const handleSaveLicense = () => {
    if (!selectedTenantForLicense) return;
    const updated = tenants.map(t => {
      if (t.id === selectedTenantForLicense.id) {
        return { ...t, licenseStatus: 'Active' as const, lastSync: 'Just now' };
      }
      return t;
    });
    setTenants(updated);
    saveTenants(updated);
    setIsLicenseModalOpen(false);
    showSuccess(`License key updated & verified for ${selectedTenantForLicense.name}`);
  };

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName || !newTenantCode) {
      showError('Please provide school name and tenant code prefix.');
      return;
    }

    const created: Tenant = {
      id: `t-${Date.now()}`,
      name: newSchoolName,
      code: newTenantCode.toUpperCase(),
      establishedYear: newYearEst || '1991',
      location: 'Kenya (Cloud / Local)',
      tier: newTier,
      currentSeats: 50,
      maxSeats: parseInt(newMaxSeats) || 500,
      storageKey: `tenant_db_${newTenantCode.toLowerCase().replace(/-/g, '_')}`,
      licenseStatus: 'Active',
      lastSync: 'Just now',
      adminName: newAdminName || 'Super Administrator',
      adminEmail: newAdminContact || 'admin@school.ac.ke',
      isolationMethod: newIsolation,
    };

    const updated = [created, ...tenants];
    setTenants(updated);
    saveTenants(updated);
    setIsProvisionModalOpen(false);
    showSuccess(`Successfully provisioned tenant instance: ${created.name}`);

    // Reset form
    setNewSchoolName('');
    setNewTenantCode('');
    setNewAdminName('');
    setNewAdminContact('');
  };

  // Metrics summary calculations
  const totalTenantsCount = tenants.length;
  const activeTenantsCount = tenants.filter(t => t.licenseStatus === 'Active').length;
  const totalCombinedSeats = tenants.reduce((acc, t) => acc + t.currentSeats, 0);
  const totalRevenue = "KES 80,000 /mo"; // Combined platform run-rate

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'All' || t.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const activeTenantObj = getActiveTenant();

  return (
    <div className="space-y-8 pb-12">
      {/* A. HERO HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-6 md:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
              <Server className="w-3.5 h-3.5" /> Multi-Tenant Orchestration Engine
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Platform Tenant Registry</h1>
            <p className="text-indigo-200/80 mt-2 max-w-2xl text-sm md:text-base">
              Provision, isolate, and control multi-school instances across local and cloud environments with strict database namespacing.
            </p>
          </div>
          <Button 
            onClick={() => setIsProvisionModalOpen(true)}
            size="lg"
            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 font-semibold shrink-0 gap-2"
          >
            <Plus className="w-5 h-5" /> Provision New Tenant / School
          </Button>
        </div>

        {/* Metrics Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-indigo-500/20">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-indigo-200 text-xs font-medium uppercase tracking-wider">
              <span>Total Tenants</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold mt-2 text-white flex items-baseline gap-2">
              {activeTenantsCount} <span className="text-xs font-normal text-indigo-300">/ {totalTenantsCount} Active</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-indigo-200 text-xs font-medium uppercase tracking-wider">
              <span>Combined Seats</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold mt-2 text-white">
              {totalCombinedSeats.toLocaleString()} <span className="text-xs font-normal text-indigo-300">Learners</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-indigo-200 text-xs font-medium uppercase tracking-wider">
              <span>Isolation Mode</span>
              <HardDrive className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-sm font-bold mt-2 text-cyan-200 truncate">
              Local Storage / SQLite per Tenant
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-indigo-200 text-xs font-medium uppercase tracking-wider">
              <span>Platform Revenue</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold mt-2 text-white">
              {totalRevenue}
            </div>
          </div>
        </div>
      </div>

      {/* B. ACTIVE TENANT CONTEXT SWITCHER */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-blue-50/40 shadow-sm">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Developer Testing Scope</div>
              <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Active Developer Context: <span className="text-indigo-700">{activeTenantObj.name}</span>
              </div>
              <div className="text-xs text-slate-500">
                Namespace Key: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">{activeTenantObj.storageKey}</code>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={activeCode} onValueChange={handleContextChange}>
              <SelectTrigger className="w-full sm:w-[280px] bg-white border-indigo-200 font-medium text-slate-800">
                <SelectValue placeholder="Select active tenant context..." />
              </SelectTrigger>
              <SelectContent>
                {tenants.map(t => (
                  <SelectItem key={t.id} value={t.code} className="font-medium">
                    {t.name} ({t.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* C. TENANT DIRECTORY TABLE CARD */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Tenant Directory & Instances</CardTitle>
              <CardDescription>Manage multi-school isolated databases, tier allocations, and licensing statuses.</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search tenants or code..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50/50"
                />
              </div>

              <Select value={tierFilter} onValueChange={(val: any) => setTierFilter(val)}>
                <SelectTrigger className="w-[140px] bg-slate-50/50">
                  <SelectValue placeholder="Filter Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Tiers</SelectItem>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                  <th className="py-3 px-4">Tenant / School Name</th>
                  <th className="py-3 px-4">Plan & Capacity</th>
                  <th className="py-3 px-4">Storage / DB Key</th>
                  <th className="py-3 px-4">License Status</th>
                  <th className="py-3 px-4">Last Sync</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No tenants found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t) => {
                    const isCurrentActive = t.code === activeCode;
                    const seatPercentage = Math.round((t.currentSeats / t.maxSeats) * 100);

                    return (
                      <tr key={t.id} className={`hover:bg-slate-50/80 transition-colors ${isCurrentActive ? 'bg-indigo-50/30 font-medium' : ''}`}>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${isCurrentActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                              {t.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-2">
                                {t.name}
                                {isCurrentActive && (
                                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-[10px] px-1.5 py-0">Active Context</Badge>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono font-semibold text-indigo-600">{t.code}</code>
                                <span>•</span>
                                <span>Est. {t.establishedYear}</span>
                                <span>•</span>
                                <span>{t.location}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="space-y-1.5 min-w-[140px]">
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant="outline" className={`font-semibold ${t.tier === 'Enterprise' ? 'border-purple-200 bg-purple-50 text-purple-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                                {t.tier}
                              </Badge>
                              <span className="text-slate-600 font-medium">{t.currentSeats} / {t.maxSeats}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${seatPercentage > 90 ? 'bg-amber-500' : 'bg-indigo-600'}`} 
                                style={{ width: `${Math.min(seatPercentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-mono text-xs text-slate-600">
                          <div className="bg-slate-100/80 px-2 py-1 rounded border border-slate-200/60 inline-block">
                            {t.storageKey}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <Badge className={`font-medium ${
                            t.licenseStatus === 'Active' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' :
                            t.licenseStatus === 'Grace Period' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' :
                            'bg-rose-100 text-rose-800 hover:bg-rose-100'
                          }`}>
                            {t.licenseStatus}
                          </Badge>
                        </td>

                        <td className="py-4 px-4 text-xs text-slate-500">
                          {t.lastSync}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button 
                              size="sm" 
                              variant={isCurrentActive ? "default" : "outline"}
                              className={isCurrentActive ? "bg-indigo-600 hover:bg-indigo-700 text-xs h-8" : "text-xs h-8"}
                              onClick={() => handleContextChange(t.code)}
                            >
                              {isCurrentActive ? 'Active' : 'Switch'}
                            </Button>

                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs h-8 gap-1 text-slate-700"
                              onClick={() => handleOpenLicense(t)}
                              title="Manage License Key"
                            >
                              <Key className="w-3.5 h-3.5 text-indigo-500" /> License
                            </Button>

                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className={`text-xs h-8 ${t.licenseStatus === 'Suspended' ? 'text-emerald-600 hover:text-emerald-700' : 'text-rose-600 hover:text-rose-700'}`}
                              onClick={() => handleToggleSuspend(t)}
                              title={t.licenseStatus === 'Suspended' ? 'Activate Tenant' : 'Suspend Tenant'}
                            >
                              <Power className="w-3.5 h-3.5" />
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

      {/* 2. TENANT PROVISIONING MODAL */}
      <Dialog open={isProvisionModalOpen} onOpenChange={setIsProvisionModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <Building2 className="w-5 h-5 text-indigo-600" /> Provision New Tenant Instance
            </DialogTitle>
            <DialogDescription>
              Create an isolated school instance with dedicated namespace storage, capacity limits, and initial admin credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProvisionSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName" className="text-xs font-semibold uppercase tracking-wider text-slate-700">School Name *</Label>
                <Input 
                  id="schoolName"
                  placeholder="e.g., St. Teresa Academy"
                  value={newSchoolName}
                  onChange={e => setNewSchoolName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantCode" className="text-xs font-semibold uppercase tracking-wider text-slate-700">Tenant Code Prefix *</Label>
                <Input 
                  id="tenantCode"
                  placeholder="e.g., ST-TERESA"
                  value={newTenantCode}
                  onChange={e => setNewTenantCode(e.target.value.toUpperCase())}
                  required
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Year Established</Label>
                <Input 
                  value={newYearEst}
                  onChange={e => setNewYearEst(e.target.value)}
                  placeholder="1991"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">License Tier</Label>
                <Select value={newTier} onValueChange={(val: any) => setNewTier(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Seat Limit</Label>
                <Select value={newMaxSeats} onValueChange={setNewMaxSeats}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="250">250 Learners</SelectItem>
                    <SelectItem value="500">500 Learners</SelectItem>
                    <SelectItem value="1000">1,000 Learners</SelectItem>
                    <SelectItem value="2500">2,500 Learners</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Admin Account Name</Label>
                <Input 
                  placeholder="e.g., Principal Wanjiku"
                  value={newAdminName}
                  onChange={e => setNewAdminName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Admin Email / Phone</Label>
                <Input 
                  placeholder="admin@school.ac.ke"
                  value={newAdminContact}
                  onChange={e => setNewAdminContact(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Database Isolation Method</Label>
              <Select value={newIsolation} onValueChange={(val: any) => setNewIsolation(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Isolated SQLite DB">Isolated SQLite DB (Recommended)</SelectItem>
                  <SelectItem value="Local Namespace">Local Namespace (IndexedDB / LocalStorage prefix)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-500">
                Ensures zero cross-tenant data leakage by enforcing strict key namespacing (<code className="font-mono text-indigo-600">tenant_data_{newTenantCode ? newTenantCode.toLowerCase().replace(/-/g, '_') : 'code'}_*</code>).
              </p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsProvisionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2">
                Provision Tenant Instance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* LICENSE MANAGEMENT MODAL */}
      <Dialog open={isLicenseModalOpen} onOpenChange={setIsLicenseModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <Key className="w-5 h-5 text-indigo-600" /> Manage License: {selectedTenantForLicense?.name}
            </DialogTitle>
            <DialogDescription>
              Generate or validate secure cryptographic license keys for offline and cloud synchronization.
            </DialogDescription>
          </DialogHeader>

          {selectedTenantForLicense && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="text-xs text-slate-500 font-medium">Tenant Code & Namespace</div>
                <div className="font-mono text-xs font-bold text-indigo-600 flex items-center justify-between">
                  <span>{selectedTenantForLicense.code}</span>
                  <span className="text-slate-500 font-normal">{selectedTenantForLicense.storageKey}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Cryptographic License Key</Label>
                <div className="flex gap-2">
                  <Input 
                    value={licenseKeyInput} 
                    readOnly 
                    className="font-mono text-xs bg-slate-50 font-bold text-slate-800"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(licenseKeyInput);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                      showSuccess('License key copied to clipboard!');
                    }}
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Validity Term</Label>
                <Select value={licenseDuration} onValueChange={setLicenseDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30 Days">30 Days (Monthly Trial)</SelectItem>
                    <SelectItem value="1 Year">1 Year Academic Subscription</SelectItem>
                    <SelectItem value="Lifetime">Lifetime Offline Deployment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Activating this key immediately unlocks all enterprise modules ({selectedTenantForLicense.tier} Tier) and refreshes LAN synchronization trust tokens.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsLicenseModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLicense} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              Save & Activate License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
