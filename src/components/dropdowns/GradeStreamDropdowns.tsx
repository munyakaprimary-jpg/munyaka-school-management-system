import React, { useMemo } from 'react';
import { useGradesAndStreams } from '@/hooks/useGradesAndStreams';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GradeStreamDropdownProps {
  selectedGrade: string;
  setSelectedGrade: (grade: string) => void;
  selectedStream: string;
  setSelectedStream: (stream: string) => void;
  gradeLabel?: string;
  streamLabel?: string;
  includeAllGrades?: boolean;
  allGradesLabel?: string;
  includeAllStreams?: boolean;
  allStreamsLabel?: string;
  className?: string;
  disabled?: boolean;
}

export const GradeStreamDropdowns: React.FC<GradeStreamDropdownProps> = ({
  selectedGrade,
  setSelectedGrade,
  selectedStream,
  setSelectedStream,
  gradeLabel = "Grade",
  streamLabel = "Stream",
  includeAllGrades = false,
  allGradesLabel = "All Grades",
  includeAllStreams = true,
  allStreamsLabel = "All Streams",
  className = "",
  disabled = false,
}) => {
  const { grades, getStreamsForGrade, cleanStreamLabel } = useGradesAndStreams();

  // Get streams dynamically for the selected grade
  const availableStreams = useMemo(() => {
    if (!selectedGrade || selectedGrade === 'all' || selectedGrade === 'All Grades') {
      return [];
    }
    const rawStreams = getStreamsForGrade(selectedGrade);
    return rawStreams.map(s => cleanStreamLabel(s)).filter(Boolean);
  }, [selectedGrade, getStreamsForGrade, cleanStreamLabel]);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {/* Left Grade Dropdown */}
      <div className="space-y-1.5">
        {gradeLabel && <label className="text-xs font-semibold text-slate-700">{gradeLabel}</label>}
        <Select
          value={selectedGrade}
          onValueChange={(val) => {
            setSelectedGrade(val);
            setSelectedStream(includeAllStreams ? "all" : "");
          }}
          disabled={disabled}
        >
          <SelectTrigger className="bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500">
            <SelectValue placeholder={`Select ${gradeLabel.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {includeAllGrades && (
              <SelectItem value="all">{allGradesLabel}</SelectItem>
            )}
            {grades.length === 0 ? (
              <SelectItem value="none" disabled>No grades configured</SelectItem>
            ) : (
              grades.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Right Stream Dropdown */}
      <div className="space-y-1.5">
        {streamLabel && <label className="text-xs font-semibold text-slate-700">{streamLabel}</label>}
        <Select
          value={selectedStream}
          onValueChange={setSelectedStream}
          disabled={disabled || !selectedGrade || selectedGrade === 'all'}
        >
          <SelectTrigger className="bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500">
            <SelectValue placeholder={!selectedGrade || selectedGrade === 'all' ? "Select grade first" : `Select ${streamLabel.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {includeAllStreams && (
              <SelectItem value="all">{allStreamsLabel}</SelectItem>
            )}
            {(!selectedGrade || selectedGrade === 'all') ? (
              <SelectItem value="disabled-placeholder" disabled>Please select a grade first</SelectItem>
            ) : availableStreams.length === 0 ? (
              <SelectItem value="no-streams" disabled>(No streams configured)</SelectItem>
            ) : (
              availableStreams.map((stream) => (
                <SelectItem key={stream} value={stream}>
                  {cleanStreamLabel(stream)}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export const GradeDropdown: React.FC<{
  selectedGrade: string;
  setSelectedGrade: (grade: string) => void;
  label?: string;
  includeAll?: boolean;
  allLabel?: string;
  className?: string;
  disabled?: boolean;
}> = ({
  selectedGrade,
  setSelectedGrade,
  label = "Grade",
  includeAll = false,
  allLabel = "All Grades",
  className = "",
  disabled = false,
}) => {
  const { grades } = useGradesAndStreams();

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-xs font-semibold text-slate-700">{label}</label>}
      <Select value={selectedGrade} onValueChange={setSelectedGrade} disabled={disabled}>
        <SelectTrigger className="bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {includeAll && <SelectItem value="all">{allLabel}</SelectItem>}
          {grades.length === 0 ? (
            <SelectItem value="none" disabled>No grades configured</SelectItem>
          ) : (
            grades.map((grade) => (
              <SelectItem key={grade} value={grade}>
                {grade}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export const StreamDropdown: React.FC<{
  selectedGrade: string;
  selectedStream: string;
  setSelectedStream: (stream: string) => void;
  label?: string;
  includeAll?: boolean;
  allLabel?: string;
  className?: string;
  disabled?: boolean;
}> = ({
  selectedGrade,
  selectedStream,
  setSelectedStream,
  label = "Stream",
  includeAll = true,
  allLabel = "All Streams",
  className = "",
  disabled = false,
}) => {
  const { getStreamsForGrade, cleanStreamLabel } = useGradesAndStreams();

  const availableStreams = useMemo(() => {
    if (!selectedGrade || selectedGrade === 'all') return [];
    return getStreamsForGrade(selectedGrade).map(s => cleanStreamLabel(s)).filter(Boolean);
  }, [selectedGrade, getStreamsForGrade, cleanStreamLabel]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="text-xs font-semibold text-slate-700">{label}</label>}
      <Select
        value={selectedStream}
        onValueChange={setSelectedStream}
        disabled={disabled || !selectedGrade || selectedGrade === 'all'}
      >
        <SelectTrigger className="bg-white border-slate-200 focus:ring-2 focus:ring-emerald-500">
          <SelectValue placeholder={!selectedGrade || selectedGrade === 'all' ? "Select grade first" : `Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {includeAll && <SelectItem value="all">{allLabel}</SelectItem>}
          {(!selectedGrade || selectedGrade === 'all') ? (
            <SelectItem value="disabled-placeholder" disabled>Please select a grade first</SelectItem>
          ) : availableStreams.length === 0 ? (
            <SelectItem value="no-streams" disabled>(No streams configured)</SelectItem>
          ) : (
            availableStreams.map((stream) => (
              <SelectItem key={stream} value={stream}>
                {cleanStreamLabel(stream)}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
