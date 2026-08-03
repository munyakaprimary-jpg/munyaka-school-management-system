"use client";

import React, { useState } from 'react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email:', email);
    console.log('Password:', password);

    // Here you can add your login logic
    alert(`Login with Email: ${email} and Password: ${password}`);
  };

  return (
    <div className="mt-20">
      <h1 className="text-center text-3xl font-bold">Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="mt-4">
          <label htmlFor="email" className="block mb-2 font-medium">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="mt-4">
          <label htmlFor="password" className="block mb-2 font-medium">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
       required
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
        <button type="submit" className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">Login</button>
      </form>
    </div>
  );
};

export default Login;