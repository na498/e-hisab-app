import { createClient } from '@supabase/supabase-js';

// .env ফাইল থেকে ভ্যালুগুলো নেওয়া হচ্ছে
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


export const isSupabaseConfigured = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(supabaseUrl && supabaseAnonKey);
};