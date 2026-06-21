import { createClient } from '@supabase/supabase-js';

// Helper to safely strip surrounding single and double quotes
const cleanEnvVar = (val: string): string => {
  let cleaned = (val || '').trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
};

const rawUrl = cleanEnvVar((import.meta as any).env?.VITE_SUPABASE_URL || '');

const sanitizeUrl = (url: string) => {
  let cleaned = url.trim();
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  if (cleaned.endsWith('/rest/v1')) {
    cleaned = cleaned.slice(0, -8);
  }
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned;
};

const supabaseUrl = sanitizeUrl(rawUrl);
const supabaseAnonKey = cleanEnvVar((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '');

// Kita pastikan inisialisasi tidak menyebabkan kegagalan fatal pada aplikasi jika variabel belum didefinisikan
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseUrl !== 'your-supabase-url' &&
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-anon-public-key' &&
  supabaseAnonKey !== 'your-supabase-anon-key'
);

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-url.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
);
