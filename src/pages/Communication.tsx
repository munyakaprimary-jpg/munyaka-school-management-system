"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Send, History, Search, Filter, Plus, Mail, MessageSquare, Phone, Loader2 } from 'lucide-react';
import { showSuccess } from "@/utils/toast";

const Communication = () => {
  const [activeTab, setActiveTab] = React.useState<'compose' | 'logs'>('compose');
  const [isSending, setIsSending] = React.useState(false);

  const handleSend = async () => {
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSending(false);
    showSuccess('Message sent successfully!');
  };

  const messages = [
    { id: "1", recipient: "All Parents", subject: "Fee Balance Reminder", type: "SMS", date: "Oct 18, 2024", status: "Delivered" },
    { id: "2", recipient: "Grade 4 Blue", subject: "Trip to Museum", type: "Email", date: "Oct 16, 2024", status: "Opened" },
    { id: "3", recipient: "Samuel Kiptoo", subject: "Disciplinary Notice", type: "SMS", date: "Oct 15, 2024", status: "Delivered" },
    { id: "4", recipient: "Staff", subject: "Meeting Tomorrow", type: "Email", date: "Oct 14, 2024", status: "Scheduled" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communication Center</h1>
          <p className="text-muted-foreground">Send announcements, SMS, and emails to parents, staff, and students.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl border-slate-200 gap-2" onClick={() => showSuccess('Logs loaded!')}>
            <History size={18} /> Logs
          </Button>
          <Button className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 gap-2" onClick={() => showSuccess('Message composed!')}>
            <Send size={18} /> Compose
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Compose New Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="flex gap-2 border-b pb-4">
              <Button 
                variant={activeTab === 'compose' ? 'default' : 'ghost'} 
                className="rounded-xl font-bold"
                onClick={() => setActiveTab('compose')}
              >
                <MessageSquare size={16} className="mr-2" /> Compose
              </Button>
              <Button 
                variant={activeTab === 'logs' ? 'default' : 'ghost'} 
                className="rounded-xl font-bold"
                onClick={() => setActiveTab('logs')}
              >
                <History size={16} className="mr-2" /> Message Logs
              </Button>
            </div>

            {activeTab === 'compose' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Recipient Group</label>
                    <Select>
                      <SelectTrigger className="rounded-xl h-12">
                        <SelectValue placeholder="Select recipients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Parents</SelectItem>
                        <SelectItem value="grade">Specific Grade</SelectItem>
                        <SelectItem value="class">Specific Class</SelectItem>
                        <SelectItem value="staff">All Staff</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Channel</label>
                    <Select>
                      <SelectTrigger className="rounded-xl h-12">
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="both">SMS & Email</SelectItem>
                        <SelectItem value="push">Push Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Subject</label>
                  <Input placeholder="Message subject" className="rounded-xl h-12" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Message</label>
                  <textarea 
                    className="w-full min-h-[150px] p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 resize-none"
                    placeholder="Type your message here..."
                  />
                </div>

                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button 
                    size="lg" 
                    className="rounded-xl px-12 shadow-lg shadow-indigo-100" 
                    onClick={handleSend}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} className="mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="rounded-xl px-8">Save Draft</Button>
                  <Button variant="ghost" className="rounded-xl px-8">Schedule</Button>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input placeholder="Search messages..." className="rounded-xl h-12 max-w-xs" />
                  <Select>
                    <SelectTrigger className="rounded-xl h-12 w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="rounded-xl h-12 w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="opened">Opened</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="text-slate-500">
                      <TableHead className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Recipient</TableHead>
                      <TableHead className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Subject</TableHead>
                      <TableHead className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Type</TableHead>
                      <TableHead className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Date</TableHead>
                      <TableHead className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((msg) => (
                      <TableRow key={msg.id} className="hover:bg-slate-50">
                        <TableCell className="px-6 py-4 font-medium text-slate-900">{msg.recipient}</TableCell>
                        <TableCell className="px-6 py-4 text-slate-600">{msg.subject}</TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant="outline" className={msg.type === 'SMS' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}>
                            {msg.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-slate-500">{msg.date}</TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <Badge variant={msg.status === 'Delivered' ? 'default' : msg.status === 'Opened' ? 'secondary' : 'outline'} className="bg-emerald-50 text-emerald-700">
                            {msg.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
          <h3 className="font-bold text-slate-900 mb-6">Quick Templates</h3>
          <div className="space-y-3">
            {[
              { icon: Mail, title: "Fee Reminder", desc: "Outstanding balance notice", color: "bg-orange-50 text-orange-600" },
              { icon: MessageSquare, title: "Event Invitation", desc: "School event announcement", color: "bg-blue-50 text-blue-600" },
              { icon: Phone, title: "Emergency Alert", desc: "Urgent parent notification", color: "bg-red-50 text-red-600" },
              { icon: Mail, title: "Report Card Ready", desc: "Academic results available", color: "bg-emerald-50 text-emerald-600" },
              { icon: MessageSquare, title: "Meeting Request", desc: "Parent-teacher conference", color: "bg-purple-50 text-purple-600" },
            ].map((tmpl, i) => (
              <Button 
                key={i} 
                variant="outline" 
                className="w-full justify-start gap-4 rounded-2xl h-20 hover:bg-slate-50 border-slate-100"
                onClick={() => showSuccess(`Template "${tmpl.title}" loaded!`)}
              >
                <div className={`p-3 rounded-2xl ${tmpl.color}`}>
                  <tmpl.icon size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900">{tmpl.title}</p>
                  <p className="text-xs text-slate-500">{tmpl.desc}</p>
                </div>
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Communication;