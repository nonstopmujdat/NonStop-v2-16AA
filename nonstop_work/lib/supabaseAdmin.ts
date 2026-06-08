import { createClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(value?: string | null) {
  const raw = (value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw.replace(/\/rest\/v1\/?$/, '');
  if (/^[a-z0-9-]+\.supabase\.co$/i.test(raw)) return `https://${raw}`;
  if (/^[a-z0-9-]{10,}$/i.test(raw)) return `https://${raw}.supabase.co`;
  return raw;
}

export function getSupabaseUrl() {
  return normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
}

export function getServiceRoleKey() {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
}

export function hasSupabaseAdminConfig() {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  return Boolean(url.startsWith('http') && key && key !== 'demo-service-role-key');
}

export function getSupabaseAdmin() {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();

  if (!url.startsWith('http')) {
    throw new Error('Missing or invalid NEXT_PUBLIC_SUPABASE_URL. Example: https://xxxxx.supabase.co');
  }
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Add it in Netlify Environment variables.');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
