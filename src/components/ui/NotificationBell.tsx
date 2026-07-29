"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Notice {
  id: string;
  title: string;
  message: string;
  created_at: string; // ISO string
}

const NotificationBell: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Get read notice IDs from localStorage
  const getReadNoticeIds = (): string[] => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('readNoticeIds');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  };

  // Save read notice IDs to localStorage
  const saveReadNoticeIds = (ids: string[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('readNoticeIds', JSON.stringify(ids));
    }
  };

  // Calculate unread count
  const unreadCount = notices.filter(notice => 
    !getReadNoticeIds().includes(notice.id)
  ).length;

  // Fetch initial notices
  const fetchNotices = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('notice_board')
        .select('id, title, message, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotices(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchNotices();

    const channel = supabase
      .channel('notice_board_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notice_board' }, 
        (payload) => {
          const newNotice = payload.new as Notice;
          setNotices(prev => [newNotice, ...prev.slice(0, 9)]); // Keep only 10 newest
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mark all notices as read when dropdown opens
  const handleOpenDropdown = () => {
    setIsOpen(true);
    const allIds = notices.map(n => n.id);
    saveReadNoticeIds(allIds);
  };

  // Handle dropdown outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date/time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="relative">
        <button
          className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-slate-400" />
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
            •
          </span>
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        <button
          className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-slate-400" />
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
            •
          </span>
        </button>
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50">
          <div className="p-4 text-center text-slate-500">
            <AlertCircle size={24} className="mx-auto mb-2 text-rose-500" />
            <p className="text-sm">Failed to load notifications</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpenDropdown}
        className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Bell size={18} className="text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white">Notice Board Updates</h3>
          </div>

          {notices.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <Info size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notices yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className={cn(
                    "p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors",
                    !getReadNoticeIds().includes(notice.id) && "bg-blue-50/50 dark:bg-blue-900/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <Bell size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        {notice.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatTime(notice.created_at)}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">
                        {notice.message}
                      </p>
                    </div>
                    {!getReadNoticeIds().includes(notice.id) && (
                      <div className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              href="/notice-board"
              className="w-full text-xs font-bold text-indigo-600 hover:text-indigo-700 block text-center"
            >
              View All Notices →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;