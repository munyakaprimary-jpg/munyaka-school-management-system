import React from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthLoadingFallback from './AuthLoadingFallback';

interface Props {
  children: React.ReactNode;
}

/**
 * AuthGate
 *
 * Renders a full-screen loading fallback while AuthContext is hydrating
 * (i.e. while `isLoading` is true). This prevents downstream hooks and
 * components from accessing a `null` user or reading `undefined.role`
 * during the first render — a common source of crashes on the Android
 * WebView at app launch.
 *
 * Once hydration finishes, the children render as normal. If the user is
 * not authenticated, downstream `<ProtectedRoute>` will redirect them
 * to /login; we do not do that here so the gate has a single concern.
 */
const AuthGate: React.FC<Props> = ({ children }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoadingFallback />;
  }

  return <>{children}</>;
};

export default AuthGate;
