// /utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for interacting with the database.
 *
 * Uses environment variables:
 * - SUPABASE_URL: The URL of your Supabase project.
 * - SUPABASE_ANON_KEY: The public anonymous key for the project.
 *
 * @type {import('@supabase/supabase-js').SupabaseClient}
 *
 * @example
 * import { supabase } from './supabaseClient.js';
 *
 * const { data, error } = await supabase
 *   .from('users')
 *   .select('*');
 */
export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);
