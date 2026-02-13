import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-only Supabase admin client (service role key)
// This file should NEVER be imported from client components ('use client')

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key').trim();

const globalForSupabase = globalThis as unknown as {
    _supabaseAdmin?: SupabaseClient;
};

export const supabaseAdmin: SupabaseClient =
    globalForSupabase._supabaseAdmin ??
    (globalForSupabase._supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }));
