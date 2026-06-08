import { createClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(value?: string | null) {
  const raw = (value || '').trim();
  if (!raw) return 'https://example.supabase.co';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw.replace(/\/rest\/v1\/?$/, '');
  if (/^[a-z0-9-]+\.supabase\.co$/i.test(raw)) return `https://${raw}`;
  if (/^[a-z0-9-]{10,}$/i.test(raw)) return `https://${raw}.supabase.co`;
  return 'https://example.supabase.co';
}

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'demo-anon-key';

export const supabase = createClient(supabaseUrl, anonKey);
