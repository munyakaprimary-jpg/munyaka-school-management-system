"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Search, Filter, Mail, Phone, Shield, Users, Award, Calendar } from 'lucide-react';
import { showSuccess } from "@/utils/toast";
import { STAFF } from "@/lib/mock-data";

const Staff = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  const filteredStaff = STAFF.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedRole === 'all' || member.role === selectedRole)
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Staff & Personnel</h1>
          <p className="text-muted-foreground">Manage staff records, roles, and contact information.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl border-slate-200 gap-2" onClick={() => showSuccess('Staff list exported!')}>
            <Mail size={18} />
            Export CSV
          </Button>
          <Button className="rounded-2xl shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => showSuccess('Staff member added!')}>
            <UserPlus size={18} />
            Add Staff Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
              <h3 className="text-2xl font-bold text-slate-900">{STAFF.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <h3 className="text-2xl font-bold text-slate-900">3</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Award size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Senior Teachers</p>
              <h3 className="text-2xl font-bold text-slate-900">1</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Years Experience</p>
              <h3 className="text-2xl font-bold text-slate-900">Avg 4.5</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Staff Directory</CardTitle>
          <CardDescription>View and manage staff member profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  placeholder="Search staff..." 
                  className="rounded-xl h-12 pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="rounded-xl border-slate-200 gap-2">
                <Filter size={18} />
                Filter
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-slate-500">
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Name</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Role</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Subjects</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider">Status</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-900">{member.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700">
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {member.subjects.join(', ')}
                      </TableCell>
                      <TableCell>
                        <Badge className={member.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-indigo-600 font-bold" onClick={() => showSuccess('Profile opened!')}>
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Staff;