"use client";

import { useContext } from 'react';
import { GradesAndStreamsContext } from '@/Providers/GradesAndStreamsProvider';

export const useGradesAndStreams = () => {
  return useContext(GradesAndStreamsContext);
};