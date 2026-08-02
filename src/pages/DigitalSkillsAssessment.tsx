import React, { useState } from 'react';
import { Award, Keyboard, FileCheck, Plus, Search } from 'lucide-react';

const DigitalSkillsAssessment = () => {
  const [activeTab, setActiveTab] = useState<'competencies' | 'typing' | 'projects'>('competencies');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital Skills & Assessment</h1>
          <p className="text-gray-500">Record ICT competencies, typing speeds, and practical CBC projects.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-4">
        <button
          onClick={() => setActiveTab('competencies')}
          className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'competencies' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Award className="w-4 h-4" /> Competencies
        </button>
        <button
          onClick={() => setActiveTab('typing')}
          className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'typing' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Keyboard className="w-4 h-4" /> Keyboarding Log
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 ${
            activeTab === 'projects' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileCheck className="w-4 h-4" /> Project Evaluations
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'competencies' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Practical Competencies</h2>
          <p className="text-gray-500 text-sm mb-4">Track learner proficiency in word processing, spreadsheets, and digital research.</p>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Record Competency
          </button>
        </div>
      )}

      {activeTab === 'typing' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Keyboarding & Typing Log</h2>
          <p className="text-gray-500 text-sm mb-4">Record student WPM scores and typing test results.</p>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Log Typing Score
          </button>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Project-Based Evaluations</h2>
          <p className="text-gray-500 text-sm mb-4">Evaluate practical digital artifacts and presentations.</p>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create New Assessment
          </button>
        </div>
      )}
    </div>
  );
};

export default DigitalSkillsAssessment;