"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubjectScore, PerformanceLevel } from "./types";

interface SubjectScoreRowProps {
  subject: SubjectScore;
  onScoreChange: (subjectId: string, score: string) => void;
  onPerformanceChange: (subjectId: string, performance: string) => void;
  onCommentChange: (subjectId: string, comment: string) => void;
  performanceLevels: PerformanceLevel[];
}

const SubjectScoreRow: React.FC<SubjectScoreRowProps> = ({
  subject,
  onScoreChange,
  onPerformanceChange,
  onCommentChange,
  performanceLevels
}) => {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-8 py-5 font-bold text-slate-900 text-base">{subject.subjectName}</td>
      <td className="px-8 py-5">
        <div className="flex items-center gap-2">
          <Input 
            type="text"
            value={subject.score}
            onChange={(e) => onScoreChange(subject.subjectId, e.target.value)}
            className="w-20 h-11 rounded-xl text-center font-bold text-slate-800 bg-slate-50 border-slate-100 focus:bg-white"
            placeholder="0"
          />
          <span className="text-xs font-bold text-slate-400">%</span>
        </div>
      </td>
      <td className="px-8 py-5">
        <Select 
          value={subject.performance} 
          onValueChange={(val) => onPerformanceChange(subject.subjectId, val)}
        >
          <SelectTrigger className="w-44 h-11 rounded-xl bg-slate-50 border-slate-100 font-bold">
            <SelectValue placeholder="Select Level" />
          </SelectTrigger>
          <SelectContent>
            {performanceLevels.map(lvl => (
              <SelectItem key={lvl.code} value={lvl.code}>
                <span className="font-bold">{lvl.code}</span> - {lvl.label.split(' ')[0]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-8 py-5">
        <Input 
          value={subject.comment}
          onChange={(e) => onCommentChange(subject.subjectId, e.target.value)}
          className="h-11 rounded-xl bg-slate-50 border-slate-100 focus:bg-white text-sm" 
          placeholder="e.g. Consistent effort" 
        />
      </td>
    </tr>
  );
};

export default SubjectScoreRow;