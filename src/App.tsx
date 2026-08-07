import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { GradesAndStreamsProvider } from './context/GradesAndStreamsContext';
import Home from './pages/Home';

const App: React.FC = () => {
  return (
    <Router>
      <GradesAndStreamsProvider>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </GradesAndStreamsProvider>
    </Router>
  );
};

export default App;