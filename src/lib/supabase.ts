/**
 * Supabase client shim.
 *
 * The app no longer uses Supabase — all data lives in the local
 * Express + SQLite server (see server/index.js). This shim provides
 * a minimal stub for files that still `import { supabase } from
 * '@/lib/supabase'` so the build doesn't break.
 *
 * Every method returns a resolved no-op promise. Real persistence
 * goes through the LAN server's /api/* endpoints via `apiGet` /
 * `apiPost` in `src/lib/api.ts`.
 */

type Result<T> = Promise<{ data: T; error: null }>;

const ok = <T>(data: T): Result<T> => Promise.resolve({ data, error: null });

// Chainable thenable for the .from(table).select()... pattern
const makeThenable = (): any => {
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (v: any) => void) => resolve(ok(null));
      }
      if (prop === 'catch') {
        return (reject: (v: any) => void) => Promise.resolve().catch(reject);
      }
      return makeThenable();
    },
  };
  return new Proxy({}, handler);
};

const fromChain = () => makeThenable();

export const supabase: any = {
  from: fromChain,
  auth: {
    getSession: () => ok({ session: null }),
    getUser: () => ok({ user: null }),
    signInWithPassword: () => ok({ user: null, session: null }),
    signOut: () => ok({}),
    onAuthStateChange: (_cb: any) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
  storage: {
    from: () => ({
      upload: () => ok(null),
      download: () => ok(null),
      getPublicUrl: (_path: string) => ({ data: { publicUrl: '' } }),
    }),
  },
};

export default supabase;
