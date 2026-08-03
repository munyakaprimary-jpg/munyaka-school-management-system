"use client";

import React from 'react';
import Link from 'next/link';

const Home = () => (
  <div className="bg-gray-100 min-h-screen flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
      <h1 className="text-center text-3xl font-bold mb-4">Welcome to My App</h1>
      <p><Link href="/login" className="text-blue-500 underline hover:text-blue-700">Login &nbsp;</Link><span>|</span> <Link href="/register" className="text-blue-500 underline hover:text-blue-700 ml-2">Register</Link></p>
    </div>
  </div>
);

export default Home;