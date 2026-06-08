import { NextResponse } from 'next/server';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from './supabaseAdmin';

export function hasSupabaseAdminEnv() {
  return hasSupabaseAdminConfig();
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ ok: false, error: message, details }, { status });
}

export function getUserId(req: Request) {
  return req.headers.get('x-nonstop-user-id') || null;
}

export async function insertOne(table: string, payload: Record<string, any>) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.from(table).insert(payload).select().single();
  if (error) throw error;
  return data;
}
