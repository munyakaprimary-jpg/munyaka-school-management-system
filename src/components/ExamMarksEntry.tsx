import React, { useState } from 'react';

const ExamMarksEntry = ({ learners, selectedExamPeriod, onSubmit }) => {
  const [marks, setMarks] = useState({});

  const handleMarkChange = (learnerId, value) => {
    setMarks(prev => ({...prev, [learnerId]: value}));
  };

  const handleSubmit = () => {
    const validMarks = Object.entries(marks).filter(([_, value]) => {
      const num = Number(value);
      return !isNaN(num) && num >= 0 && num <= 100;
    }).reduce((acc, [id, val]) => ({...acc, [id]: val}), {});

    onSubmit(selectedExamPeriod, validMarks);
  };

  return (
    <form onSubmit={handleSubmit}>
      {learners.map(learner => (
        <div key={learner.id} className="mb-4">
          <h4>{learner.name}</h4>
          <input
            type="number"
            value={marks[learner.id] || ''}
            onChange={(e) => handleMarkChange(learner.id, e.target.value)}
            min="0"
            max="100"
            required
            className="border rounded px-3 py-2"
          />
        </div>
      ))}
      <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2">
        Submit Marks
      </button>
    </form>
  );
};

export default ExamMarksEntry;