"use client";
import React from 'react';
import { Video } from 'lucide-react';

const DigitalHub: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Digital Hub</h1>

      <div>
        <h2 className="text-xl font-medium mb-3">Video Content</h2>
        <video
          controls
          poster=""
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
          className="w-full max-w-lg rounded-md shadow-md"
        >
          <source
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      </div>

      <div>
        <h2 className="text-xl font-medium mb-3">Document Content</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
          <BookOpen className="mr-2" />
          Document 1
        </button>
      </div>

      <div>
        <h2 className="text-xl font-medium mb-3">Play Content</h2>
        <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
          <Play className="mr-2" />
          Play 1
        </button>
      </div>
    </div>
  );
};

export default DigitalHub;