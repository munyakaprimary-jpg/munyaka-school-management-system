import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const GradeDropdown = ({ selectedGrade, setSelectedGrade, sortedGrades }: { selectedGrade: string; setSelectedGrade: (val: string) => void; sortedGrades: any[] }) => {
  return (
    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
      <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
        <SelectValue placeholder="Select grade" />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {sortedGrades.map(g => (
          <SelectItem key={g.id} value={g.id}>
            {g.name} ({g.category})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const StreamDropdown = ({ selectedStream, setSelectedStream, availableStreams, selectedGrade }: { selectedStream: string; setSelectedStream: (val: string) => void; availableStreams: string[]; selectedGrade: string }) => {
  return (
    <Select value={selectedStream} onValueChange={setSelectedStream} disabled={!selectedGrade}>
      <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
        <SelectValue placeholder={selectedGrade ? 'Choose stream...' : 'Select grade first'} />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {availableStreams.map(s => (
          <SelectItem key={s} value={s}>{s}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
