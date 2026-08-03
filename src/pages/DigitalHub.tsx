"use client";

import React from 'react';
import { MainContainer } from '../components/MainContainer';
import { Breadcrumbs } from '../components/Breadcrumbs';
import VideoPlayer from '../components/VideoPlayer';

const DigitalHub = () => {
  return (
    <MainContainer>
      <Breadcrumbs />
      <section id="video">
        <h1>Digital Literacy Videos</h1>
        <VideoPlayer src="https://storage.googleapis.com/video-example-bucket/some-video.mp4" />
      </section>
    </MainContainer>
  );
};

export default DigitalHub;