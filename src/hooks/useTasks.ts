import { useState, useEffect, useMemo } from 'react';
import { Task, Status, Priority } from '../types/tasks';
import { lsRead, safeWrite } from '@/utils/storageUtils';

const STORAGE_KEY = 'taskflow_tasks';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = lsRead<Task[]>(STORAGE_KEY, []);
    return Array.isArray(saved) ? saved : [];
  });

  useEffect(() => {
    safeWrite(STORAGE_KEY, tasks);
  }, [tasks]);

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'Done').length,
    pending: tasks.filter((t) => t.status !== 'Done').length,
    highPriority: tasks.filter((t) => t.priority === 'High' && t.status !== 'Done').length,
  }), [tasks]);

  return { tasks, addTask, updateTask, deleteTask, stats };
};
