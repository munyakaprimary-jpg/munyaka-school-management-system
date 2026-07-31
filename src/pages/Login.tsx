"use client";

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { School, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const success = await login(email, password);
      if (success) {
        showSuccess("Welcome back, Admin!");
        navigate(from, { replace: true });
      } else {
        setError("Invalid email or password. Please try again.");
        showError("Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fbfcfd] p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-3xl opacity-50" />

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 mb-4">
            <School className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Portal Access</h1>
          <p className="text-slate-500 font-medium mt-1">Munyaka Primary and Junior School</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-2">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in slide-in-from-top-2">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="newemail@munyaka.sc.ke"
                    autoComplete="off"
                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-none focus:ring-2 ring-indigo-100 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</Label>
                  <button type="button" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700">Forgot?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-none focus:ring-2 ring-indigo-100 font-bold text-lg"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-black shadow-xl shadow-indigo-100 transition-all active:scale-95"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 p-6 bg-amber-50/50 border border-amber-100 rounded-3xl text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Development Notice</p>
          <p className="text-xs text-amber-600 font-medium">Use default admin credentials to test the system.</p>
          <p className="text-xs font-bold text-slate-900 mt-2">ID: newemail@munyaka.sc.ke | PW: NewSecurePassword123!</p>
        </div>
      </div>
    </div>
  );
};

export default Login;