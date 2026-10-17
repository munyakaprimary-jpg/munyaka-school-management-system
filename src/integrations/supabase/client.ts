import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zjopubqlwwawibjhwiv.supabase.co';
const supabaseAnonKey = 'sb_publishable_TWQ4L8-kmS9zGmZYB19bYw_Q1mxgAwO';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true },
  realtime: { params: { eventsPerSecond: 10 } }
});

export default supabase;
