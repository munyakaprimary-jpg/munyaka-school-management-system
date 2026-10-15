import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { Lock, KeyRound, CheckCircle2, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

/**
 * PasswordResetCallback
 *
 * Handles the Supabase password-reset / email-signup callback flow.
 *
 * When a user clicks a password-reset link from an email, Supabase
 * redirects them to the `redirectTo` URL with the auth tokens embedded
 * in the URL hash fragment (e.g. `#access_token=...&refresh_token=...&type=recovery`).
 *
 * Because the app uses HashRouter, the hash is preserved on navigation.
 * This component:
 *   1. Reads the hash fragment on mount and on `hashchange` events.
 *   2. Extracts the `access_token` / `refresh_token` (or `code` for PKCE).
 *   3. Exchanges the code for a session (or sets the session from the token).
 *   4. Once the session is established, renders a form to set the new password.
 */
export const PasswordResetCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const extractHashParams = (hash: string): Record<string, string> => {
    const params: Record<string, string> = {};
    if (!hash) return params;
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const pairs = cleanHash.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    }
    return params;
  };

  const processRecovery = async (params: Record<string, string>) => {
    try {
      // PKCE flow: exchange the code for a session
      if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (error) {
          throw error;
        }
        setStatus('ready');
        return;
      }

      // Hash-based flow: set the session from the access token
      if (params.access_token) {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token || '',
        });
        if (error) {
          throw error;
        }
        setStatus('ready');
        return;
      }

      // No token found — the user may have navigated here directly
      throw new Error('No authentication token found in the URL. Please use the password reset link from your email.');
    } catch (err: any) {
      console.error('Password reset callback error:', err);
      setErrorMsg(err?.message || 'Failed to process password reset link.');
      setStatus('error');
    }
  };

  const handleHashChange = () => {
    const hash = window.location.hash;
    const params = extractHashParams(hash);
    if (params.access_token || params.code) {
      processRecovery(params);
    }
  };

  useEffect(() => {
    const hash = window.location.hash;
    const params = extractHashParams(hash);

    if (params.access_token || params.code) {
      processRecovery(params);
    } else {
      // Check query params for code (PKCE flow may use query string)
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');
      if (code) {
        processRecovery({ code });
      } else {
        // No token — show error
        setErrorMsg('No authentication token found in the URL. Please use the password reset link from your email.');
        setStatus('error');
      }
    }

    // Listen for hash changes (in case the token arrives after a redirect)
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      showSuccess('Your password has been updated successfully!');
      // Clear the hash to remove tokens from the URL
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      // Navigate to login after a brief moment
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      console.error('Password update error:', err);
      showError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-600 font-medium">Verifying your password reset link...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Reset Link Invalid</h2>
          <p className="text-sm text-slate-600 mb-6">{errorMsg}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-br from-indigo-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Set New Password</h2>
              <p className="text-sm text-slate-600">Enter a secure password for your account</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Save New Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetCallback;
