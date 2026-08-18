import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { GRADES_DATA, Grade, Stream } from '@/lib/mock-data';
import { sortGrades } from '@/utils/gradeSort';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Get grades from central store
const grades = useSelector(state => state.school.grades);

// Sort grades in educational order using sortGrades helper
const sortedGrades = useMemo(() => {
  return sortGrades(grades);
}, [grades]);

// Get streams for selected grade
const availableStreams = useMemo(() => {
  if (!selectedGrade) return [];
  const grade = grades.find(g => g.id === selectedGrade);
  return grade ? grade.streams.map(s => s.name) : [];
}, [selectedGrade, grades]);

// Dropdown implementation
const GradeDropdown = () => {
  return (
    <Select value={selectedGrade}
      onValueChange={setSelectedGrade}
    >
      <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
        <SelectValue placeholder="Select grade" />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {sortedGrades.map(g => (
          <SelectItem key={g.id} value={g.id}>
            {g.name} ({g.category})
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

const StreamDropdown = () => {
  return (
    <Select value={selectedStream}
      onValueChange={setSelectedStream}
      disabled={!selectedGrade}
    >
      <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
        <SelectValue placeholder="{selectedGrade ? 'Choose stream...' : 'Select grade first'}" />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {availableStreams.map(s => (
          <SelectItem key={s} value={s}>{s}</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

// Usage in components
<GradeDropdown />
<StreamDropdown />