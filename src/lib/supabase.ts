/**
 * Compatibility shim — Supabase client is NOT used by this app's local-only
 * build. The local LAN Express server (server/index.js) is the source of
 * truth for all data.
 *
 * This module re-exports a minimal `supabase` proxy so existing imports
 * (`import { supabase } from '@/lib/supabase'`) continue to compile
 * without throwing. Real network calls go to the LAN server via fetch().
 */

const noopAsync = async () => ({ data: null, error: new Error('Supabase not configured — use LAN server instead') });

// Minimal surface area: chainable .from(table).select()... style stubs.
// Each method returns a thenable that resolves to the noop payload above.
const makeThenable = () => {
  const t: any = {};
  t.then = (resolve: any) => Promise.resolve(noopAsync()).then(resolve);
  t.catch = (reject: any) => Promise.reject(reject);
  t.from = () => makeThenable();
  t.select = () => makeThenable();
  t.insert = () => makeThenable();
  t.update = () => makeThenable();
  t.upsert = () => makeThenable();
  t.delete = () => makeThenable();
  t.eq = () => makeThenable();
  t.order = () => makeThenable();
  t.limit = () => makeThenable();
  t.single = () => makeThenable();
  return t;
};

export const supabase: any = {
  from: () => makeThenable(),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: null, error: new Error('Supabase disabled') }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: new Error('Supabase disabled') }),
      download: async () => ({ data: null, error: new Error('Supabase disabled') }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
};

export default supabase;
