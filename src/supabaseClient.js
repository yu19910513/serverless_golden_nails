import { createClient } from '@supabase/supabase-js';

// Load these from environment variables in your Vercel deployment and React build process
// For React, these are typically prefixed with REACT_APP_
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Create a single Supabase client for use throughout your app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// You can also expose the auth methods directly if preferred
export const auth = supabase.auth;