"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MoreVertical, Trash2, Edit2, CheckCircle2, Circle } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Task } from '../../types/tasks';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: any) => void;
}

const TaskCard = ({ task, onEdit, onDelete, onToggleStatus }: TaskCardProps) => {
  const priorityColors = {
    Low: "bg-emerald-50 text-emerald-600",
    Medium: "bg-blue-50 text-blue-600",
    High: "bg-rose-50 text-rose-600",
  };

  const isDone = task.status === 'Done';

  return (
    <Card className={cn(
      "border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-[2rem] bg-white group overflow-hidden",
      isDone && "opacity-75"
    )}>
      <CardContent className="p-8">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onToggleStatus(task.id, isDone ? 'Todo' : 'Done')}
              className={cn(
                "transition-colors",
                isDone ? "text-emerald-500" : "text-slate-300 hover:text-indigo-400"
              )}
            >
              {isDone ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </button>
            <Badge className={cn("rounded-lg border-none font-bold text-[10px] uppercase tracking-widest", priorityColors[task.priority])}>
              {task.priority}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={18} className="text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px]">
              <DropdownMenuItem onClick={() => onEdit(task)} className="rounded-xl gap-2 font-bold cursor-pointer">
                <Edit2 size={14} /> Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(task.id)} className="rounded-xl gap-2 font-bold text-rose-500 cursor-pointer">
                <Trash2 size={14} /> Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className={cn(
          "text-xl font-bold text-slate-900 mb-2 leading-tight",
          isDone && "line-through text-slate-400"
        )}>
          {task.title}
        </h3>
        
        <p className="text-slate-500 text-sm mb-6 line-clamp-2">
          {task.description || "No description provided."}
        </p>

        <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <Calendar size={14} />
            {format(new Date(task.dueDate), 'MMM dd, yyyy')}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <Clock size={14} />
            {task.status}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;