"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-muted-foreground">Overview of school operations</p>
        </div>
        <div className="flex gap-2">
          <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-2">New Project</Button>
        </div>
      </div>

      {/* Compact Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-none shadow-sm bg-white p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Active Students</span>
            <span className="text-2xl font-bold text-slate-900">42</span>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Completed</span>
            <span className="text-2xl font-bold text-emerald-600">28</span>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">This Week</span>
            <span className="text-2xl font-bold text-indigo-600">95%</span>
          </div>
        </Card>
      </div>

      {/* Projects Grid */}
      <Card className="border-none shadow-sm bg-white p-4 rounded-lg">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-slate-900">Recent Projects</h3>
          <p className="text-sm text-slate-500">No projects found.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;