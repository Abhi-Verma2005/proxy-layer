import { createClient } from '@supabase/supabase-js';

export const masterSupabase = createClient(
  process.env.MASTER_SUPABASE_URL!,
  process.env.MASTER_SUPABASE_KEY!
); 