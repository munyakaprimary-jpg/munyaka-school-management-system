import React, { useState, useEffect } from 'react';
import { Server, Wifi, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

const DEFAULT_PORT = 3000;
const DEFAULT_LAN_URL = `http://172.27.204.196:${DEFAULT_PORT}`;

export const DevLanSync: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    const saved = localStorage.getItem('lan_server_url');
    if (saved) return saved;
    const hostIp = window.location.hostname || 'localhost';
    return `http://${hostIp}:${DEFAULT_PORT}`;
  });

  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('');

  const checkHealth = async (urlToCheck: string) => {
    setStatus('checking');
    const startTime = performance.now();
    try {
      const response = await fetch(`${urlToCheck}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const endTime = performance.now();

      if (response.ok) {
        setStatus('online');
        setLatency(Math.round(endTime - startTime));
      } else {
        setStatus('offline');
        setLatency(null);
      }
    } catch (error) {
      setStatus('offline');
      setLatency(null);
    } finally {
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('lan_server_url')) {
      localStorage.setItem('lan_server_url', DEFAULT_LAN_URL);
      setBaseUrl(DEFAULT_LAN_URL);
    }
    checkHealth(baseUrl);
  }, []);

  const handleUrlChange = (newUrl: string) => {
    setBaseUrl(newUrl);
    localStorage.setItem('lan_server_url', newUrl);
  };

  const handleManualCheck = () => {
    checkHealth(baseUrl);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Server className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">
                Network Configuration
              </span>
              <h1 className="text-2xl font-bold">LAN Server Config</h1>
              <p className="text-blue-100 text-sm mt-1">
                Connect this device to the school server over Wi-Fi
              </p>
            </div>
          </div>
          <div>
            {status === 'online' && (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-500/20 text-green-200 border border-green-400/30">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Online
              </span>
            )}
            {status === 'offline' && (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-red-500/20 text-red-200 border border-red-400/30">
                <XCircle className="w-4 h-4 mr-2" /> Offline
              </span>
            )}
            {status === 'checking' && (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-yellow-500/20 text-yellow-200 border border-yellow-400/30">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Checking...
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
            <span className="text-xs uppercase text-blue-200 font-semibold">Latency</span>
            <p className="text-xl font-mono mt-1">
              {latency !== null ? `${latency} ms` : '—'}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md">
            <span className="text-xs uppercase text-blue-200 font-semibold">Last Checked</span>
            <p className="text-xl font-mono mt-1">{lastChecked || '—'}</p>
          </div>
        </div>

        <div className="mt-4 bg-white/10 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs uppercase text-blue-200 font-semibold">Base URL</span>
          <p className="text-lg font-mono mt-1 break-all">{baseUrl}</p>
        </div>
      </div>

      {status === 'offline' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-start space-x-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Backend Binary Not Responding</h4>
            <p className="text-sm mt-1">
              Local Node.js backend not detected on port {DEFAULT_PORT}. Ensure target host server is running via <code className="bg-red-100 px-1 py-0.5 rounded font-mono">node server.js</code>.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <Wifi className="w-5 h-5 mr-2 text-indigo-600" /> Target Network Endpoint
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={`http://172.27.204.196:${DEFAULT_PORT}`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
          />
          <button
            onClick={handleManualCheck}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm flex items-center transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Re-test Connection
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevLanSync;