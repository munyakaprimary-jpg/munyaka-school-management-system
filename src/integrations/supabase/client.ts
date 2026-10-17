import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtuknieivdggjwpqveor.supabase.co';
const supabaseAnonKey = 'sb_publishable_TWQ4L8-kmS9zGmZYB19bYw_QlmxgAwO';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true },
  realtime: { params: { eventsPerSecond: 10 } }
});

export default supabase;
