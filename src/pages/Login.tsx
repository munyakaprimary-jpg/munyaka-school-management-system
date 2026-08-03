// src/pages/Login.tsx

import React from 'react';
import { toast } from 'react-toastify';

const Login: React.FC = () => {
  React.useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.has('logout')) {
      toast.error("You have been logged out due to 10 minutes of inactivity");
    }
  }, []);

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 shadow-lg rounded-md w-full max-w-2xl text-center">
        <h1>Login Screen</h1>
        {/* Add login form and logic here */}
      </div>
    </div>
  );
};

export default Login;