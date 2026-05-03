import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // On retire lockType et on laisse Supabase gérer intelligemment
    // Mais on s'assure que sur le Web, il ne reste pas bloqué
  },
});

// FONCTION MAGIQUE POUR RÉPARER LE 404
export const getPublicMediaUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith('http')) return path;

  const { data } = supabase.storage
    .from('alerte_files')
    .getPublicUrl(path);

  return data.publicUrl;
};
