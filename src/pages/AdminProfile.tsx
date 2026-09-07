"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/context/AuthContext';
import { Shield, Key, LogOut, Camera, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

const AdminProfile = () => {
  const { user, updateProfile, updatePassword, logout } = useAuth();
  
  // Profile form state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSaving, setIsSaving] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);

  // Password modal state
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPassUpdating, setIsPassUpdating] = useState(false);

  // Visibility toggles
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || "");
      setAvatar(user.avatar || null);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Artificial delay for UX feel
    await new Promise(r => setTimeout(r, 600));
    updateProfile({ name, email, phone, avatar });
    setIsSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    
    setIsPassUpdating(true);
    const success = await updatePassword(oldPassword, newPassword);
    setIsPassUpdating(false);
    
    if (success) {
      setIsPassModalOpen(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowOldPass(false);
      setShowNewPass(false);
      setShowConfirmPass(false);
    }
  };

  const takePicture = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        setAvatar(image.dataUrl);
      }
    } catch (error) {
      console.error('Camera error:', error);
      // User cancelled or error occurred
    }
  };

  const pickFromGallery = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (image.dataUrl) {
        setAvatar(image.dataUrl);
      }
    } catch (error) {
      console.error('Gallery error:', error);
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-3 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-3">
        <BackButton parentPath="/" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Account</h1>
          <p className="text-muted-foreground">Manage system administrator credentials and security settings.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Info Card */}
        <Card className="w-full md:w-80 border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden p-8 text-center shrink-0">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="w-full h-full rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-4xl font-black shadow-2xl shadow-indigo-200 overflow-hidden">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={user?.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                user?.avatar || user?.name?.substring(0, 2).toUpperCase() || "AD"
              )}
            </div>
            <Button 
              size="icon" 
              className="absolute bottom-[-10px] right-[-10px] rounded-2xl bg-white text-slate-900 shadow-lg border hover:bg-slate-50 h-10 w-10"
              onClick={takePicture}
            >
              <Camera size={18} />
            </Button>
          </div>
          <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
          <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mt-1">{user?.role}</p>
          
          <div className="mt-8 space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 rounded-xl h-12 font-bold text-slate-500 hover:text-indigo-600"
              onClick={() => setIsPassModalOpen(true)}
            >
              <Key size={18} /> Change Password
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 rounded-xl h-12 font-bold text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={logout}
            >
              <LogOut size={18} /> Log Out
            </Button>
          </div>
        </Card>

        {/* Account Details Form */}
        <div className="flex-1 space-y-6 w-full">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b">
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="rounded-xl h-12 bg-slate-50/50 border-slate-100 focus:bg-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input 
                      type="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="rounded-xl h-12 bg-slate-50/50 border-slate-100 focus:bg-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className="rounded-xl h-12 bg-slate-50/50 border-slate-100 focus:bg-white" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee ID</Label>
                    <Input defaultValue="EMP-001" readOnly className="rounded-xl h-12 bg-slate-100 border-none cursor-not-allowed opacity-60" />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                    className="rounded-2xl px-10 h-12 bg-indigo-600 shadow-xl shadow-indigo-100 font-bold"
                  >
                    {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Shield size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Security Status</p>
                <p className="text-xs text-slate-500">2-Factor Authentication is currently <span className="text-emerald-600 font-bold">Enabled</span>.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        title="Change Password"
        description="Update your account security credentials."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsPassModalOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button 
              onClick={handlePasswordChange} 
              disabled={isPassUpdating}
              className="rounded-xl bg-indigo-600 font-bold px-8"
            >
              {isPassUpdating ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Update Password
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <div className="relative">
              <Input 
                type={showOldPass ? "text" : "password"} 
                value={oldPassword} 
                onChange={(e) => setOldPassword(e.target.value)} 
                placeholder="••••••••" 
                className="rounded-xl h-12 pr-10"
              />
              <button 
                type="button" 
                onClick={() => setShowOldPass(!showOldPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Input 
                type={showNewPass ? "text" : "password"} 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="••••••••" 
                className="rounded-xl h-12 pr-10"
              />
              <button 
                type="button" 
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <div className="relative">
              <Input 
                type={showConfirmPass ? "text" : "password"} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="••••••••" 
                className="rounded-xl h-12 pr-10"
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProfile;