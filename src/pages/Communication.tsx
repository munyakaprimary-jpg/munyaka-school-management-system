"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Mail, Send, History, UserCheck, AlertCircle } from 'lucide-react';
import { MESSAGES } from '@/lib/mock-data';

const Communication = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Communication Center</h1>
          <p className="text-muted-foreground">Broadcast messages, send SMS alerts, and track parent outreach.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl border-slate-200 gap-2">
            <History size={18} /> Logs
          </Button>
          <Button className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 gap-2">
            <Send size={18} /> Compose
          </Button>
        </div>
      </div>

      <Tabs defaultValue="outreach" className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border h-14 mb-8">
          <TabsTrigger value="outreach" className="rounded-xl px-8 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all font-bold">
            Outreach
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl px-8 h-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all font-bold">
            Recent Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outreach" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-10 text-center hover:shadow-md transition-all cursor-pointer group">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Send SMS Alert</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Direct mobile alerts for fee balances, disciplinary notices, or urgent school closures.</p>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem] bg-white p-10 text-center hover:shadow-md transition-all cursor-pointer group">
              <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Mail size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Email Newsletter</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Send termly newsletters, trip permissions, and academic progress updates to guardians.</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b">
                    <th className="px-8 py-5 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Recipient</th>
                    <th className="px-8 py-5 text-left font-black text-slate-400 uppercase tracking-widest text-[10px]">Subject</th>
                    <th className="px-8 py-5 text-center font-black text-slate-400 uppercase tracking-widest text-[10px]">Type</th>
                    <th className="px-8 py-5 text-right font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {MESSAGES.map((msg) => (
                    <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 font-bold text-slate-900">{msg.recipient}</td>
                      <td className="px-8 py-6">
                        <p className="font-medium text-slate-700">{msg.subject}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{msg.date}</p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <Badge variant="outline" className="rounded-lg border-slate-100 bg-slate-50 text-slate-500">
                          {msg.type}
                        </Badge>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Badge className={
                          msg.status === 'Delivered' ? "bg-emerald-50 text-emerald-700 border-none" : 
                          "bg-blue-50 text-blue-700 border-none"
                        }>
                          <UserCheck size={12} className="mr-1.5" /> {msg.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Communication;