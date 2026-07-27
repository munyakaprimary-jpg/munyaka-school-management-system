"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, BookmarkCheck } from "lucide-react";
import { showSuccess } from '@/utils/toast';

interface RemarkSectionProps {
  title: string;
  savedRemark: string;
  onSave: (remark: string) => void;
  type: 'Class Teacher' | 'Head of Institution';
}

const PRESET_REMARKS = [
  {
    category: "Level 4 (Exceeding Expectations)",
    items: [
      "Excellent academic performance. Consistently exceeds expectations across all learning areas.",
      "An outstanding term! Displays deep understanding and critical thinking skills."
    ]
  },
  {
    category: "Level 3 (Meeting Expectations)",
    items: [
      "A very good performance. Meets all expectations across learning areas.",
      "Satisfactory progress made this term. With continued effort, higher levels are attainable."
    ]
  },
  {
    category: "Level 2 (Approaching Expectations)",
    items: [
      "Good effort, but approaching expectations in a few areas. Needs consistent practice.",
      "Making steady progress. Focused attention on weak areas will help achieve standard expectations."
    ]
  },
  {
    category: "Level 1 (Below Expectations)",
    items: [
      "Needs regular support and remedial practice to grasp fundamental concepts.",
      "Working below expectations. Requires closer monitoring and guidance to improve."
    ]
  }
];

const SingleRemarkBlock: React.FC<RemarkSectionProps> = ({ title, savedRemark, onSave, type }) => {
  const [currentText, setCurrentText] = useState(savedRemark || "");
  const [selectedPreset, setSelectedPreset] = useState("");

  const handleSelectPreset = (value: string) => {
    setSelectedPreset(value);
    setCurrentText(value);
  };

  const handleSaveClick = () => {
    onSave(currentText);
    showSuccess(`${type}'s Remark Saved Successfully`);
  };

  return (
    <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <Label className="text-xs font-black uppercase text-slate-700 tracking-wider">
          {title}
        </Label>
        
        {/* Compact Preset Dropdown */}
        <div className="w-full sm:w-72 print:hidden">
          <Select value={selectedPreset} onValueChange={handleSelectPreset}>
            <SelectTrigger className="h-8 text-[11px] rounded-lg bg-white border-slate-200 font-medium">
              <SelectValue placeholder="Select Preset Remark..." />
            </SelectTrigger>
            <SelectContent className="max-w-xs text-xs">
              {PRESET_REMARKS.map((group, gIdx) => (
                <SelectGroup key={gIdx}>
                  <SelectLabel className="text-[10px] font-bold text-indigo-600 uppercase bg-slate-50 px-2 py-1">
                    {group.category}
                  </SelectLabel>
                  {group.items.map((item, iIdx) => (
                    <SelectItem key={`${gIdx}-${iIdx}`} value={item} className="text-xs py-1.5 leading-tight">
                      {item}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Editable Textarea */}
      <Textarea
        value={currentText}
        onChange={(e) => setCurrentText(e.target.value)}
        placeholder={`Type or select preset for ${title.toLowerCase()}...`}
        className="text-xs rounded-lg min-h-[60px] bg-white border-slate-200 focus:ring-1 ring-indigo-500 leading-relaxed italic print:bg-transparent print:border-none print:p-0 print:min-h-0 print:resize-none"
      />

      {/* Footer Controls: Dark Lime Save Button & Dedicated Signature Line */}
      <div className="flex items-center justify-between pt-1 gap-4">
        <div className="print:hidden">
          <Button
            type="button"
            onClick={handleSaveClick}
            className="h-8 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-[#a3e635] border border-[#a3e635]/60 shadow-sm font-black text-[11px] gap-1.5 transition-all"
          >
            <BookmarkCheck size={14} className="text-[#a3e635]" /> Save
          </Button>
        </div>

        <div className="text-xs font-bold text-slate-800 flex items-center gap-1 ml-auto">
          <span>Sign:</span>
          <span className="border-b border-slate-400 min-w-[140px] inline-block text-center italic text-slate-500 font-normal">
            ..........................................
          </span>
        </div>
      </div>
    </div>
  );
};

interface ReportCardRemarksProps {
  teacherRemark: string;
  hoiRemark: string;
  onSaveTeacher: (remark: string) => void;
  onSaveHOI: (remark: string) => void;
}

export const ReportCardRemarks: React.FC<ReportCardRemarksProps> = ({
  teacherRemark,
  hoiRemark,
  onSaveTeacher,
  onSaveHOI,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
      <SingleRemarkBlock
        title="Class Teacher's Remarks"
        savedRemark={teacherRemark}
        onSave={onSaveTeacher}
        type="Class Teacher"
      />
      <SingleRemarkBlock
        title="Head of Institution (HOI) Remarks"
        savedRemark={hoiRemark}
        onSave={onSaveHOI}
        type="Head of Institution"
      />
    </div>
  );
};