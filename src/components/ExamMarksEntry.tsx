"use client";

import React, { useState } from 'react';

const ExamMarksEntry = ({ onSubmit }) => {
  const [score, setScore] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Number(score) <= 100 && Number(score) >= 0) {
      onSubmit(Number(score));
    } else {
      alert('Please enter a score between 0 and 100.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center space-x-2">
        <input
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          min="0"
          max="100"
          required
          className="border rounded px-3 py-2"
        />
        <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2">
          Submit Score
        </button>
      </div>
    </form>
  );
};

export default ExamMarksEntry;