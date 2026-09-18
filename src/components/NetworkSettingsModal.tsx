import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, CheckCircle2, AlertCircle, Loader2, Globe, Radio, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface NetworkSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "admin_server_url";
const DEFAULT_SERVER_URL = "http://192.168.1.100:5000";

export function NetworkSettingsModal({ isOpen, onClose }: NetworkSettingsModalProps) {
  const [serverUrl, setServerUrl] = useState<string>(DEFAULT_SERVER_URL);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setServerUrl(saved);
      } else {
        // Try to guess based on current location hostname
        const currentHost = window.location.hostname;
        const defaultGuess = currentHost && currentHost !== "localhost" && !currentHost.includes("127.0.0.1")
          ? `http://${currentHost}:5000`
          : DEFAULT_SERVER_URL;
        setServerUrl(defaultGuess);
      }
      setTestResult(null);
      setErrorMessage("");
    }
  }, [isOpen]);

  const handleSave = () => {
    let cleanUrl = serverUrl.trim();
    if (cleanUrl.endsWith("/")) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    localStorage.setItem(STORAGE_KEY, cleanUrl);
    toast({
      title: "Network Settings Saved",
      description: `Admin Server URL updated to ${cleanUrl}`,
    });
    onClose();
  };

  const handleTestConnection = async () => {
    let cleanUrl = serverUrl.trim();
    if (cleanUrl.endsWith("/")) {
      cleanUrl = cleanUrl.slice(0, -1);
    }

    if (!cleanUrl) {
      setTestResult("error");
      setErrorMessage("Please enter a valid Admin Server URL.");
      return;
    }

    setTesting(true);
    setTestResult(null);
    setErrorMessage("");

    try {
      const pingUrl = `${cleanUrl}/api/ping`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(pingUrl, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setTestResult("success");
        toast({
          title: "Connected Successfully!",
          description: `Successfully reached Admin Server at ${cleanUrl}`,
          className: "bg-emerald-50 border-emerald-200 text-emerald-900",
        });
      } else {
        throw new Error(`Server responded with status ${res.status}`);
      }
    } catch (err: any) {
      setTestResult("error");
      const msg = err.name === "AbortError" 
        ? "Connection timed out. Check Wi-Fi connection and firewall."
        : err.message || "Unable to reach server";
      setErrorMessage(msg);
      toast({
        title: "Unable to Reach Server",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shadow-sm">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Teacher Client Network Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Connect this teacher device to the Admin Wi-Fi Server
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <Label htmlFor="admin-server-url" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Admin Server Address (URL / IP)
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="admin-server-url"
                type="text"
                value={serverUrl}
                onChange={(e) => {
                  setServerUrl(e.target.value);
                  setTestResult(null);
                }}
                placeholder="http://192.168.1.100:5000"
                className="pl-9 font-mono text-sm border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Enter the IP address provided on the Admin Dashboard (e.g. <span className="font-mono text-indigo-600">http://192.168.1.100:5000</span>)
            </p>
          </div>

          {/* Test connection results banner */}
          {testResult === "success" && (
            <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-in fade-in-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold">Connected Successfully!</p>
                <p className="text-emerald-700 text-[11px]">Server responded correctly to ping request.</p>
              </div>
            </div>
          )}

          {testResult === "error" && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium animate-in fade-in-50">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to reach server</p>
                <p className="text-red-700 text-[11px] break-all">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="pt-1 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 text-xs font-medium space-x-1.5"
            >
              {testing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Test Connection</span>
                </>
              )}
            </Button>

            <span className="text-[11px] text-slate-400 font-mono">/api/ping</span>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-slate-600 hover:bg-slate-100 text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 shadow-sm"
          >
            Save & Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
