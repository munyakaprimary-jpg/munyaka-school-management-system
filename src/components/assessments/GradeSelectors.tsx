"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grade, Stream } from "@/lib/mock-data";

interface GradeSelectorsProps {
  selectedGradeId: string;
  onGradeChange: (value: string) => void;
  selectedStreamId: string;
  onStreamChange: (value: string) => void;
  availableStreams: Stream[];
  selectedStudentId: number;
  onStudentChange: (value: string) => void;
  studentNames: { id: number; name: string }[];
  examType: string;
  onExamTypeChange: (value: string) => void;
  examTypes: { id: string; code: string; name: string }[];
  year: string;
  onYearChange: (value: string) => void;
  academicYears: string[];
  term: string;
  onTermChange: (value: string) => void;
  gradesList: Grade[];
}

const GradeSelectors: React.FC<GradeSelectorsProps> = ({
  selectedGradeId,
  onGradeChange,
  selectedStreamId,
  onStreamChange,
  availableStreams,
  selectedStudentId,
  onStudentChange,
  studentNames,
  examType,
  onExamTypeChange,
  examTypes,
  year,
  onYearChange,
  academicYears,
  term,
  onTermChange,
  gradesList
}) => {
  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-[2rem] p-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Grade Level</label>
          <Select value={selectedGradeId} onValueChange={onGradeChange}>
            <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="Select Grade" />
            </SelectTrigger>
            <SelectContent>
              {gradesList.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Stream</label>
          <Select value={selectedStreamId} onValueChange={onStreamChange} disabled={availableStreams.length === 0}>
            <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <SelectValue placeholder={availableStreams.length === 0 ? "No Streams" : "Select Stream"} />
            </SelectTrigger>
            <SelectContent>
              {availableStreams.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Learner</label>
          <Select value={selectedStudentId.toString()} onValueChange={onStudentChange}>
            <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="Select Learner" />
            </SelectTrigger>
            <SelectContent>
              {studentNames.map(s => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Exam Type</label>
          <Select value={examType} onValueChange={onExamTypeChange}>
            <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="Select Exam Type" />
            </SelectTrigger>
            <SelectContent>
              {examTypes.map(et => (
                <SelectItem key={et.id} value={et.code}>{et.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Year</label>
          <Select value={year} onValueChange={onYearChange}>
            <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map(yr => (
                <SelectItem key={yr} value={yr}>{yr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Term</label>
          <Select value={term} onValueChange={onTermChange}>
            <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none font-bold text-slate-700">
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="term1">Term 1</SelectItem>
              <SelectItem value="term2">Term 2</SelectItem>
              <SelectItem value="term3">Term 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Assessment Task / Topic</label>
          <Input placeholder="Search or enter assessment task (e.g., Fractions, Oral Narrative)..." className="rounded-xl h-11 bg-slate-50 border-none text-sm" />
        </div>
      </div>
    </div>
  );
};

export default GradeSelectors;