// src/pages/Index.tsx

import React from 'react';
import { StartIdleTimer, StopIdleTimer } from '../utils/idleTimer';

const Home: React.FC = () => {
  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 shadow-lg rounded-md w-full max-w-2xl text-center">
        <h1>Welcome to the Home Page</h1>
        {/* Add additional content here */}
      </div>
    </div>
  );
};

const IdleTimerWrapper: React.FC = () => {
  React.useEffect(() => {
    StartIdleTimer();
    
    return () => StopIdleTimer();
  }, []);

  return <Home />;
};

export default IdleTimerWrapper;