"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useNotifications, Notification } from './notification-provider';
import { cn } from '@/lib/utils';

export const NotificationBell: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, clearAll, unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'error':
        return <X size={16} className="text-rose-500" />;
      case 'warning':
        return <AlertCircle size={16} className="text-amber-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-100';
      case 'error':
        return 'bg-rose-50 border-rose-100';
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <Bell size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={cn(
                    "p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors",
                    !notification.read && "bg-blue-50/50 dark:bg-blue-900/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-0.5 p-1.5 rounded-lg", getTypeColor(notification.type))}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={clearAll}
              className="w-full text-xs font-bold text-slate-500 hover:text-rose-600"
            >
              Clear All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};