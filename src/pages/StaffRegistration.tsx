"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const StaffRegistration = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Success",
      description: "Staff member has been registered successfully.",
    });
    navigate('/staff');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/staff')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff Registration</h1>
          <p className="text-muted-foreground">Onboard new teachers and administrative personnel.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b">
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="e.g. Jane Mwangi" required className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
            </div>
            <div className="space-y-2">
              <Label>National ID Number</Label>
              <Input placeholder="e.g. 12345678" required className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="e.g. +254 700 000 000" required className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" placeholder="e.g. jane@munyaka.sc.ke" required className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b">
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Role / Position</Label>
              <Select required>
                <SelectTrigger className="rounded-xl h-12 bg-slate-50/50 border-slate-100">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Class Teacher</SelectItem>
                  <SelectItem value="senior">Senior Teacher</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="support">Support Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>TSC Number (If applicable)</Label>
              <Input placeholder="e.g. TSC-123456" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Subjects / Areas of Specialization</Label>
              <Input placeholder="e.g. Math, Science, Creative Arts" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
            </div>
          </CardContent>
          <div className="p-8 pt-0 flex justify-end">
            <Button type="submit" size="lg" className="rounded-2xl px-10 h-14 bg-indigo-600 shadow-xl shadow-indigo-100">
              Register Staff Member
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default StaffRegistration;