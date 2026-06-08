import { NextResponse } from 'next/server';
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '@/lib/supabaseAdmin';

function redirect(req: Request, path: string, params: Record<string, string>) {
  const url = new URL(path, req.url);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return NextResponse.redirect(url, 303);
}

export async function POST(req: Request) {
  try {
    if (!hasSupabaseAdminConfig()) throw new Error('Supabase servis bağlantısı yok.');
    const form = await req.formData();
    const full_name = String(form.get('full_name') || '').trim();
    const email = String(form.get('email') || '').trim().toLowerCase();
    const phone = String(form.get('phone') || '').trim();
    const cityRaw = String(form.get('city_id') || '').trim();
    const operator_mode = String(form.get('operator_mode') || 'BOTH').trim();
    if (!full_name || !email) throw new Error('Ad soyad ve email zorunlu.');
    const supabase = getSupabaseAdmin();
    const { data: user, error: userError } = await supabase.from('users').upsert({
      full_name,
      email,
      phone: phone || null,
      city_id: cityRaw ? Number(cityRaw) : null,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' }).select('id').single();
    if (userError) throw userError;

    const { data: role } = await supabase.from('roles').select('id').eq('role_code', 'NONSTOP_OPERATOR').maybeSingle();
    if (role?.id) {
      await supabase.from('user_roles').upsert({ user_id: user.id, role_id: role.id });
    }

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'MINI_ADMIN_OPERATOR_CREATED',
      entity_type: 'users',
      details: { operator_mode },
      created_at: new Date().toISOString(),
    });

    return redirect(req, '/mini-admin/operators', { ok: '1' });
  } catch (err: any) {
    return redirect(req, '/mini-admin/operators', { error: encodeURIComponent(err.message || 'Operatör kaydı başarısız') });
  }
}
