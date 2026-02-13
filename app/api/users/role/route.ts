import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// PUT /api/users/role — Update user role
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { user_id, role } = body;

        if (!user_id || !role) {
            return NextResponse.json({ error: 'user_id and role are required' }, { status: 400 });
        }

        const validRoles = ['super_admin', 'shop_admin', 'store_manager', 'sales_associate', 'auditor', 'staff', 'marketing'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('users')
            .update({ role })
            .eq('id', user_id)
            .select('id, name, email, role')
            .single();

        if (error) {
            console.error('[PUT /api/users/role]', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        console.error('[PUT /api/users/role]', err);
        return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
    }
}
