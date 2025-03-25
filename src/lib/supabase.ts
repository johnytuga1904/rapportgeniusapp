import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zgwlrnfpyhhjjzdhrmhh.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseKey) {
  throw new Error('Fehlender Supabase-Key');
}

export const supabase = createClient(supabaseUrl, supabaseKey); 