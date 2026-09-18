import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, User, ArrowRight, AlertCircle, KeyRound, School, BookOpen, Users, CreditCard, Wifi, Award, CheckCircle } from "lucide-react";

export const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [tempTokenData, setTempTokenData] = useState<{ userId: string; tempToken: string } | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password.trim()) {
      setError("Please enter both your identifier (username or staff ID) and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await login(identifier.trim(), password.trim());
      if (result && result.mustChangePassword) {
        setTempTokenData({ userId: result.userId, tempToken: result.tempToken });
        setShowPasswordResetModal(true);
        setLoading(false);
        return;
      }
      if (!result || !result.success) {
        setError(result?.error || "Invalid credentials or unauthorized access.");
        setLoading(false);
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      console.error("[Login] Authentication error:", err);
      setError(err?.message || "An error occurred during authentication.");
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!tempTokenData) {
      setError("Session expired. Please log in again.");
      setShowPasswordResetModal(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: tempTokenData.userId,
          tempToken: tempTokenData.tempToken,
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update password');
      }

      await login(identifier.trim(), newPassword);
      setShowPasswordResetModal(false);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error('[Login] Password change error:', err);
      setError(err.message || 'Failed to update password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header / Brand Banner */}
      <header className="max-w-6xl mx-w-full w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-6 z-10 pb-8 border-b border-slate-800/80">
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 ring-2 ring-indigo-400/30">
            <School className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/30">
                CBC Competency Based Education
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Munyaka Primary & Junior School
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-medium">
              Excellence in Learning & Character • Official Management Portal
            </p>
          </div>
        </div>

        {/* Quick shortcut pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs text-slate-300 shadow-sm">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Academics</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs text-slate-300 shadow-sm">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Students</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs text-slate-300 shadow-sm">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Fees & Billing</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs text-slate-300 shadow-sm">
            <Wifi className="w-4 h-4 text-amber-400" />
            <span>LAN Offline Ready</span>
          </div>
        </div>
      </header>

      {/* Main Hero & Login Box */}
      <main className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10 py-8">
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <Award className="w-4 h-4" />
            <span>Secure Role-Based Access Control Active</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Empowering Education Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Digital Innovation</span>
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto lg:mx-0">
            Welcome to the Munyaka School Management Portal. Authorized administrators, teachers, and staff members can securely sign in below to access their assigned department workflows.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 max-w-lg mx-auto lg:mx-0">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-left">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2 font-bold">01</div>
              <h4 className="font-bold text-white text-sm">Staff Workspace</h4>
              <p className="text-xs text-slate-400 mt-0.5">Attendance & Grading</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-left">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 font-bold">02</div>
              <h4 className="font-bold text-white text-sm">CBC Analytics</h4>
              <p className="text-xs text-slate-400 mt-0.5">Competency tracking</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-left col-span-2 sm:col-span-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 font-bold">03</div>
              <h4 className="font-bold text-white text-sm">Secure Vault</h4>
              <p className="text-xs text-slate-400 mt-0.5">Encrypted records</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="lg:col-span-5 flex justify-center">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl ring-1 ring-slate-800">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <span>Portal Sign In</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enter your credentials to access your authorized portal
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Username or Staff ID
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="e.g. admin, T001, L001"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="pl-9 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In to Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>

      {/* Footer Details */}
      <footer className="max-w-6xl w-full mx-auto text-center z-10 pt-8 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} Munyaka Primary & Junior School. All rights reserved.</p>
        <div className="flex items-center gap-6 text-slate-400 font-medium">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>IT Support & Help</span>
        </div>
      </footer>

      {/* Force Password Change Modal */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-slate-800 bg-slate-900 shadow-2xl">
            <CardHeader className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-bold text-white">Change Temporary Password</CardTitle>
              <CardDescription className="text-slate-400">
                You are logging in with a temporary password. For security reasons, please create a new permanent password.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordChange}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    New Password (min 6 chars)
                  </Label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Confirm New Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  {loading ? "Updating..." : "Update Password & Proceed"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Login;
