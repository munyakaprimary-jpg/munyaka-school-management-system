"use client";

import React, { useEffect, useState } from 'react';

const LearningAreas: React.FC = () => {
  const [learningAreas, setLearningAreas] = useState<string[]>([]);

  useEffect(() => {
    // Check if localStorage has initialization data
    const storedData = localStorage.getItem('learningAreas');
    if (!storedData) {
      // Initialize with default learning areas
      const defaultLearningAreas = [
        'Pre-Primary',
        'Lower Primary',
        'Upper Primary',
        'Junior School'
      ];
      setLearningAreas(defaultLearningAreas);
      // Save defaults to localStorage
      localStorage.setItem('learningAreas', JSON.stringify(defaultLearningAreas));
    } else {
      // Load existing data from localStorage
      const parsedData = JSON.parse(storedData) as string[];
      setLearningAreas(parsedData);
    }
  }, []);

  return (
    <div>
      {/* Render your learning areas here */}
      {learningAreas.map((area, index) => (
        <div key={index}>{area}</div>
      ))}
    </div>
  );
};

export default LearningAreas;