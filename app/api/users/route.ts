// API: Users management
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');

    let query = supabaseAdmin
        .from('users')
        .select('id, name, email, phone, role, is_active, shop_id, created_at, shops(name)')
        .order('role', { ascending: true })
        .order('name', { ascending: true });

    if (clientId) {
        query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
}
