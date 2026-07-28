"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { Sparkles } from 'lucide-react';
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
      setTitle(""); setDescription(""); setPriority("Medium"); setStatus("Todo");
      setDueDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialTask, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, description, priority, status, dueDate });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTask ? "Edit Task" : "Create New Task"}
      description="Organize your workflow with precise details."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="rounded-2xl h-14 px-8 font-bold">Discard</Button>
          <Button onClick={handleSubmit} className="rounded-2xl h-14 px-10 bg-indigo-600 hover:bg-indigo-700 font-black">
            {initialTask ? "Save Changes" : "Create Task"}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Task Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add some context..." className="min-h-[100px] rounded-2xl bg-slate-50 border-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Priority</Label>
            <Select value={priority} onValueChange={(val: Priority) => setPriority(val)}>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Due Date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TaskModal;