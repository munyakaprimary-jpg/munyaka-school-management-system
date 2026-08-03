"use client";

import React, { useState } from 'react';

interface VideoProps {
  src: string;
}

const VideoPlayer: React.FC<VideoProps> = ({ src }) => {
  const [isError, setIsError] = useState(false);

  if (isError) {
    // Fallback URL in case the first video source fails
    return <video controls><source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" /></video>;
  }

  return (
    <video controls onError={() => setIsError(true)}>
      <source src={src} />
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoPlayer;