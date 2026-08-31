import React from 'react';
import { X, KeyRound, FileJson, Copy, Check, AlertTriangle, Folder, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

const EXAMPLE_JSON = `{
  "action": "reset_password",
  "role": "admin",
  "newPassword": "YourNewSecurePassword"
}`;

const EXAMPLE_SUPERADMIN_JSON = `{
  "action": "reset_password",
  "role": "superadmin",
  "newPassword": "YourNewSecurePassword"
}`;

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ open, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EXAMPLE_JSON);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-br from-amber-50 to-rose-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Forgot Password / Locked Out?</h2>
              <p className="text-sm text-slate-600">Offline emergency recovery for Admin accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-white/60 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Warning */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-900">
              <p className="font-bold mb-1">Offline recovery only</p>
              <p className="leading-relaxed">
                This procedure is intended for when you cannot sign in through the normal login screen
                and the school has no internet connection. It uses a local override file on the
                device that runs this app.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
              How to reset your password
            </h3>
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center">1</span>
                <div>
                  <p className="font-semibold">Open the override folder</p>
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5">
                    <Folder className="w-3 h-3" />
                    Navigate to <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">/.dyad/override/</code> in the
                    app's working directory.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center">2</span>
                <div>
                  <p className="font-semibold">Create a file named <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">password-reset.json</code></p>
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    If the file already exists, open it and replace its contents.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center">3</span>
                <div>
                  <p className="font-semibold">Paste the JSON below, then save the file</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center">4</span>
                <div>
                  <p className="font-semibold">Reload the login page</p>
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3" />
                    The app reads the file at startup and applies the new password.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* JSON example */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                  Example JSON (Admin)
                </h4>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                aria-label="Copy example"
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5" /> Copied</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy</>
                )}
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-300 text-xs font-mono p-4 rounded-2xl overflow-x-auto leading-relaxed">
{EXAMPLE_JSON}
            </pre>
          </div>

          {/* Superadmin note */}
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Resetting the Owner / Superadmin account
            </h4>
            <p className="text-xs text-indigo-800 leading-relaxed">
              If the <span className="font-bold">owner / superadmin</span> account needs recovery, change the
              <code className="px-1.5 py-0.5 rounded bg-white text-indigo-700 font-mono text-[11px] mx-1">role</code>
              field to <code className="px-1.5 py-0.5 rounded bg-white text-indigo-700 font-mono text-[11px]">"superadmin"</code>:
            </p>
            <pre className="bg-slate-900 text-emerald-300 text-xs font-mono p-4 rounded-2xl overflow-x-auto leading-relaxed">
{EXAMPLE_SUPERADMIN_JSON}
            </pre>
            <p className="text-xs text-indigo-800 leading-relaxed">
              The override file supports the <code className="px-1.5 py-0.5 rounded bg-white text-indigo-700 font-mono text-[11px]">"role"</code> values
              <span className="font-bold"> admin</span> and <span className="font-bold">superadmin</span>.
              Replace <code className="px-1.5 py-0.5 rounded bg-white text-indigo-700 font-mono text-[11px]">newPassword</code> with
              the new password you want to use.
            </p>
          </div>

          {/* Security tip */}
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <p className="text-xs text-rose-900 leading-relaxed">
              <span className="font-bold">Security tip:</span> after you sign in successfully with the new password,
              delete the <code className="px-1 py-0.5 rounded bg-white text-rose-700 font-mono text-[10px]">password-reset.json</code> file
              so it cannot be reused by anyone with access to the device.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50">
          <Button onClick={onClose} variant="outline" className="w-full rounded-xl">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
