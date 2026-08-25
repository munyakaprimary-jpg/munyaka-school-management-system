import React from 'react';

export interface Notice {
  id: string;
  title: string;
  content: string;
  description: string;
  date: string;
  category: 'Urgent' | 'General' | 'Finance' | 'Notice' | 'Event';
  color?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  pinned?: boolean;
}

export interface SchoolEvent {
  id: string | number;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location?: string;
  type?: string;
}
