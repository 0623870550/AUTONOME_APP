import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DEBUG ONLY – expose supabase to browser console
// @ts-ignore
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.supabase = supabase;
}
