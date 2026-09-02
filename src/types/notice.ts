export interface Notice {
  id: string;
  title: string;
  content: string;
  description?: string;
  date: string;
  category: 'Urgent' | 'General' | 'Finance' | 'Notice' | 'Event';
  color?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  pinned?: boolean;
  createdBy?: string;
  /** Optional priority used for sorting / highlighting. */
  priority?: 'low' | 'medium' | 'high' | 'Normal' | 'Important' | 'Urgent Alert';
  /** Legacy alias of `content`. */
  message?: string;
  /** Optional type tag (e.g. "message", "alert"). */
  type?: string;
}

export interface SchoolEvent {
  id: string | number;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location?: string;
  type?: string;
  /** Optional priority label (free-form string). */
  priority?: string;
  description?: string;
}
