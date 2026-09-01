"use client";

import React from 'react';
import { Link } from "react-router-dom"; // Updated import statement

const Index = () => {
  return (
    <div className="p-4">
      <Link to="/">Home</Link>
      {/* Other existing code */}
    </div>
  );
};

export default Index;