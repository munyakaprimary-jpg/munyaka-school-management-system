"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from './notification-provider';

interface PostNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const PostNoticeModal: React.FC<PostNoticeModalProps> = ({ isOpen, onClose, onPost }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  const handleSubmit = () => {
    if (!title.trim() || !message.trim()) return;
    useNotifications().addNotification({ title, message, type });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Alert"
      description="Post a new notice to inform staff and teachers."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-100"
          >
            {title ? 'Post Alert' : 'Post'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-wider">Title</Label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g., School Closure Tomorrow" 
            className="rounded-xl h-12 bg-slate-50 border-slate-100 font-bold text-slate-800 focus:bg-white" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-wider">Message</Label>
          <Input 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            placeholder="Enter your alert message..." 
            className="rounded-xl h-12 bg-slate-50 border-slate-100 font-bold text-slate-800 focus:bg-white min-h-[100px]" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-wider">Type</Label>
          <Button 
            type="button" 
            variant="ghost" 
            className="rounded-xl h-10 px-3 text-sm font-medium text-slate-500 hover:text-indigo-600"
            onClick={() => setType('info')}
          >
            Info
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className={cn(
              "rounded-xl h-10 px-3 text-sm font-medium",
              type === 'success' ? "bg-green-50 text-green-600" : 
              type === 'warning' ? "bg-amber-50 text-amber-600" : 
              type === 'error' ? "bg-rose-50 text-rose-600" : 
              "bg-blue-50 text-blue-600"
            )}
            onClick={() => setType('success')}
          >
            Success
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className={cn(
              "rounded-xl h-10 px-3 text-sm font-medium",
              type === 'info' ? "bg-blue-50 text-blue-600" : 
              type === 'warning' ? "bg-amber-50 text-amber-600" : 
              type === 'error' ? "bg-rose-50 text-rose-600" : 
              "bg-blue-50 text-blue-600"
            )}
            onClick={() => setType('warning')}
          >
            Warning
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className={cn(
              "rounded-xl h-10 px-3 text-sm font-medium",
              type === 'error' ? "bg-rose-50 text-rose-600" : 
              "bg-blue-50 text-blue-600"
            )}
            onClick={() => setType('error')}
          >
            Error
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PostNoticeModal;