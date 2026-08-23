"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface Notice {
  id: string;
  title: string;
  message: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationContextType {
  notices: Notice[];
  unreadCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  markAllAsRead: () => void;
  refreshNotices: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NOTICE_BOARD_KEY = 'notice_board';
const READ_NOTICE_IDS_KEY = 'read_notice_ids';

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(READ_NOTICE_IDS_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);

  // Load notices from localStorage
  const loadNotices = useCallback(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(NOTICE_BOARD_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setNotices(parsed);
          }
        } catch (e) {
          console.error('Error parsing notice_board:', e);
          setNotices([]);
        }
      } else {
        setNotices([]);
      }
    }
  }, []);

  // Load read notice IDs from localStorage
  const loadReadIds = useCallback(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(READ_NOTICE_IDS_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setReadNoticeIds(parsed);
          }
        } catch (e) {
          console.error('Error parsing read_notice_ids:', e);
          setReadNoticeIds([]);
        }
      } else {
        setReadNoticeIds([]);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadNotices();
    loadReadIds();
  }, [loadNotices, loadReadIds]);

  // Listen for custom event (same-tab updates)
  useEffect(() => {
    const handleCustomEvent = () => {
      loadNotices();
      loadReadIds();
    };

    window.addEventListener('notice_board_updated', handleCustomEvent);
    return () => window.removeEventListener('notice_board_updated', handleCustomEvent);
  }, [loadNotices, loadReadIds]);

  // Listen for storage event (cross-tab updates)
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === NOTICE_BOARD_KEY || e.key === READ_NOTICE_IDS_KEY) {
        loadNotices();
        loadReadIds();
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [loadNotices, loadReadIds]);

  // Calculate unread count
  const unreadCount = notices.filter(notice => !readNoticeIds.includes(notice.id)).length;

  // Mark all current notices as read
  const markAllAsRead = useCallback(() => {
    const allIds = notices.map(n => n.id);
    const newReadIds = [...new Set([...readNoticeIds, ...allIds])];
    setReadNoticeIds(newReadIds);
    localStorage.setItem(READ_NOTICE_IDS_KEY, JSON.stringify(newReadIds));
  }, [notices, readNoticeIds]);

  // Refresh notices manually
  const refreshNotices = useCallback(() => {
    loadNotices();
    loadReadIds();
  }, [loadNotices, loadReadIds]);

  return (
    <NotificationContext.Provider
      value={{
        notices,
        unreadCount,
        isOpen,
        setIsOpen,
        markAllAsRead,
        refreshNotices,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};