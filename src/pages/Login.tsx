import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, User, ArrowRight, AlertCircle, KeyRound, GraduationCap, School } from "lucide-react";

export const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [tempTokenData, setTempTokenData] = useState<{ userId: string; tempToken: string } | null>(null);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

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
    } catch (err: any) {
      console.error('[Login] Password change error:', err);
      setError(err.message || 'Failed to update password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* School Branding Banner */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl shadow-indigo-500/25 mb-1 ring-4 ring-indigo-500/20">
            <School className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-1">
              CBC & Competency Based Education
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Munyaka Primary & Junior School
            </h1>
            <p className="text-sm font-medium text-slate-400">
              Integrated School Management & Learning Portal
            </p>
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span>Secure Portal Login</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access your authorized workspace
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
                    className="pl-9 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500"
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
                    className="pl-9 bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
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

        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>Munyaka Primary & Junior School Management System</p>
          <p className="text-slate-600">Protected by Role-Based Access Control (RBAC)</p>
        </div>
      </div>

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
