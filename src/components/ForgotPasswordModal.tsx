import React from 'react';
import { X, KeyRound, FileJson, Copy, Check, AlertTriangle, Folder, FileText, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

// Placeholders — these MUST be replaced with the real values:
//   secretKey  → the value of VITE_EMERGENCY_SECRET in your .env file
//   newPassword → a strong password of your choice
const EXAMPLE_ADMIN = `{
  "action": "reset_password",
  "secretKey": "YOUR_EMERGENCY_SECRET_HERE",
  "role": "admin",
  "newPassword": "YourNewSecurePassword123"
}`;

const EXAMPLE_SUPERADMIN = `{
  "action": "reset_password",
  "secretKey": "YOUR_EMERGENCY_SECRET_HERE",
  "role": "superadmin",
  "newPassword": "YourNewSecurePassword123"
}`;

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ open, onClose }) => {
  const [copiedAdmin, setCopiedAdmin] = React.useState(false);
  const [copiedSuperadmin, setCopiedSuperadmin] = React.useState(false);

  if (!open) return null;

  const handleCopy = async (json: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    try {
      await navigator.clipboard.writeText(json);
      setter(true);
      setTimeout(() => setter(false), 2000);
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

          {/* Security warning */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-900">
              <p className="font-bold mb-1">Offline recovery only</p>
              <p className="leading-relaxed">
                This procedure is for when you cannot sign in and have no internet connection.
                It uses a local override file on the device that runs this app. A matching
                <code className="px-1 py-0.5 rounded bg-amber-100 font-mono text-xs mx-1">secretKey</code>
                must be present in the file — this is set via the
                <code className="px-1 py-0.5 rounded bg-amber-100 font-mono text-xs mx-1">VITE_EMERGENCY_SECRET</code>
                environment variable in your <code className="px-1 py-0.5 rounded bg-amber-100 font-mono text-xs">.env</code> file.
              </p>
            </div>
          </div>

          {/* Setup steps */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Setup (one-time)
            </h3>
            <ol className="space-y-2.5 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center">1</span>
                <p>Add <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs">VITE_EMERGENCY_SECRET=your-secret-value</code> to your <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs">.env</code> file.</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center">2</span>
                <p>Restart the app so the secret is baked into the build.</p>
              </li>
            </ol>
          </div>

          {/* Recovery steps */}
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
                    Navigate to <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px]">public/</code> in the app's root directory.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center">2</span>
                <div>
                  <p className="font-semibold">Create a file named <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px]">reset-override.json</code></p>
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    Paste one of the JSON templates below, then save the file.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center">3</span>
                <div>
                  <p className="font-semibold">Reload the app</p>
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3" />
                    The app reads the file at startup and applies the new password.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black flex items-center justify-center">4</span>
                <div>
                  <p className="font-semibold">Sign in with the new password, then delete the file</p>
                  <p className="text-rose-600 text-xs mt-0.5 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    Delete <code className="px-1 py-0.5 rounded bg-rose-50 font-mono text-[11px]">reset-override.json</code> to prevent reuse.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Admin JSON example */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                  Admin Override
                </h4>
              </div>
              <button
                onClick={() => handleCopy(EXAMPLE_ADMIN, setCopiedAdmin)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                aria-label="Copy admin example"
              >
                {copiedAdmin ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-300 text-xs font-mono p-4 rounded-2xl overflow-x-auto leading-relaxed">
{EXAMPLE_ADMIN}
            </pre>
          </div>

          {/* Superadmin JSON example */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                  Superadmin Override
                </h4>
              </div>
              <button
                onClick={() => handleCopy(EXAMPLE_SUPERADMIN, setCopiedSuperadmin)}
                className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 px-2.5 py-1 rounded-lg hover:bg-purple-50 transition-colors"
                aria-label="Copy superadmin example"
              >
                {copiedSuperadmin ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-300 text-xs font-mono p-4 rounded-2xl overflow-x-auto leading-relaxed">
{EXAMPLE_SUPERADMIN}
            </pre>
          </div>

          {/* Key substitution reminder */}
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
            <KeyRound className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div className="text-xs text-indigo-900 space-y-1.5">
              <p className="font-bold">Before saving, replace these placeholders:</p>
              <ul className="space-y-1">
                <li>
                  <code className="px-1.5 py-0.5 rounded bg-white font-mono text-[11px]">YOUR_EMERGENCY_SECRET_HERE</code>
                  {' '}&rarr; the exact value of <code className="px-1.5 py-0.5 rounded bg-white font-mono text-[11px]">VITE_EMERGENCY_SECRET</code> from your <code className="px-1.5 py-0.5 rounded bg-white font-mono text-[11px]">.env</code> file
                </li>
                <li>
                  <code className="px-1.5 py-0.5 rounded bg-white font-mono text-[11px]">YourNewSecurePassword123</code>
                  {' '}&rarr; a strong password you will use to sign in
                </li>
              </ul>
            </div>
          </div>

          {/* Security note */}
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <p className="text-xs text-rose-900 leading-relaxed">
              <span className="font-bold">Important:</span> If <code className="px-1 py-0.5 rounded bg-white font-mono text-[10px]">secretKey</code> does not match your
              <code className="px-1 py-0.5 rounded bg-white font-mono text-[10px]">VITE_EMERGENCY_SECRET</code>,
              the reset is <span className="font-bold">rejected silently</span> and no changes are made.
              After a successful reset, delete <code className="px-1 py-0.5 rounded bg-white font-mono text-[10px]">reset-override.json</code> immediately.
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
