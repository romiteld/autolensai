import { createClient as createSupabaseClientBase } from '@supabase/supabase-js';
import { env } from '@/core/config/env';
import type { Database } from '@/common/types/database.types';

export const createSupabaseClient = () => {
  return createSupabaseClientBase<Database>(
    env.get('NEXT_PUBLIC_SUPABASE_URL'),
    env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
};

export const createSupabaseAdmin = () => {
  return createSupabaseClientBase<Database>(
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

// Export the original createClient function for backward compatibility
export const createClient = createSupabaseClient;

// Export a default supabase instance
export const supabase = createSupabaseClient();