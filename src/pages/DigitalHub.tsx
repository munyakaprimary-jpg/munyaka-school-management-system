import React from 'react';
import { BookOpen, Video } from 'lucide-react';

export default function DigitalHub() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <BookOpen className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold">Digital Literacy Hub</h1>
      </div>
      
      <p className="text-gray-600">Explore digital literacy resources and video materials.</p>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center space-x-2">
          <Video className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-semibold">Effective Online Communication</h2>
        </div>
        
        <div className="aspect-video bg-black rounded-lg overflow-hidden max-w-2xl">
          <video 
            controls 
            className="w-full h-full"
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
          >
            Your browser does not support video playback.
          </video>
        </div>
      </div>
    </div>
  );
}