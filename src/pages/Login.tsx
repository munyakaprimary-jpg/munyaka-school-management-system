"use client";

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { School, ShieldAlert, LogIn, Eye, EyeOff } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        showSuccess("Welcome back! Login successful.");
        navigate(from, { replace: true });
      } else {
        showError("Invalid email or password. Please try again.");
      }
    } catch (err) {
      showError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfcfd] p-6">
      <div className="w-full max-w-[440px] space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-200 mb-4">
            <School className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">MUNYAKA</h1>
          <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest">School Management System</p>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</Label>
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@munyaka.sc.ke"
                  className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-2 ring-indigo-100 font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</Label>
                  <button type="button" className="text-[10px] font-black text-indigo-600 uppercase tracking-wider hover:underline">Forgot?</button>
                </div>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-14 rounded-2xl bg-slate-50 border-none focus:ring-2 ring-indigo-100 font-bold pr-12"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-black text-lg gap-2"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><LogIn size={20} /> Sign In</>
                )}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="flex gap-3">
                <ShieldAlert className="text-amber-500 shrink-0" size={18} />
                <div className="text-[11px] leading-relaxed text-slate-500 font-medium">
                  <span className="font-bold text-slate-700">Demo Access:</span> Use <code className="bg-white px-1 py-0.5 rounded border">admin@munyaka.sc.ke</code> and <code className="bg-white px-1 py-0.5 rounded border">admin123</code> to access the system.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
          &copy; 2024 Munyaka School District
        </p>
      </div>
    </div>
  );
};

export default Login;