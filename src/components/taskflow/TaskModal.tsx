"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Sparkles } from 'lucide-react';
import { Task, Priority, Status } from '../../types/tasks';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: any) => void;
  initialTask?: Task | null;
}

const TaskModal = ({ isOpen, onClose, onSave, initialTask }: TaskModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [status, setStatus] = useState<Status>("Todo");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description);
      setPriority(initialTask.priority);
      setStatus(initialTask.status);
      setDueDate(initialTask.dueDate.split('T')[0]);
    } else {
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setStatus("Todo");
      setDueDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialTask, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, description, priority, status, dueDate });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-[2.5rem] p-8 border-none shadow-2xl animate-in zoom-in-95 duration-300 perspective-1000">
        <div className="absolute right-6 top-6">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100">
            <X size={20} />
          </Button>
        </div>
        
        <DialogHeader className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Sparkles size={18} />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900">
              {initialTask ? "Edit Task" : "Create New Task"}
            </DialogTitle>
          </div>
          <p className="text-slate-500 text-sm">Organize your workflow with precise details.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Task Title</Label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-2 ring-indigo-100 font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</Label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add some context..."
              className="min-h-[100px] rounded-2xl bg-slate-50 border-none focus:ring-2 ring-indigo-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Priority</Label>
              <Select value={priority} onValueChange={(val: Priority) => setPriority(val)}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Due Date</Label>
              <Input 
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl h-14 px-8 font-bold">
              Discard
            </Button>
            <Button type="submit" className="rounded-2xl h-14 px-10 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-black">
              {initialTask ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;