"use client";

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/components/ui/notification-provider';
import { formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const NotificationBell = () => {
  const { notifications, markAsRead, clearNotifications } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    handleClose();
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    // Optionally navigate to the Communication Center for message notifications
    // For now, we just close the dropdown
    handleClose();
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="relative p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-indigo-600" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white">
            {unreadCount}
          </div>
        )}
      </button>

      <DropdownMenu
        align="end"
        className="w-56"
        sideOffset={4}
        open={open}
        onOpenChange={setAnchorEl => {
          if (!setAnchorEl) setAnchorEl(null);
        }}
      >
        <DropdownMenuTrigger asChild>
          <span className="sr-only">Open notifications menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-2 space-y-1">
          {notifications.length === 0 ? (
            <DropdownMenuItem className="text-slate-500 text-xs">
              No notifications yet
            </DropdownMenuItem>
          ) : (
            <>
              {notifications.map(notification => (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className={`flex items-start space-x-3 rounded-md p-2 text-sm hover:bg-slate-100 ${
                    !notification.read ? 'font-medium bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex h-3 w-3 flex-shrink-0 items-center justify-center">
                    {/* Notification type icon - for now we use a generic bell, but could be customized */ }
                    <Bell className="h-3 w-3 text-indigo-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="line-clamp-1 font-medium text-slate-900">{notification.title}</p>
                    <p className="line-clamp-1 text-slate-500 text-xs">{notification.message}</p>
                    <p className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem className="border-t pt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearNotifications}
                  className="w-full text-left text-slate-500 hover:text-slate-600"
                >
                  Clear All
                </Button>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NotificationBell;