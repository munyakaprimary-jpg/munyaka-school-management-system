import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HeaderWithNotifications } from '@/components/HeaderWithNotifications';
import { useNavigate } from 'react-router-dom';

export const HeaderWithNotifications = () => {
  const { isOpen, setIsOpen, isOpen: isPopoverOpen } = useNotification(); // custom hook that returns isOpen etc.
  const navigate = useNavigate();

  // Toggle logic
  const [showPopover, setShowPopover] = useState(false);

  const togglePopover = () => {
    setPopoverOpen(!showPopover);
  };

  // Close on outside click (handled inside NotificationPopover)
  const closePopover = () => setPopoverOpen(false);

  return (
    <div className="relative">
      {/* Bell button – shows badge count automatically via context */}
      <Button
        variant="ghost"
        className="relative flex items-center justify-center p-2 rounded-lg hover:bg-slate-50"
        onClick={togglePopover}
        title="Notifications"
      >
        <Bell size={20} className="text-slate-400" />
        {/* Badge showing unread count */}
        {useNotification().unreadCount > 0 && (
          <Badge
            className="absolute -top-2 -right-2 bg-rose-50 text-rose-600 border-none text-xs font-medium"
          >
            {useNotification().unreadCount}
          </Badge>
        )}
      </Button>

      {/* Popover (dropdown) */}
      <NotificationPopover isOpen={showPopover} onClose={() => setPopoverOpen(false)} />
    </div>
  );
};