"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  KeyRound,
} from "lucide-react";
import { getActiveAdminPassword } from "@/services/adminCredentials";

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Action label shown in the title — e.g. "Confirm Permanent Deletion" */
  actionLabel: string;
  /** Target name shown below the title — e.g. "Wanyama Asher" */
  targetName?: string;
  /** Description text shown under the title */
  description?: string;
  /** Subtitle text shown on the input label */
  prompt?: string;
  /** Called with the verified (or cancelled) result */
  onConfirm: (isValid: boolean) => void;
}

export default function AdminPinModal({
  isOpen,
  onClose,
  actionLabel,
  targetName,
  description,
  prompt,
  onConfirm,
}: AdminPinModalProps) {
  const [value, setValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setValue("");
      setError("");
      setShowPassword(false);
      setIsVerifying(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (error) setError("");
  };

  const validateAndSubmit = (code: string) => {
    if (!code || String(code || '').trim().length === 0) {
      setError("Please enter your admin password to continue.");
      return;
    }

    setIsVerifying(true);
    setError("");

    // Small delay for UX feedback
    setTimeout(() => {
      const validPassword = getActiveAdminPassword();
      if (code === validPassword) {
        setIsVerifying(false);
        onConfirm(true);
        onClose();
      } else {
        setValue("");
        setError("Incorrect admin password. Please try again.");
        setIsVerifying(false);
        inputRef.current?.focus();
      }
    }, 300);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    validateAndSubmit(value);
  };

  const handleClose = () => {
    if (!isVerifying) {
      onConfirm(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-2xl border-slate-200">
        <div className="bg-gradient-to-b from-slate-50 to-white p-6">
          {/* Icon */}
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>

          {/* Header */}
          <DialogHeader className="text-center mb-5 space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {actionLabel}
            </DialogTitle>
            {targetName && (
              <p className="text-sm font-semibold text-indigo-600 mt-1">
                {targetName}
              </p>
            )}
            <DialogDescription className="text-xs text-slate-500 mt-1.5">
              {description ??
                "Enter your admin password to authorize this operation."}
            </DialogDescription>
          </DialogHeader>

          {/* Password Input */}
          <form onSubmit={handleSubmit}>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 block">
              {prompt ?? "Admin Password / PIN"}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={value}
                onChange={handleChange}
                disabled={isVerifying}
                placeholder="Enter admin password"
                className={`
                  w-full pl-10 pr-10 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-150
                  bg-white outline-none placeholder-slate-300
                  ${error
                    ? "border-red-300 bg-red-50/40 text-red-700 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    : "border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  }
                `}
                aria-label="Admin password"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-1.5 mt-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isVerifying}
                className="flex-1 h-11 rounded-xl border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isVerifying || !value}
                className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold shadow-sm transition-all"
              >
                {isVerifying ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    Confirm
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}