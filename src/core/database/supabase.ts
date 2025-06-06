import { createClient } from '@supabase/supabase-js';
import { env } from '@/core/config/env';
import type { Database } from '@/common/types/database.types';

export const createSupabaseClient = () => {
  return createClient<Database>(
    env.get('NEXT_PUBLIC_SUPABASE_URL'),
    env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
};

export const createSupabaseAdmin = () => {
  return createClient<Database>(
    env.get('NEXT_PUBLIC_SUPABASE_URL'),
    env.get('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};