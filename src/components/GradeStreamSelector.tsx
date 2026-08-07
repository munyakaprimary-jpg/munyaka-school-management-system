import React, { useContext } from 'react';
import clsx from 'clsx';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGradesAndStreams } from '../context/GradesAndStreamsContext';

interface GradeStreamSelectorProps {
  className?: string;
}

const GradeStreamSelector: React.FC<GradeStreamSelectorProps> = ({ className }) => {
  const { grades, streams } = useGradesAndStreams();
  const [isGradePopupOpen, setIsGradePopupOpen] = useState(false);
  const [isStreamPopupOpen, setIsStreamPopupOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  const handleGradeChange = (grade: Grade) => {
    setSelectedGrade(grade);
    setIsGradePopupOpen(false);
  };

  return (
    <div className={clsx('space-y-2', className)}>
      <Select onValueChange={() => setIsGradePopupOpen(!isGradePopupOpen)} value={selectedGrade?.id}>
        <SelectTrigger>
          <SelectValue placeholder="Select Grade" />
        </SelectTrigger>
        <SelectContent onOpenChange={(open) => (open ? setIsGradePopupOpen(true) : setIsStreamPopupOpen(false))}>
          {grades.map((grade) => (
            <SelectItem key={grade.id} value={grade.id} onClick={() => handleGradeChange(grade)}>
              {grade.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedGrade && (
        <Select onValueChange={() => setIsStreamPopupOpen(!isStreamPopupOpen)} disabled={!selectedGrade}>
          <SelectTrigger>
            <SelectValue placeholder="Select Stream" />
          </SelectTrigger>
          <SelectContent onOpenChange={(open) => (open ? setIsStreamPopupOpen(true) : setIsGradePopupOpen(false))}>
            {streams
              .filter((stream) => stream.gradeId === selectedGrade.id)
              .map((stream) => (
                <SelectItem key={stream.id} value={stream.id}>
                  {stream.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default GradeStreamSelector;