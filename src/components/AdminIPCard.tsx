import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, Copy, Check, Server, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface NetworkInfoResponse {
  success: boolean;
  data: {
    primaryIp: string;
    allInterfaces: Array<{ interface: string; address: string; netmask: string }>;
    hostname: string;
    platform: string;
    timestamp: string;
  };
}

export function AdminIPCard() {
  const [networkData, setNetworkData] = useState<NetworkInfoResponse["data"] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchNetworkInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try fetching from current host origin or default port 5000 backend
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const apiPort = "5000";
      
      // If running on Vite dev server (e.g. localhost:3000), backend is usually on 5000 or same host
      const candidates = [
        `${protocol}//${hostname}:${apiPort}/api/network-info`,
        `http://${hostname}:${apiPort}/api/network-info`,
        `/api/network-info`
      ];

      let data: NetworkInfoResponse | null = null;
      let lastErr = null;

      for (const url of candidates) {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            data = await res.json();
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (data && data.success) {
        setNetworkData(data.data);
      } else {
        // Fallback to browser location info if server is not running or unreachable
        setNetworkData({
          primaryIp: hostname || "192.168.1.100",
          allInterfaces: [{ interface: "eth0", address: hostname || "192.168.1.100", netmask: "255.255.255.0" }],
          hostname: "admin-host",
          platform: "node",
          timestamp: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load network info");
      // Graceful fallback
      setNetworkData({
        primaryIp: window.location.hostname || "192.168.1.100",
        allInterfaces: [],
        hostname: "admin-host",
        platform: "unknown",
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkInfo();
  }, []);

  const serverUrl = networkData ? `http://${networkData.primaryIp}:5000` : `http://${window.location.hostname}:5000`;

  const handleCopy = () => {
    navigator.clipboard.writeText(serverUrl);
    setCopied(true);
    toast({
      title: "Server IP Copied!",
      description: `Copied ${serverUrl} to clipboard. Share this with teachers.`,
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/30 shadow-sm hover:shadow transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Wifi className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Admin Server Wi-Fi Network
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Local Wi-Fi IP address for teacher client connections
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium px-2.5 py-0.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse" />
            Active LAN Host
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-indigo-100/80 shadow-inner">
          <div className="flex items-center space-x-3 overflow-hidden">
            <Server className="h-5 w-5 text-indigo-500 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Admin Server IP</p>
              <p className="text-sm sm:text-base font-mono font-bold text-indigo-900 truncate select-all">
                {serverUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNetworkInfo}
              disabled={loading}
              className="text-slate-600 hover:text-indigo-600 border-slate-200"
              title="Refresh Network Info"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Button
              size="sm"
              onClick={handleCopy}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm space-x-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-white" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy IP</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {networkData?.allInterfaces && networkData.allInterfaces.length > 1 && (
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Available LAN Interfaces: {networkData.allInterfaces.length} detected</span>
            <span className="font-mono text-slate-400">Port: 5000</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
