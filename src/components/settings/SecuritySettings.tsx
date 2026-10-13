import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { showSuccess } from "@/utils/toast";
import { UserCheck, Shield, Key, Eye, EyeOff } from 'lucide-react';

export function SecuritySettings() {
  const [adminEmail, setAdminEmail] = useState<string>(
    () => localStorage.getItem('munyaka_admin_email') || 'admin@munyaka.ac.ke'
  );
  const [adminPassword, setAdminPassword] = useState<string>(
    () => localStorage.getItem('munyaka_admin_password') || 'admin123'
  );
  const [showAdminPass, setShowAdminPass] = useState<boolean>(false);

  const [ownerEmail, setOwnerEmail] = useState<string>(
    () => localStorage.getItem('munyaka_owner_email') || 'director@munyaka.ac.ke'
  );
  const [ownerPassword, setOwnerPassword] = useState<string>(
    () => localStorage.getItem('munyaka_owner_password') || 'owner123'
  );
  const [showOwnerPass, setShowOwnerPass] = useState<boolean>(false);

  const handleUpdateAdmin = () => {
    localStorage.setItem('munyaka_admin_email', adminEmail);
    localStorage.setItem('munyaka_admin_password', adminPassword);
    showSuccess('Admin credentials saved successfully!');
  };

  const handleUpdateOwner = () => {
    localStorage.setItem('munyaka_owner_email', ownerEmail);
    localStorage.setItem('munyaka_owner_password', ownerPassword);
    showSuccess('Owner credentials saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6 animate-in fade-in">
      {/* Admin Credentials Block */}
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
        <CardHeader className="px-0 pt-0 pb-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <UserCheck size={20} />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">School Administrator</CardTitle>
                <CardDescription>Primary administrative access control</CardDescription>
              </div>
            </div>
            <Badge className="bg-indigo-50 text-indigo-700 font-medium">Default Admin</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pt-6 space-y-4">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Username / Email</Label>
            <Input
              type="text"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Password</Label>
            <div className="relative flex items-center">
              <Input
                type={showAdminPass ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowAdminPass(!showAdminPass)}
                className="absolute right-3 text-slate-400 hover:text-indigo-600 focus:outline-none"
              >
                {showAdminPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleUpdateAdmin}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm shadow-indigo-500/20 flex items-center gap-2"
            >
              <Key size={15} /> Update Admin Credentials
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Owner Credentials Block */}
      <Card className="border-none shadow-sm rounded-3xl bg-white p-6 sm:p-8">
        <CardHeader className="px-0 pt-0 pb-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Shield size={20} />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">School Owner / Director</CardTitle>
                <CardDescription>Principal authority and executive billing control</CardDescription>
              </div>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 font-medium">Principal Authority</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pt-6 space-y-4">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Username / Email</Label>
            <Input
              type="text"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Password</Label>
            <div className="relative flex items-center">
              <Input
                type={showOwnerPass ? "text" : "password"}
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowOwnerPass(!showOwnerPass)}
                className="absolute right-3 text-slate-400 hover:text-emerald-600 focus:outline-none"
              >
                {showOwnerPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleUpdateOwner}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium shadow-sm flex items-center gap-2"
            >
              <Key size={15} /> Update Owner Credentials
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SecuritySettings;
