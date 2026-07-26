"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, Phone, Briefcase, GraduationCap, MoreHorizontal } from 'lucide-react';
import { STAFF } from '@/lib/mock-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Staff = () => {
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  const handleAddStaff = () => {
    setIsAddStaffOpen(true);
  };

  const handleCloseAddStaff = () => {
    setIsAddStaffOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff & Personnel</h1>
          <p className="text-muted-foreground">Manage teachers, administrators, and support staff.</p>
        </div>
        <div>
          <Button 
            variant="outline" 
            className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
            onClick={handleAddStaff}
          >
            <UserPlus size={18} /> Add Staff Member
          </Button>
        </div>
      </div>

      <Dialog open={isAddStaffOpen} onOpenChange={handleCloseAddStaff}>
        <DialogTrigger asChild>
          <Button className="rounded-2xl shadow-lg shadow-indigo-100">
            <UserPlus size={18} /> Add Staff Member
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[560px] rounded-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
          </DialogHeader>
          <form>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staffName">Full Name</Label>
                  <Input id="staffName" placeholder="e.g. Jane Smith" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffEmail">Email Address</Label>
                  <Input id="staffEmail" placeholder="jane.smith@school.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffRole">Role</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="support">Support Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </form>
          <div className="flex justify-end gap-3 pt-4 pb-2 border-t">
            <Button type="button" variant="outline" className="rounded-xl" onClick={handleCloseAddStaff}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl px-8 shadow-lg shadow-primary/20">
              Save Staff Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STAFF.map((member) => (
          <Card key={member.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white overflow-hidden group">
            <CardContent className="p-0">
              <div className="p-8">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <Badge className={
                      member.status === 'Active' 
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none" 
                      : "bg-slate-100 text-slate-500 hover:bg-slate-100 border-none"
                    }>
                      {member.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 mb-6">
                    <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{member.role}</p>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Briefcase size={16} className="text-slate-400" />
                      <span>{member.subjects.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Phone size={16} className="text-slate-400" />
                      <span>{member.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-8 py-4 bg-slate-50 flex justify-between items-center group-hover:bg-indigo-50/50 transition-colors">
                <Link to={`/staff/${member.id}`}>
                  <Button variant="ghost" size="sm" className="text-slate-500 font-bold hover:text-indigo-600 p-0">View Profile</Button>
                </Link>
                <Button variant="ghost" size="icon" className="text-slate-400"><MoreHorizontal size={18} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Staff;