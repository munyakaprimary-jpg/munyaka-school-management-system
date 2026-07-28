"use client";

import React, { useState } from 'react';
import { useAuth, User } from '@/context/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from '@/components/ui/Modal';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Edit2, 
  Key, 
  Mail, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';

const UserManagement = () => {
  const { users, createUser, updateUser, deleteUser, user: currentUser } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<'admin' | 'staff'>('staff');

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setRole("staff");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name || !email) return;

    if (editingUser) {
      updateUser(editingUser.id, { name, email, role });
      showSuccess("User updated successfully.");
    } else {
      createUser({ name, email, role });
      showSuccess("New user account created.");
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      showSuccess("User account deleted.");
      setIsDeleteOpen(false);
      setUserToDelete(null);
    }
  };

  const handleResetPassword = (email: string) => {
    const tempPass = email.split('@')[0] + '123';
    showSuccess(`Password reset to: ${tempPass}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-muted-foreground">Manage administrative access and system roles.</p>
        </div>
        <Button 
          onClick={handleOpenCreate}
          className="rounded-2xl gap-2 h-11 px-6 shadow-lg shadow-indigo-100 bg-indigo-600 hover:bg-indigo-700"
        >
          <UserPlus size={18} /> Create New User
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">User Details</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Access Role</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400">Date Created</th>
                  <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600">
                          {u.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Mail size={12} /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge className={
                        u.role === 'admin' 
                          ? "bg-indigo-50 text-indigo-700 border-none font-bold" 
                          : "bg-emerald-50 text-emerald-700 border-none font-bold"
                      }>
                        <Shield size={12} className="mr-1.5" />
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {format(new Date(u.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Reset Password"
                          className="rounded-full h-9 w-9 text-slate-400 hover:text-indigo-600"
                          onClick={() => handleResetPassword(u.email)}
                        >
                          <Key size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full h-9 w-9 text-slate-400 hover:text-indigo-600"
                          onClick={() => handleOpenEdit(u)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={u.id === 'admin-01'}
                          className="rounded-full h-9 w-9 text-slate-400 hover:text-red-600"
                          onClick={() => { setUserToDelete(u); setIsDeleteOpen(true); }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Edit User Account" : "Create User Account"}
        footer={
          <>
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold px-8" onClick={handleSave}>
              {editingUser ? "Save Changes" : "Create Account"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Mwangi" className="rounded-xl h-12" />
          </div>
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. jane@munyaka.sc.ke" className="rounded-xl h-12" />
          </div>
          <div className="space-y-2">
            <Label>Access Role</Label>
            <Select value={role} onValueChange={(val: any) => setRole(val)}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin (Full Control)</SelectItem>
                <SelectItem value="staff">Staff (Limited Access)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!editingUser && (
            <div className="p-3 bg-amber-50 rounded-xl flex gap-3 text-amber-700 text-xs font-medium">
              <AlertCircle size={16} className="shrink-0" />
              Default password will be set based on the email (e.g. emailprefix123).
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete User?"
        footer={
          <>
            <Button variant="ghost" className="rounded-xl font-bold flex-1" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex-1" onClick={handleDelete}>Yes, Delete</Button>
          </>
        }
      >
        <p className="text-slate-500 text-center">
          Are you sure you want to remove <strong className="text-slate-800">{userToDelete?.name}</strong>? This user will lose all access to the system.
        </p>
      </Modal>
    </div>
  );
};

export default UserManagement;