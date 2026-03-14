import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET: Fetch shops managed by a specific manager
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get('managerId');

    if (!managerId) {
        return NextResponse.json({ error: 'managerId is required' }, { status: 400 });
    }

    // Get manager's managed_shop_ids
    const { data: manager, error: mgrError } = await supabaseAdmin
        .from('novix_managers')
        .select('managed_shop_ids')
        .eq('id', managerId)
        .single();

    if (mgrError || !manager) {
        return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    const shopIds: string[] = manager.managed_shop_ids || [];

    if (shopIds.length === 0) {
        return NextResponse.json({ shops: [] });
    }

    // Fetch the actual shop data
    const { data: shops, error } = await supabaseAdmin
        .from('shops')
        .select('*')
        .in('id', shopIds)
        .eq('is_active', true)
        .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ shops: shops || [] });
}
