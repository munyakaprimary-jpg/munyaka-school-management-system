import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGradesAndStreams, cleanStreamLabel } from '@/hooks/useGradesStreams';

interface GradeDropdownProps {
  selectedGrade: string;
  setSelectedGrade: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const GradeDropdown: React.FC<GradeDropdownProps> = ({
  selectedGrade,
  setSelectedGrade,
  placeholder = "Select grade",
  className = "rounded-xl h-12 bg-slate-50 border-none font-bold",
  disabled = false
}) => {
  const { grades } = useGradesAndStreams();

  return (
    <Select value={selectedGrade} onValueChange={setSelectedGrade} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {grades.length === 0 ? (
          <div className="py-2 px-3 text-sm text-slate-400 text-center font-medium">
            (No grades configured)
          </div>
        ) : (
          grades.map((g) => (
            <SelectItem key={g} value={g} className="font-medium">
              {g}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

interface StreamDropdownProps {
  selectedGrade: string;
  selectedStream: string;
  setSelectedStream: (val: string) => void;
  placeholder?: string;
  className?: string;
  showAllOption?: boolean;
  disabled?: boolean;
}

export const StreamDropdown: React.FC<StreamDropdownProps> = ({
  selectedGrade,
  selectedStream,
  setSelectedStream,
  placeholder,
  className = "rounded-xl h-12 bg-slate-50 border-none font-bold",
  showAllOption = false,
  disabled = false
}) => {
  const { streams, getStreamsForGrade } = useGradesAndStreams();

  const availableStreams = useMemo(() => {
    if (!selectedGrade || selectedGrade === 'all' || selectedGrade === 'All') {
      return streams;
    }
    return getStreamsForGrade(selectedGrade);
  }, [selectedGrade, streams, getStreamsForGrade]);

  const hasNoStreams = selectedGrade && selectedGrade !== 'all' && selectedGrade !== 'All' && availableStreams.length === 0;

  const displayPlaceholder = useMemo(() => {
    if (!selectedGrade || selectedGrade === 'all' || selectedGrade === 'All') {
      return placeholder || 'Select grade first...';
    }
    if (hasNoStreams) {
      return '(No streams configured)';
    }
    return placeholder || 'Choose stream...';
  }, [selectedGrade, hasNoStreams, placeholder]);

  return (
    <Select
      value={selectedStream}
      onValueChange={setSelectedStream}
      disabled={disabled || !selectedGrade || selectedGrade === 'all' || hasNoStreams}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={displayPlaceholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {showAllOption && (
          <SelectItem value="all" className="font-medium">
            All Streams
          </SelectItem>
        )}
        {availableStreams.length === 0 ? (
          <div className="py-3 px-3 text-xs text-slate-400 text-center font-medium">
            (No streams configured)
          </div>
        ) : (
          availableStreams.map((s) => {
            const cleanLabel = cleanStreamLabel(s);
            return (
              <SelectItem key={s} value={s} className="font-medium">
                {cleanLabel}
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  );
};
