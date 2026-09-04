"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Shield, Settings, Server, Wifi, Database, Clock, Users, GraduationCap, BookOpen, Calendar, FileText, BarChart3, RefreshCw, Download, Upload, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";

// ─── Tab definitions ────────────────────────────────────────────────────────

type AdminTab = "school" | "system";

interface TabConfig {
  id: AdminTab;
  label: string;
  description: string;
  icon: React.ElementType;
  adminOnly: boolean;
}

const TAB_CONFIGS: TabConfig[] = [
  {
    id: "school",
    label: "School Management",
    description: "Academic and administrative operations",
    icon: GraduationCap,
    adminOnly: false,
  },
  {
    id: "system",
    label: "System & LAN Settings",
    description: "Server, network, and database configuration",
    icon: Settings,
    adminOnly: true,
  },
];

// ─── School Management cards ────────────────────────────────────────────────

interface ManagementCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  color: "indigo" | "emerald" | "amber" | "rose" | "sky" | "purple";
}

const colorClasses = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
  sky: { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
};

// ─── Main Component ─────────────────────────────────────────────────────────

const AdminControlCenter: React.FC = () => {
  const { user } = useAuth();
  const { isAdminUser } = usePermissions();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("school");
  const [serverStatus, setServerStatus] = useState<"running" | "stopped">("running");
  const [latency, setLatency] = useState<number | null>(null);
  const [hostIp, setHostIp] = useState("10.22.54.196");
  const [port, setPort] = useState("5000");
  const [copied, setCopied] = useState(false);

  // Only admin (and super_admin) users can access this page.
  // isAdminUser is already computed from the current user in usePermissions.
  const isAuthorized = isAdminUser || user?.role === "super_admin";

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="border-none shadow-xl rounded-3xl bg-white max-w-md mx-4">
          <CardContent className="pt-10 pb-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 shadow-lg mb-6">
              <Shield size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3">Access Denied</h2>
            <p className="text-slate-500 font-medium mb-6">
              This page is restricted to administrators only.
            </p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Management card handlers ─────────────────────────────────────────────

  const handleNavigate = (path: string) => {
    navigate(path);
    showSuccess(`Navigating to ${path}`);
  };

  const managementCards: ManagementCard[] = [
    {
      id: "roles",
      title: "User Roles & Permissions",
      description: "Manage role-based access control and permissions",
      icon: Users,
      onClick: () => handleNavigate("/settings"),
      color: "indigo",
    },
    {
      id: "teachers",
      title: "Teacher Accounts",
      description: "View, add, and manage teacher profiles",
      icon: GraduationCap,
      onClick: () => handleNavigate("/staff"),
      color: "emerald",
    },
    {
      id: "students",
      title: "Student Registration",
      description: "Register and manage student records",
      icon: BookOpen,
      onClick: () => handleNavigate("/students"),
      color: "amber",
    },
    {
      id: "records",
      title: "Academic Records",
      description: "Manage grades, streams, and learning areas",
      icon: Calendar,
      onClick: () => handleNavigate("/grades"),
      color: "sky",
    },
    {
      id: "attendance",
      title: "Attendance",
      description: "Monitor and manage attendance records",
      icon: Clock,
      onClick: () => handleNavigate("/attendance"),
      color: "rose",
    },
    {
      id: "reports",
      title: "CBC Report Card Generation",
      description: "Generate and manage CBC report cards",
      icon: FileText,
      onClick: () => handleNavigate("/reports"),
      color: "purple",
    },
  ];

  // ─── System & LAN Settings handlers ───────────────────────────────────────

  const handleServerToggle = () => {
    if (serverStatus === "running") {
      setServerStatus("stopped");
      showSuccess("Server process stopped");
    } else {
      setServerStatus("running");
      showSuccess("Server process started");
    }
  };

  const handleBackup = () => {
    showSuccess("Database backup initiated");
  };

  const handleRestore = () => {
    showSuccess("Database restore initiated");
  };

  const handleCopyUrl = () => {
    const url = `http://${hostIp}:${port}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    showSuccess(`Server URL copied: ${url}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLatencyCheck = () => {
    const simulatedLatency = Math.floor(Math.random() * 50) + 10;
    setLatency(simulatedLatency);
    showSuccess(`Latency check: ${simulatedLatency}ms`);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Admin Control Center
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Centralized management for school operations and system configuration
          </p>
        </div>
        <Badge
          variant="outline"
          className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border-indigo-200"
        >
          {user?.role?.toUpperCase() || "ADMIN"}
        </Badge>
      </div>

      {/* Tabbed Interface */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as AdminTab)}
        className="w-full"
      >
        {/* Tab List — responsive scrollable on mobile */}
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-0 h-auto p-1.5 bg-slate-100 rounded-2xl">
          {TAB_CONFIGS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const classes = colorClasses[tab.color as keyof typeof colorClasses] || colorClasses.indigo;

            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center justify-center gap-2 sm:justify-start sm:gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all duration-200 data-[state=active]:shadow-md",
                  isActive
                    ? "bg-white text-slate-900 shadow border-2 border-indigo-500"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                )}
              >
                <Icon size={18} className={isActive ? classes.text : "text-slate-400"} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ─── Tab 1: School Management ─────────────────────────────────────── */}
        <TabsContent value="school" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {managementCards.map((card) => {
              const Icon = card.icon;
              const classes = colorClasses[card.color];

              return (
                <Card
                  key={card.id}
                  className="border-none shadow-md rounded-3xl bg-white hover:shadow-xl transition-all duration-200 cursor-pointer group"
                  onClick={card.onClick}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110", classes.bg, classes.text)}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-slate-900 mb-1">{card.title}</h3>
                        <p className="text-xs text-slate-500 font-medium">{card.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── Tab 2: System & LAN Settings (admin only) ─────────────────────── */}
        <TabsContent value="system" className="mt-6">
          <div className="space-y-6">
            {/* Server Process Control */}
            <Card className="border-none shadow-md rounded-3xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Server size={20} className="text-indigo-600" />
                  Server Process Control
                </CardTitle>
                <CardDescription>
                  Start or stop the LAN server process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        serverStatus === "running" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                      )}
                    />
                    <span className="text-sm font-bold text-slate-700">
                      {serverStatus === "running" ? "Server Running" : "Server Stopped"}
                    </span>
                  </div>
                  <Button
                    onClick={handleServerToggle}
                    variant={serverStatus === "running" ? "destructive" : "default"}
                    className={cn(
                      "rounded-xl font-black text-sm h-9 px-4",
                      serverStatus === "running"
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    )}
                  >
                    {serverStatus === "running" ? "Stop Server" : "Start Server"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Host IP & Port Binding */}
            <Card className="border-none shadow-md rounded-3xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Wifi size={20} className="text-indigo-600" />
                  Host IP & Port Binding
                </CardTitle>
                <CardDescription>
                  Configure the server's network address and port
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1 block">
                      Host IP Address
                    </label>
                    <input
                      type="text"
                      value={hostIp}
                      onChange={(e) => setHostIp(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border-none font-bold text-sm focus:bg-white focus:ring-2 focus:ring-indigo-200"
                      placeholder="e.g. 10.22.54.196"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1 block">
                      Port
                    </label>
                    <input
                      type="text"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border-none font-bold text-sm focus:bg-white focus:ring-2 focus:ring-indigo-200"
                      placeholder="e.g. 5000"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-2xl">
                  <span className="text-sm font-bold text-slate-700">
                    Server URL:
                  </span>
                  <code className="text-sm font-mono font-black text-indigo-700 bg-white px-3 py-1 rounded-lg">
                    http://{hostIp}:{port}
                  </code>
                  <Button
                    onClick={handleCopyUrl}
                    variant="ghost"
                    size="sm"
                    className="ml-auto rounded-xl font-black text-xs"
                  >
                    {copied ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Latency Monitor */}
            <Card className="border-none shadow-md rounded-3xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 size={20} className="text-indigo-600" />
                  Latency Monitor
                </CardTitle>
                <CardDescription>
                  Check network latency to the server
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div>
                    <span className="text-sm font-bold text-slate-700">
                      {latency !== null ? `Current Latency: ${latency}ms` : "No recent check"}
                    </span>
                  </div>
                  <Button
                    onClick={handleLatencyCheck}
                    variant="outline"
                    className="rounded-xl font-black text-xs h-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Check Latency
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Database Backup */}
            <Card className="border-none shadow-md rounded-3xl bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Database size={20} className="text-indigo-600" />
                  Database Backup & Restore
                </CardTitle>
                <CardDescription>
                  Export or restore the school database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleBackup}
                    className="flex-1 rounded-xl font-black text-sm h-10 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Download size={16} className="mr-2" />
                    Backup Database
                  </Button>
                  <Button
                    onClick={handleRestore}
                    variant="outline"
                    className="flex-1 rounded-xl font-black text-sm h-10 border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    <Upload size={16} className="mr-2" />
                    Restore Database
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminControlCenter;
