"use client";

import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from 'lucide-react';
import { SYSTEM_ROLE_LABELS } from '@/types/staff-access';

interface PreRegFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

const PreRegFilters: React.FC<PreRegFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="relative md:col-span-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input
          placeholder="Search staff or keys..."
          className="pl-11 h-12 rounded-2xl bg-slate-50 border-none font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Select value={roleFilter} onValueChange={setRoleFilter}>
        <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 text-sm">
          <SelectValue placeholder="All Roles" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          <SelectItem value="all">All System Roles</SelectItem>
          {Object.keys(SYSTEM_ROLE_LABELS).map((role) => (
            <SelectItem key={role} value={role}>
              {SYSTEM_ROLE_LABELS[role as keyof typeof SYSTEM_ROLE_LABELS].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 text-sm">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="Pre-Registered">Pre-Registered</SelectItem>
          <SelectItem value="Active">Active</SelectItem>
          <SelectItem value="Suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default PreRegFilters;