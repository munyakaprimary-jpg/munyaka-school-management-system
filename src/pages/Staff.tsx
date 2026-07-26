"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  MoreHorizontal,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { STAFF } from '@/lib/mock-data';

const Staff = () => {
  const [isAddStaffOpen, setIsAddStaffOpen] = React.useState(false);
  const { toast } = useToast();

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddStaffOpen(false);
    toast({
      title: "Staff Added",
      description: "New staff member has been registered successfully.",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff & Personnel</h1>
          <p className="text-muted-foreground">Manage teachers, administrators, and support staff.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700">
            <UserPlus size={18} className="mr-2" /> Add Staff Member
          </Button>
        </div>
      </div>

      {/* Add Staff Modal */}
      <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
        <DialogTrigger asChild>
          <Button className="rounded-2xl shadow-lg shadow-indigo-100">
            <UserPlus size={18} className="mr-2" /> Add Staff Member
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[560px] rounded-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Register New Staff Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="flex-1 overflow-y-auto pr-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name</Label>
                <Input id="fullname" placeholder="e.g. Jane Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
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
              <div className="space-y-2">
                <Label>Subjects Taught</Label>
                <SelectTrigger>
                  <SelectValue placeholder="Select Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="English">English Language</SelectItem>
                  <SelectItem value="Science">Science & Tech</SelectItem>
                  <SelectItem value="Agriculture">Agriculture</SelectItem>
                  <SelectItem value="CRE">CRE</SelectItem>
                </SelectContent>
              </Select>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="e.g. 0712345678" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" placeholder="e.g. jane.doe@school.edu" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joined">Joined Date</Label>
                <Input id="joined" type="date" required />
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 font-medium">Staff Status:</p>
              <div className="flex items-center gap-3">
                <Badge className="bg-emerald-50 text-emerald-600 border-none rounded-lg px-3 py-1 font-bold">Active</Badge>
                <Badge className="bg-slate-100 text-slate-500 border-none rounded-lg px-3 py-1 font-bold">On Leave</Badge>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 pb-2 border-t">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsAddStaffOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl px-8 shadow-lg shadow-primary/20">
                Add Staff Member
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staff;