"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  UserPlus, 
  Mail, 
  Phone, 
  Briefcase, 
  GraduationCap, 
  MoreHorizontal,
  X,
  User,
  IdCard,
  Calendar
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { STAFF } from '@/lib/mock-data';
import { showSuccess, showError } from '@/utils/toast';

const Staff = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    subjects: '',
    status: 'Active',
    joined: '',
    id_no: '',
    phone: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      if (formData.name && formData.email && formData.phone) {
        showSuccess(`${formData.name} has been added to staff successfully!`);
        setIsDialogOpen(false);
        setFormData({
          name: '',
          role: '',
          subjects: '',
          status: 'Active',
          joined: '',
          id_no: '',
          phone: '',
          email: '',
        });
      } else {
        showError('Please fill in all required fields');
      }
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff & Personnel</h1>
          <p className="text-muted-foreground">Manage teachers, administrators, and support staff.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700">
              <UserPlus size={18} /> Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold">Add New Staff Member</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Fill in the details below to register a new staff member.</p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 p-4 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="name" 
                    name="name"
                    placeholder="e.g. Jane Mwangi" 
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                  <Select name="role" value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))} required>
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Class Teacher">Class Teacher</SelectItem>
                      <SelectItem value="Senior Teacher">Senior Teacher</SelectItem>
                      <SelectItem value="Junior School Lead">Junior School Lead</SelectItem>
                      <SelectItem value="Head Teacher">Head Teacher</SelectItem>
                      <SelectItem value="Deputy Head">Deputy Head</SelectItem>
                      <SelectItem value="Support Staff">Support Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="subjects">Subjects Taught</Label>
                  <Input 
                    id="subjects" 
                    name="subjects"
                    placeholder="e.g. Mathematics, Science (comma separated)" 
                    value={formData.subjects}
                    onChange={handleChange}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Employment Status</Label>
                  <Select name="status" value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joined">Date Joined</Label>
                  <Input 
                    id="joined" 
                    name="joined"
                    type="date"
                    value={formData.joined}
                    onChange={handleChange}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_no">ID Number <span className="text-red-500">*</span></Label>
                  <Input 
                    id="id_no" 
                    name="id_no"
                    placeholder="e.g. 28374615" 
                    value={formData.id_no}
                    onChange={handleChange}
                    required
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                  <Input 
                    id="phone" 
                    name="phone"
                    type="tel"
                    placeholder="e.g. +254 700 111 222" 
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email"
                    placeholder="e.g. j.mwangi@munyaka.sc.ke" 
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="rounded-xl h-12"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="rounded-xl px-6"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="rounded-xl px-8 shadow-lg shadow-indigo-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Staff Member'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STAFF.map((member) => (
          <Card key={member.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-[2rem] bg-white overflow-hidden group">
            <CardContent className="p-0">
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
              <div className="px-8 py-4 bg-slate-50 flex justify-between items-center group-hover:bg-indigo-50/50 transition-colors">
                <Link to={`/staff/${member.id}`}>
                  <Button variant="ghost" size="sm" className="text-slate-500 font-bold hover:text-indigo-600 p-0">View Profile</Button>
                </Link>
                <Button variant="ghost" size="icon" className="text-slate-400"><MoreHorizontal size={18} /></Button>
              </div>
            </CardContent          </Card>
        ))}
      </div>
    </div>
  );
};

export default Staff;