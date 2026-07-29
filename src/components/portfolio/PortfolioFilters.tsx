"use client";

import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

interface PortfolioFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedArea: string;
  setSelectedArea: (value: string) => void;
}

export const PortfolioFilters: React.FC<PortfolioFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedArea,
  setSelectedArea
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="md:col-span-3 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input 
          placeholder="Search by student name or artifact title..." 
          className="pl-11 rounded-2xl h-12 bg-white border-none shadow-sm font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <select 
        className="rounded-2xl h-12 bg-white border-none shadow-sm px-4 text-sm font-bold text-slate-700 outline-none cursor-pointer"
        value={selectedArea}
        onChange={(e) => setSelectedArea(e.target.value)}
      >
        <option value="all">All Learning Areas</option>
        <option value="Creative Arts">Creative Arts</option>
        <option value="English">English</option>
        <option value="Science">Science</option>
        <option value="Kiswahili">Kiswahili</option>
        <option value="Mathematics">Mathematics</option>
      </select>
    </div>
  );
};