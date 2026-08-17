"use client";

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store'; // Adjust the path to your Redux store file
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

const LearnerMasterList: React.FC = () => {
  const grades = useSelector((state: RootState) => state.school.grades) || [];

  const uniqueGrades = [...new Set(grades.map(grade => grade.name))];

  return (
    <Select defaultValue={uniqueGrades[0]}>
      <SelectTrigger>
        <span className="w-max">
          {uniqueGrades[0] || 'Select Grade'}
        </span>
      </SelectTrigger>
      <SelectContent>
        {uniqueGrades.map((grade, index) => (
          <SelectItem key={index} value={grade}>
            {grade}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LearnerMasterList;