import { Notice } from '@/types/notice';

const NOTICE_BOARD_KEY = 'notice_board';

/**
 * Adds a new notice to the notice board in localStorage
 * and dispatches a custom event to notify all listeners.
 */
export const addNoticeToBoard = (noticeData: {
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
}): Notice => {
  const newNotice: Notice = {
    id: `notice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: noticeData.title,
    content: noticeData.message,
    date: new Date().toISOString(),
    category: 'General',
    priority: noticeData.priority || 'medium',
  };

  // Get existing notices
  let existingNotices: Notice[] = [];
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(NOTICE_BOARD_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          existingNotices = parsed;
        }
      } catch (e) {
        console.error('Error parsing existing notices:', e);
      }
    }
  }

  // Add new notice to the beginning (most recent first)
  const updatedNotices = [newNotice, ...existingNotices];

  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTICE_BOARD_KEY, JSON.stringify(updatedNotices));
    
    // Dispatch custom event for same-tab listeners
    window.dispatchEvent(new CustomEvent('notice_board_updated'));
  }

  return newNotice;
};

/**
 * Clears all notices from the notice board
 */
export const clearNoticeBoard = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(NOTICE_BOARD_KEY);
    window.dispatchEvent(new CustomEvent('notice_board_updated'));
  }
};

/**
 * Gets all notices from the notice board
 */
export const getNotices = (): Notice[] => {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(NOTICE_BOARD_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing notices:', e);
    }
  }
  return [];
};

/**
 * Gets the count of unread notices
 */
export const getUnreadCount = (): number => {
  if (typeof window === 'undefined') return 0;
  
  const notices = getNotices();
  const readIdsStored = localStorage.getItem('read_notice_ids');
  const readIds = readIdsStored ? JSON.parse(readIdsStored) : [];
  
  return notices.filter(notice => !readIds.includes(notice.id)).length;
};