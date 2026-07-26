"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Calendar, MapPin, Phone, Mail, BookOpen, Award, Download, CreditCard } from 'lucide-react';
import { showSuccess } from "@/utils/toast";

const StudentProfile = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-80 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-6 text-center">
            <div className="w-24 h-24 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold mx-auto mb-4">
              BK
            </div>
            <h2 className="text-xl font-bold text-slate-900">Brian Kiptoo</h2>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">Grade 4 - Blue</p>
            <Badge className="mt-3 bg-emerald-50 text-emerald-700 border-none">
              Assessment: A827361
            </Badge>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white p-6">
            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button className="w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800" onClick={() => showSuccess('Payment recorded!')}>
                <CreditCard size={18} className="mr-2" />
                Record Payment
              </Button>
              <Button variant="outline" className="w-full rounded-2xl border-slate-200" onClick={() => showSuccess('Report downloaded!')}>
                <Download size={18} className="mr-2" />
                Download Report
              </Button>
            </div>
          </Card>
        </div>

        <div className="flex-1 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardHeader className="p-8 border-b">
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input defaultValue="Brian Kiptoo" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label>Assessment Number</Label>
                  <Input defaultValue="A827361" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Input defaultValue="Grade 4" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label>Stream</Label>
                  <Input defaultValue="Blue" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input defaultValue="May 12, 2014" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Input defaultValue="Male" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardHeader className="p-8 border-b">
              <CardTitle>Guardian Details</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Guardian Name</Label>
                  <Input defaultValue="Samuel Kiptoo" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input defaultValue="+254 712 000 111" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="sam.kiptoo@email.com" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Input defaultValue="Father" className="rounded-xl h-12 bg-slate-50/50 border-slate-100" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Award size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Academic Standing</p>
                <p className="text-xs text-slate-500">Currently performing <span className="text-emerald-600 font-bold">above average</span> in all subjects.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;