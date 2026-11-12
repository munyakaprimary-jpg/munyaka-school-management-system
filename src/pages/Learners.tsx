import React from 'react';
import LearnersDirectory from '@/components/learners/LearnersDirectory';
import BackButton from '@/components/ui/BackButton';

export default function Learners() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-16">
      <div className="max-w-7xl mx-auto pt-6 px-4 sm:px-6">
        <div className="mb-4">
          <BackButton />
        </div>
      </div>
      <LearnersDirectory />
    </div>
  );
}
