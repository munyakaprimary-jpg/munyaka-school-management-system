"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, LayoutGrid, List, CheckCircle, Clock, Zap, Target } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import TaskCard from '../components/taskflow/TaskCard';
import TaskModal from '../components/taskflow/TaskModal';
import { Task, Status } from '../types/tasks';
import { cn } from '@/lib/utils';

const TaskFlow = () => {
  const { tasks, addTask, updateTask, deleteTask, stats } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | 'All'>('All');

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSave = (taskData: any) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header & Hero Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">TaskFlow Pro</h1>
          <p className="text-slate-500 font-medium">Your centralized workspace for high-impact productivity.</p>
        </div>
        <Button 
          onClick={handleOpenCreate}
          className="rounded-[1.5rem] h-14 px-8 bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-100 gap-3 font-black text-lg group"
        >
          <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" /> New Task
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: stats.total, icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active', value: stats.pending, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'High Priority', value: stats.highPriority, icon: Zap, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm flex items-center gap-4">
            <div className={cn("p-3 rounded-2xl", s.bg)}>
              <s.icon className={s.color} size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..." 
            className="h-14 rounded-2xl bg-white border-none shadow-sm pl-12 text-sm focus:ring-2 ring-indigo-50"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {['All', 'Todo', 'In Progress', 'Done'].map((s) => (
            <Button
              key={s}
              variant="ghost"
              onClick={() => setFilterStatus(s as any)}
              className={cn(
                "rounded-xl h-11 px-6 font-bold text-xs transition-all",
                filterStatus === s ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-slate-500 hover:bg-slate-50"
              )}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Task Grid */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={handleOpenEdit} 
              onDelete={deleteTask}
              onToggleStatus={(id, status) => updateTask(id, { status })}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
            <LayoutGrid size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No tasks found</h3>
          <p className="text-slate-400 max-w-xs mx-auto">Either your search yielded no results or you haven't created any tasks yet.</p>
          <Button 
            variant="ghost" 
            onClick={handleOpenCreate}
            className="mt-6 font-black text-indigo-600 hover:bg-transparent"
          >
            Create your first task →
          </Button>
        </div>
      )}

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialTask={editingTask}
      />
    </div>
  );
};

export default TaskFlow;