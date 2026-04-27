import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// FONCTION MAGIQUE POUR RÉPARER LE 404
export const getPublicMediaUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith('http')) return path;

  // On force le passage par le bucket 'alerte_files'
  const { data } = supabase.storage
    .from('alerte_files')
    .getPublicUrl(path);

  return data.publicUrl;
};

// @ts-ignore
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.supabase = supabase;
}