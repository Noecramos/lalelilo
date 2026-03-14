import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: Fetch manager by id, or all managers
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get('id');

    if (managerId) {
        const { data, error } = await supabaseAdmin
            .from('novix_managers')
            .select('*')
            .eq('id', managerId)
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 404 });
        return NextResponse.json({ manager: data });
    }

    const { data, error } = await supabaseAdmin
        .from('novix_managers')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ managers: data });
}

// PUT: Update managed_shop_ids for a manager
export async function PUT(req: NextRequest) {
    try {
        const { managerId, managed_shop_ids, name, phone } = await req.json();

        if (!managerId) {
            return NextResponse.json({ error: 'managerId is required' }, { status: 400 });
        }

        const updateData: any = {};
        if (managed_shop_ids !== undefined) updateData.managed_shop_ids = managed_shop_ids;
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;

        const { data, error } = await supabaseAdmin
            .from('novix_managers')
            .update(updateData)
            .eq('id', managerId)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, manager: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
