"use client";

import React, { useRef, useEffect } from 'react';
import { Bell, X, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNotifications } from './notification-provider';
import { cn } from '@/lib/utils';

export const NotificationBell = () => {
  const { notices, unreadCount, isOpen, setIsOpen, markAllAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen]);

  // Mark all as read when dropdown opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  }, [isOpen, unreadCount, markAllAsRead]);

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, setIsOpen]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="text-rose-500" size={12} />;
      case 'medium':
        return <Clock className="text-amber-500" size={12} />;
      default:
        return <CheckCircle2 className="text-emerald-500" size={12} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800",
          "text-slate-600 dark:text-slate-300",
          "hover:bg-slate-100 dark:hover:bg-slate-700",
          "transition-colors h-11 w-11 flex items-center justify-center",
          "active:scale-95"
        )}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'No unread notifications'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell size={20} className="text-slate-500" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
            <span className="relative flex items-center justify-center px-2 text-[10px] font-black text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notices List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notices.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Bell className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={32} />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No notices posted yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">New announcements will appear here</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {notices.map((notice) => (
                  <li
                    key={notice.id}
                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(notice.priority)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">
                            {notice.title}
                          </h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0",
                            getPriorityColor(notice.priority)
                          )}>
                            {notice.priority}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                          {notice.message}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
                          <Clock size={10} /> {formatDate(notice.date)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notices.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                {notices.length} total notice{notices.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'high':
      return <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={14} />;
    case 'medium':
      return <Clock className="text-amber-500 shrink-0 mt-0.5" size={14} />;
    default:
      return <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={14} />;
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'medium':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    default:
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  }
}