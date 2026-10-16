import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtuknieivdggjwpqveor.supabase.co';
const supabaseKey = 'sb_publishable_TWQ4L8-kmS9zGmZYB19bYw_QlmxgAw0';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true },
  realtime: { params: { eventsPerSecond: 10 } }
});

export default supabase;
