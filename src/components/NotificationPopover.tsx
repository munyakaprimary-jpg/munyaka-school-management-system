import React, { useRef, useEffect } from 'react';
import { useNotification } from '@/context/NotificationContext';
import { Badge, Button } from '@/components/ui/*';
import { XMark } from 'lucide-react';

type NotificationPopoverProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const NotificationPopover = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss } = useNotification();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        dismiss();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (id: string, link?: string) => {
    markAsRead(id);
    if (link) window.open(link, '_blank');
    dismiss();
  };

  return (
    <div
      ref={popoverRef}
      className={`
        absolute right-2 top-2 mb-2 w-48 rounded-lg bg-white border border-slate-200 shadow-lg z-50 
        transform translate-y-[-10px] opacity-0 pointer-events-none transition-all duration-200 
        [&[data-state=open]]:translate-y-0 opacity-100 pointer-events-auto
        bg-white dark:bg-slate-900 rounded-lg
        `}
      >
        {/* Header with “Mark all as read” */}
        <div className="flex items-center justify-between py-2 px-4 border-b border-slate-200">
          <span className="text-sm font-medium text-slate-600">
            {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}
          </span>
          <Button
            variant="ghost"
            className="rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50"
            onClick={markAllAsRead}
          >
            Mark all as read
          </Button>
        </div>

        {/* Notification list */}
        <DropdownMenu as="div" asChild className="p-0">
          <DropdownMenuTrigger asChild>
            <DropdownMenuContent className="py-1">
              {notifications.length > 0 ? (
                <>
                  {notifications.map(n => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => handleItemClick(n.id, n.link)}
                      className="flex items-start gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                    >
                      <Badge
                        variant="outline"
                        className="rounded-full w-6 h-6 text-xs font-medium text-slate-500"
                        >{n.read ? '✓' : ''}
                      </Badge>
                      <span className="ml-2 flex-1 truncate text-slate-600">
                        {n.title}
                      </span>
                      <span className="ml-2 text-xs text-slate-400">
                        {n.message?.substring(0, 30)}…
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenuTrigger>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Empty state */}
          {notifications.length === 0 && (
            <div className="p-4 flex flex-col items-center justify-center text-slate-400">
              <span className="text-xl">🔔</span>
              <p className="text-sm font-medium">No new notifications</p>
            </div>
          </div>
        </DropdownMenuContent>
      </div>

      {/* Close button (X) */}
      {isOpen && (
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            className="w-6 h-6 rounded-full text-slate-400 hover:text-slate-500"
            onClick={dismiss}
            title="Close notifications">
            <XMark size={18} />
          </Button>
        </div>
      </div>
    </div>
  );