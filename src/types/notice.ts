export interface Notice {
  id: string;
  title: string;
  content: string;
  description?: string;
  message?: string;
  date: string;
  category: 'Urgent' | 'General' | 'Finance' | 'Notice' | 'Event';
  color?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  pinned?: boolean;
  // ID of the user who created the notice. Used for permission checks
  // (admins or the original author can delete a notice).
  createdBy?: string;
  /** Optional priority used by the notice board. */
  priority?: 'low' | 'medium' | 'high' | 'Normal' | 'Important' | 'Urgent Alert';
}

export interface SchoolEvent {
  id: string | number;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location?: string;
  type?: string;
  priority?: 'low' | 'medium' | 'high' | 'Normal' | 'Important' | 'Urgent Alert';
}
