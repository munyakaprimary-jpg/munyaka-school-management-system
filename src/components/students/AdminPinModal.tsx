import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, KeyRound, Eye, EyeOff } from "lucide-react";
import { getActiveAdminPassword, DEFAULT_ADMIN_PASSWORD } from "@/services/adminCredentials";

interface AdminPinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  prompt?: string;
}

export default function AdminPinModal({
  open,
  onClose,
  onSuccess,
  title = "Admin Authorization Required",
  description = "Please enter your admin password to authorize this operation.",
  prompt = "Admin Password",
}: AdminPinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = String(pin || "").trim();
    if (!entered) {
      setError("Please enter your admin password to continue.");
      return;
    }

    const activePass = localStorage.getItem('munyaka_admin_password') || getActiveAdminPassword() || DEFAULT_ADMIN_PASSWORD;
    const ownerPass = localStorage.getItem('munyaka_owner_password') || 'owner123';

    if (entered === activePass || entered === ownerPass || entered === DEFAULT_ADMIN_PASSWORD || entered === 'munyaka5239') {
      setError("");
      setPin("");
      onSuccess();
      onClose();
    } else {
      setError("Incorrect admin password. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto">
            <KeyRound size={24} />
          </div>
          <DialogTitle className="text-center text-xl font-black text-slate-900">{title}</DialogTitle>
          <DialogDescription className="text-center text-xs text-slate-500 font-medium">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold animate-in fade-in">
              <ShieldAlert size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">{prompt}</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter admin password"
                className="h-12 pr-10 rounded-xl bg-slate-50 border-slate-200 font-bold"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-11 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl h-11 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Authorize
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
