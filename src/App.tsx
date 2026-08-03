// src/App.tsx

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import IdleTimerWrapper from './pages/IdleTimerWrapper';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        {/* Other routes can be added here */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;