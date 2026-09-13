import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface TenantFormData {
  tenantCode: string;
  location: string;
  subscriptionPlan: 'Starter' | 'Enterprise' | 'Custom';
  allocatedSeats: number;
  databaseStrategy: 'Isolated SQLite (File Sandbox)' | 'Cloud PostgreSQL (Isolated Schema)' | 'Shared Local Storage';
  adminEmail: string;
  adminPhone: string;
  schoolName: string;
}

export interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TenantFormData) => void;
  initialData?: Partial<TenantFormData>;
  title?: string;
}

export function TenantConfigModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = 'Provision New School Tenant Instance'
}: TenantModalProps) {
  const [formData, setFormData] = useState<TenantFormData>({
    schoolName: initialData?.schoolName || '',
    tenantCode: initialData?.tenantCode || 'SCH-375',
    location: initialData?.location || 'Nairobi, Kenya',
    subscriptionPlan: initialData?.subscriptionPlan || 'Starter',
    allocatedSeats: initialData?.allocatedSeats || 500,
    databaseStrategy: initialData?.databaseStrategy || 'Isolated SQLite (File Sandbox)',
    adminEmail: initialData?.adminEmail || 'admin@school.ac.ke',
    adminPhone: initialData?.adminPhone || '+254 700 000000'
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        schoolName: initialData?.schoolName || '',
        tenantCode: initialData?.tenantCode || ('SCH-' + Math.floor(100 + Math.random() * 900)),
        location: initialData?.location || 'Nairobi, Kenya',
        subscriptionPlan: initialData?.subscriptionPlan || 'Starter',
        allocatedSeats: initialData?.allocatedSeats || 500,
        databaseStrategy: initialData?.databaseStrategy || 'Isolated SQLite (File Sandbox)',
        adminEmail: initialData?.adminEmail || 'admin@school.ac.ke',
        adminPhone: initialData?.adminPhone || '+254 700 000000'
      });
    }
  }, [isOpen, initialData]);

  const handleChange = (field: keyof TenantFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Configure school name, tenant code, isolation database strategy, and license limits.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schoolName" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                School Name *
              </Label>
              <Input
                id="schoolName"
                placeholder="e.g. St. Teresa Primary"
                value={formData.schoolName}
                onChange={e => handleChange('schoolName', e.target.value)}
                required
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenantCode" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Tenant Code / Slug *
              </Label>
              <Input
                id="tenantCode"
                placeholder="e.g. SCH-375"
                value={formData.tenantCode}
                onChange={e => handleChange('tenantCode', e.target.value.toUpperCase())}
                required
                className="font-mono uppercase bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Location / Region
              </Label>
              <Input
                id="location"
                placeholder="e.g. Nairobi, Kenya"
                value={formData.location}
                onChange={e => handleChange('location', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionPlan" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Subscription Plan
              </Label>
              <Select 
                value={formData.subscriptionPlan} 
                onValueChange={(val: any) => handleChange('subscriptionPlan', val)}
              >
                <SelectTrigger id="subscriptionPlan" className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter (Up to 500 seats)</SelectItem>
                  <SelectItem value="Enterprise">Enterprise (Up to 1000 seats)</SelectItem>
                  <SelectItem value="Custom">Custom (Unlimited)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allocatedSeats" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Allocated Student Seats Limit
              </Label>
              <Select 
                value={formData.allocatedSeats.toString()} 
                onValueChange={(val) => handleChange('allocatedSeats', Number(val))}
              >
                <SelectTrigger id="allocatedSeats" className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select max seats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">300 Seats</SelectItem>
                  <SelectItem value="500">500 Seats</SelectItem>
                  <SelectItem value="1000">1000 Seats</SelectItem>
                  <SelectItem value="2500">2,500 Seats (Custom)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="databaseStrategy" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Database / Isolation Strategy
              </Label>
              <Select 
                value={formData.databaseStrategy} 
                onValueChange={(val: any) => handleChange('databaseStrategy', val)}
              >
                <SelectTrigger id="databaseStrategy" className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select isolation strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Isolated SQLite (File Sandbox)">Isolated SQLite (File Sandbox)</SelectItem>
                  <SelectItem value="Cloud PostgreSQL (Isolated Schema)">Cloud PostgreSQL (Isolated Schema)</SelectItem>
                  <SelectItem value="Shared Local Storage">Shared Local Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-2">
              <Label htmlFor="adminEmail" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Administrator Contact Email
              </Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@school.ac.ke"
                value={formData.adminEmail}
                onChange={e => handleChange('adminEmail', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPhone" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Administrator Phone
              </Label>
              <Input
                id="adminPhone"
                placeholder="+254 700 000000"
                value={formData.adminPhone}
                onChange={e => handleChange('adminPhone', e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="rounded-xl border-slate-200 dark:border-slate-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
            >
              Save Configuration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
