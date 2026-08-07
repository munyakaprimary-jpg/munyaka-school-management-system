"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Index';
import DetailedLearnerProfile from './components/DetailedLearnerProfile';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/learner-profile" element={<DetailedLearnerProfile />} />
      </Routes>
    </Router>
  );
};

export default App;