"use client";

import React from 'react';

const DetailedLearnerProfile = () => {
  return (
    <div className="flex flex-col w-full md:flex-row items-center justify-between space-x-4 md:space-x-0">
      <h1 className="text-xl font-bold whitespace-nowrap">Detailed learner profile</h1>
      <div className="flex flex-row gap-2 items-end">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md">View History</button>
        <button className="bg-green-500 text-white px-4 py-2 rounded-md">Transfer</button>
      </div>
    </div>
  );
};

export default DetailedLearnerProfile;