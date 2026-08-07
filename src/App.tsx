"use client";

import React from 'react';
import { useRouter } from 'react-router-dom';
import GradesAndStreamsProvider from './Providers/GradesAndStreamsProvider';

const App = () => {
  const router = useRouter();

  return (
    <GradesAndStreamsProvider>
      {router.pathname === '/' ? <div>Welcome to My Dashboard</div> : <Outlet />}
    </GradesAndStreamsProvider>
  );
};

export default App;