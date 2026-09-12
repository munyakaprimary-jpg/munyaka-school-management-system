import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Shield, Key, Wifi, CreditCard, Server, Activity, CheckCircle2, RefreshCw,
  Terminal, Cpu, Building2, Settings as SettingsIcon, FileText, Monitor,
  FolderArchive, Plus, Search, Download, Trash2, Power, AlertTriangle, Play,
  Laptop, HardDrive, Printer, Check, Copy
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

export default function DevDashboard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const location = useLocation();
  const path = location.pathname;

  // ── Settings State ──
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [telemetry, setTelemetry] = useState(true);
  const [apiEndpoint, setApiEndpoint] = useState('https://api.munyaka-school.net/v1');
  const [dbHost, setDbHost] = useState('db.local.mesh:5432');

  // ── Schools State ──
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schools, setSchools] = useState([
    { id: 'SCH-01', name: 'Munyaka Primary & Junior Secondary', domain: 'munyaka.portal', students: 480, status: 'Active', tier: 'Enterprise' },
    { id: 'SCH-02', name: 'Munyaka Academy (West Campus)', domain: 'west.munyaka.portal', students: 210, status: 'Active', tier: 'Standard' },
    { id: 'SCH-03', name: 'Munyaka E-Learning Hub', domain: 'learn.munyaka.portal', students: 65, status: 'Trial', tier: 'Basic' },
  ]);

  // ── Licenses State ──
  const [licenseSearch, setLicenseSearch] = useState('');
  const [licenses, setLicenses] = useState([
    { key: 'MUNYAKA-PRO-2026-X9K2', school: 'Munyaka Primary & JS', type: 'Enterprise', seats: 'Unlimited', expires: '2027-01-15', status: 'Active' },
    { key: 'MUNYAKA-LITE-8812-B4F1', school: 'Munyaka Academy West', type: 'Standard', seats: '350 Seats', expires: '2026-11-30', status: 'Active' },
    { key: 'MUNYAKA-DEV-TRIAL-009A', school: 'Munyaka E-Learning Hub', type: 'Trial', seats: '50 Seats', expires: '2026-05-01', status: 'Expiring Soon' },
  ]);

  // ── Payments State ──
  const [payments, setPayments] = useState([
    { id: 'TXN-90812', date: '2026-03-15', school: 'Munyaka Primary & JS', method: 'M-Pesa Express', ref: 'QKE89128LK', amount: 'KES 85,000', status: 'Verified' },
    { id: 'TXN-90805', date: '2026-02-10', school: 'Munyaka Academy West', method: 'Bank Transfer (KCB)', ref: 'KCB-99201', amount: 'KES 45,000', status: 'Verified' },
    { id: 'TXN-90799', date: '2026-01-05', school: 'Munyaka Primary & JS', method: 'M-Pesa Paybill', ref: 'QJA11049PO', amount: 'KES 120,000', status: 'Verified' },
  ]);

  // ── LAN Nodes State ──
  const [lanConfig, setLanConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('munyaka_lan_config');
      if (saved) return JSON.parse(saved);
    } catch { /* fallback */ }
    return {
      hostIp: 'http://192.168.1.100',
      port: '8080',
      subnet: '192.168.1.255',
      syncInterval: '30',
      wifiMesh: true,
      autoConnect: true,
    };
  });
  const [isTestingLan, setIsTestingLan] = useState(false);

  const [meshNodes, setMeshNodes] = useState([
    { ip: '192.168.1.100', name: 'Master LAN Hub Server', role: 'Gateway', ping: '1.2ms', status: 'Online' },
    { ip: '192.168.1.104', name: 'Admin Office POS / Cashier', role: 'Peer Node', ping: '2.4ms', status: 'Online' },
    { ip: '192.168.1.112', name: 'Staffroom Assessment Client', role: 'Peer Node', ping: '4.1ms', status: 'Online' },
    { ip: '192.168.1.150', name: 'Library Kiosk Tablet', role: 'Subscriber', ping: '8.0ms', status: 'Online' },
  ]);

  // ── Devices State ──
  const [devices, setDevices] = useState([
    { id: 'DEV-PRN-01', name: 'Epson TM-T88VI Thermal Receipt Printer', type: 'Printer', port: 'USB-001', status: 'Ready' },
    { id: 'DEV-POS-02', name: 'Honeywell Barcode & QR Scanner', type: 'Scanner', port: 'HID-COM3', status: 'Active' },
    { id: 'DEV-SRV-01', name: 'Local Raspberry Pi LAN Mesh Router', type: 'Server Node', port: 'ETH0', status: 'Operational' },
  ]);

  // ── Logs State ──
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'DEBUG' | 'WARN'>('ALL');
  const [logs, setLogs] = useState([
    { id: 1, time: '10:45:02', level: 'INFO', msg: 'Local LAN mesh peer discovery broadcast completed. 4 nodes responding.' },
    { id: 2, time: '10:44:18', level: 'DEBUG', msg: 'License validation heartbeat received from master key MUNYAKA-PRO-2026-X9K2.' },
    { id: 3, time: '10:42:55', level: 'INFO', msg: 'Offline SQLite transaction queue synced with upstream Central Data Service.' },
    { id: 4, time: '10:40:11', level: 'WARN', msg: 'Thermal receipt printer reported low roll status on port USB-001.' },
    { id: 5, time: '10:38:00', level: 'INFO', msg: 'Automated database checkpoint completed: munyaka_ledger.db (4.2 MB).' },
  ]);

  const handleRefreshLicenses = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showSuccess('License keys and subscription nodes synchronized successfully.');
    }, 800);
  };

  const handleGenerateLicense = () => {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKey = `MUNYAKA-PRO-2026-${randomHex}`;
    setLicenses([
      { key: newKey, school: 'Provisioned Campus', type: 'Enterprise', seats: '500 Seats', expires: '2027-04-01', status: 'Active' },
      ...licenses
    ]);
    showSuccess(`Generated license key: ${newKey}`);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    showSuccess('License key copied to clipboard.');
  };

  const filteredLogs = logFilter === 'ALL' ? logs : logs.filter(l => l.level === logFilter);

  const renderContent = () => {
    switch (path) {
      case '/dev/settings':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <SettingsIcon size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Platform & Environment Configuration</h2>
                    <p className="text-xs text-slate-500 font-medium">Global system variables, master endpoints, and runtime operational parameters</p>
                  </div>
                </div>
                <Button onClick={() => showSuccess('Environment parameters saved successfully.')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 px-5">
                  Save Changes
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Primary API Gateway</label>
                  <Input value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} className="rounded-xl border-slate-200 font-mono text-sm" />
                  <p className="text-[11px] text-slate-400">Master REST and Webhook gateway for regional cloud sync.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Internal Mesh Database Host</label>
                  <Input value={dbHost} onChange={(e) => setDbHost(e.target.value)} className="rounded-xl border-slate-200 font-mono text-sm" />
                  <p className="text-[11px] text-slate-400">Target socket connection for LAN data replication.</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Operational Toggles</h3>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Maintenance Mode</h4>
                    <p className="text-xs text-slate-500">Temporarily freeze student & parent portal updates during software patches</p>
                  </div>
                  <Button
                    variant={maintenanceMode ? "destructive" : "outline"}
                    onClick={() => {
                      setMaintenanceMode(!maintenanceMode);
                      showSuccess(`Maintenance mode ${!maintenanceMode ? 'Enabled' : 'Disabled'}`);
                    }}
                    className="font-bold rounded-xl h-9"
                  >
                    <Power size={14} className="mr-2" />
                    {maintenanceMode ? 'ACTIVE (Enabled)' : 'Disabled'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Telemetry & Diagnostic Traces</h4>
                    <p className="text-xs text-slate-500">Automated reporting of client network drops and local storage anomalies</p>
                  </div>
                  <Button
                    variant={telemetry ? "default" : "outline"}
                    onClick={() => {
                      setTelemetry(!telemetry);
                      showSuccess(`Telemetry ${!telemetry ? 'Enabled' : 'Disabled'}`);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl h-9 text-white"
                  >
                    <Activity size={14} className="mr-2" />
                    {telemetry ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case '/dev/schools':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Multi-Tenant School Directory</h2>
                    <p className="text-xs text-slate-500 font-medium">Provisioned campus instances, isolated tenant partitions, and student headcounts</p>
                  </div>
                </div>
                <Button onClick={() => showSuccess('Provisioning form opened.')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 px-4 gap-2">
                  <Plus size={16} /> Provision New Campus
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search schools by name or domain..."
                    value={schoolSearch}
                    onChange={(e) => setSchoolSearch(e.target.value)}
                    className="pl-10 rounded-xl border-slate-200"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Campus / School</th>
                      <th className="p-4">Tenant Domain</th>
                      <th className="p-4">Learners</th>
                      <th className="p-4">Plan Tier</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {schools.filter(s => s.name.toLowerCase().includes(schoolSearch.toLowerCase())).map((school) => (
                      <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{school.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{school.id}</p>
                        </td>
                        <td className="p-4 font-mono text-xs text-indigo-600">{school.domain}</td>
                        <td className="p-4 font-bold">{school.students} learners</td>
                        <td className="p-4">
                          <Badge className="bg-slate-100 text-slate-800 border-none">{school.tier}</Badge>
                        </td>
                        <td className="p-4">
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">{school.status}</Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => showSuccess(`Inspecting database for ${school.name}`)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50">
                            Inspect DB
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case '/dev/subscriptions':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">App Subscriptions & Licensing Tiers</h2>
                    <p className="text-xs text-slate-500 font-medium">Manage institutional recurring plans, active renewals, and quota allocations</p>
                  </div>
                </div>
                <Button onClick={() => showSuccess('Subscription sync triggered.')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl h-10 px-4">
                  Check Renewals
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="p-6 rounded-3xl border-2 border-purple-500 bg-purple-50/20 space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge className="bg-purple-600 text-white font-bold">Current Active</Badge>
                    <span className="text-xs font-bold text-slate-400">Tier 3</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Enterprise Campus</h3>
                  <p className="text-xs text-slate-500">Unlimited learners, offline LAN mesh sync, unlimited staff access tokens.</p>
                  <p className="text-2xl font-black text-purple-600">KES 85,000 <span className="text-xs font-normal text-slate-400">/ Year</span></p>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl">Manage Quotas</Button>
                </div>

                <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge className="bg-slate-100 text-slate-600 font-bold">Available</Badge>
                    <span className="text-xs font-bold text-slate-400">Tier 2</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Standard School</h3>
                  <p className="text-xs text-slate-500">Up to 400 learners, 15 staff credentials, standard grade reports.</p>
                  <p className="text-2xl font-black text-slate-900">KES 45,000 <span className="text-xs font-normal text-slate-400">/ Year</span></p>
                  <Button variant="outline" className="w-full font-bold rounded-xl">View Details</Button>
                </div>

                <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge className="bg-slate-100 text-slate-600 font-bold">Available</Badge>
                    <span className="text-xs font-bold text-slate-400">Tier 1</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Starter / Trial</h3>
                  <p className="text-xs text-slate-500">Up to 100 learners, basic attendance taking, standalone single device.</p>
                  <p className="text-2xl font-black text-slate-900">Free <span className="text-xs font-normal text-slate-400">30-day eval</span></p>
                  <Button variant="outline" className="w-full font-bold rounded-xl">View Details</Button>
                </div>
              </div>
            </div>
          </div>
        );

      case '/dev/licenses':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Key size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Cryptographic License Key Management</h2>
                    <p className="text-xs text-slate-500 font-medium">Activation keys, hardware machine ID binding, and offline authorization certificates</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleGenerateLicense} className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl h-10 px-4 gap-2">
                    <Plus size={16} /> Generate New Key
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">License Key</th>
                      <th className="p-4">Assigned Campus</th>
                      <th className="p-4">Tier</th>
                      <th className="p-4">Capacity</th>
                      <th className="p-4">Expiry Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {licenses.map((lic) => (
                      <tr key={lic.key} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900 text-xs">
                          {lic.key}
                        </td>
                        <td className="p-4 font-bold">{lic.school}</td>
                        <td className="p-4">
                          <Badge className="bg-slate-100 text-slate-700 border-none font-bold">{lic.type}</Badge>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-600">{lic.seats}</td>
                        <td className="p-4 font-mono text-xs">{lic.expires}</td>
                        <td className="p-4">
                          <Badge className={lic.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border-none font-bold' : 'bg-amber-100 text-amber-800 border-none font-bold'}>
                            {lic.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleCopyKey(lic.key)} className="text-xs font-bold text-slate-600 hover:bg-slate-100">
                            <Copy size={14} className="mr-1" /> Copy
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case '/dev/payments':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Payment History & Billing Invoices</h2>
                    <p className="text-xs text-slate-500 font-medium">Reconciled subscription payments, transaction identifiers, and official receipts</p>
                  </div>
                </div>
                <Button onClick={() => showSuccess('Exporting billing records as CSV...')} variant="outline" className="font-bold rounded-xl h-10 px-4 gap-2">
                  <Download size={16} /> Export CSV
                </Button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Invoice #</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">School</th>
                      <th className="p-4">Payment Method</th>
                      <th className="p-4">Reference</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-indigo-600 text-xs">{p.id}</td>
                        <td className="p-4 text-xs text-slate-500">{p.date}</td>
                        <td className="p-4 font-bold text-slate-900">{p.school}</td>
                        <td className="p-4 text-xs font-medium">{p.method}</td>
                        <td className="p-4 font-mono text-xs text-slate-600">{p.ref}</td>
                        <td className="p-4 font-black text-slate-900">{p.amount}</td>
                        <td className="p-4">
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">{p.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case '/dev/lan-sync':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Wifi size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Local Area Network (LAN) Mesh Synchronization</h2>
                    <p className="text-xs text-slate-500 font-medium">Real-time peer-to-peer offline database replication across campus devices</p>
                  </div>
                </div>
                <Button onClick={() => showSuccess('Broadcasted mesh ping to all local subnet nodes.')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 px-4 gap-2">
                  <RefreshCw size={16} /> Force Peer Ping
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subnet Broadcast</p>
                  <p className="text-base font-black text-slate-900 mt-1 font-mono">192.168.1.255:8080</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Offline Sync Queue</p>
                  <p className="text-base font-black text-emerald-600 mt-1">0 Pending Changes</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Local DB Protocol</p>
                  <p className="text-base font-black text-slate-900 mt-1">SQLite WAL Mesh</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Device Name</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4">Node Role</th>
                      <th className="p-4">Latency</th>
                      <th className="p-4">Mesh Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {meshNodes.map((node) => (
                      <tr key={node.ip} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                          <Cpu size={16} className="text-indigo-600" />
                          {node.name}
                        </td>
                        <td className="p-4 font-mono text-xs">{node.ip}</td>
                        <td className="p-4">
                          <Badge className="bg-slate-100 text-slate-700 border-none">{node.role}</Badge>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-500">{node.ping}</td>
                        <td className="p-4">
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold flex items-center gap-1 w-max">
                            <CheckCircle2 size={12} /> {node.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case '/dev/devices':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Monitor size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Connected Hardware & Peripherals</h2>
                    <p className="text-xs text-slate-500 font-medium">Direct receipt printers, barcode scanners, and school point-of-sale hardware</p>
                  </div>
                </div>
                <Button onClick={() => showSuccess('Scanning USB & serial ports for connected peripherals...')} className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl h-10 px-4 gap-2">
                  <RefreshCw size={16} /> Pair New Device
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {devices.map((dev) => (
                  <div key={dev.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="w-10 h-10 rounded-2xl bg-white text-indigo-600 flex items-center justify-center shadow-sm">
                        {dev.type === 'Printer' ? <Printer size={20} /> : <HardDrive size={20} />}
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">{dev.status}</Badge>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{dev.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">{dev.id} • {dev.port}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => showSuccess(`Sent test print / diagnostic signal to ${dev.name}`)} className="w-full font-bold text-xs">
                      Send Test Signal
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case '/dev/logs':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    <FolderArchive size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">System Logs & Real-Time Kernel Metrics</h2>
                    <p className="text-xs text-slate-500 font-medium">Diagnostic telemetry, database checkpoints, and security audit trail</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setLogs([])} className="font-bold rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50">
                    <Trash2 size={14} className="mr-1" /> Clear Logs
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(['ALL', 'INFO', 'DEBUG', 'WARN'] as const).map((lvl) => (
                  <Button
                    key={lvl}
                    variant={logFilter === lvl ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLogFilter(lvl)}
                    className="font-bold rounded-xl text-xs"
                  >
                    {lvl}
                  </Button>
                ))}
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 text-slate-200 font-mono text-xs space-y-2.5 overflow-x-auto shadow-inner border border-slate-800">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <span className="text-slate-500">[{log.time}]</span>
                      <span className={log.level === 'WARN' ? 'text-amber-400 font-bold' : log.level === 'DEBUG' ? 'text-indigo-400' : 'text-emerald-400 font-bold'}>
                        [{log.level}]
                      </span>
                      <span className="text-slate-300">{log.msg}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 py-4 text-center">No logs matching current filter.</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <>
            {/* ── System Health & Stats Grid ──────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Activity size={24} />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">Optimal</Badge>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">System Status</p>
                  <h3 className="text-2xl font-black text-slate-900">99.98%</h3>
                  <p className="text-[11px] text-slate-500 font-medium">LAN server operational</p>
                </div>
              </Card>

              <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Key size={24} />
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border-none font-bold">Active</Badge>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Licenses</p>
                  <h3 className="text-2xl font-black text-slate-900">1 / 1 Seat</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Enterprise Edition</p>
                </div>
              </Card>

              <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Wifi size={24} />
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-800 border-none font-bold">Connected</Badge>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Connected Nodes</p>
                  <h3 className="text-2xl font-black text-slate-900">4 Devices</h3>
                  <p className="text-[11px] text-slate-500 font-medium">POS, Printers, LAN Node</p>
                </div>
              </Card>

              <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <CreditCard size={24} />
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 border-none font-bold">Verified</Badge>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">App Subscriptions</p>
                  <h3 className="text-2xl font-black text-slate-900">Annual Plan</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Renews Jan 2027</p>
                </div>
              </Card>
            </div>

            {/* ── Detailed Management Panels ──────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card className="border-none shadow-xl rounded-3xl bg-white p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Key size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">License & Key Management</h3>
                    <p className="text-xs text-slate-500">Cryptographic validation and hardware activation keys</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">License Key</p>
                      <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">MUNYAKA-PRO-2026-X9K2</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">Valid</Badge>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hardware Fingerprint</p>
                      <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">HWID-8849-UUID-0192</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">Locked</span>
                  </div>
                </div>
              </Card>

              <Card className="border-none shadow-xl rounded-3xl bg-white p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Wifi size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Connected Devices & LAN Nodes</h3>
                    <p className="text-xs text-slate-500">Printers, POS terminals, and local mesh routers</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2"><Cpu size={16} className="text-indigo-600" /> Main LAN Server Hub</span>
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14} /> Online</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2"><Server size={16} className="text-indigo-600" /> Receipt Thermal Printer</span>
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14} /> Ready</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2"><Terminal size={16} className="text-indigo-600" /> Offline Sync Node</span>
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14} /> Active</span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest border border-amber-500/30">
              <Shield size={14} /> Platform Developer Console
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {path === '/dev/settings' && 'Platform Settings'}
              {path === '/dev/schools' && 'School Management'}
              {path === '/dev/subscriptions' && 'App Subscriptions & Renewals'}
              {path === '/dev/licenses' && 'License Key Management'}
              {path === '/dev/payments' && 'Payment History & Billing'}
              {path === '/dev/lan-sync' && 'LAN & Offline Sync'}
              {path === '/dev/devices' && 'Connected Hardware Devices'}
              {path === '/dev/logs' && 'System Logs & Metrics'}
              {path === '/dev/dashboard' && 'Software Management & Licensing'}
            </h1>
            <p className="text-sm text-slate-400 max-w-xl font-medium">
              Dedicated technical control center for app subscriptions, license keys, cryptographic nodes, and connected hardware peripherals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefreshLicenses}
              disabled={isSyncing}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-amber-900/30 gap-2 transition-all active:scale-95"
            >
              <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
              Sync Nodes
            </Button>
          </div>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
