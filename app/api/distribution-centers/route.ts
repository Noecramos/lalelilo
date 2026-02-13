import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('client_id');

        let query = supabaseAdmin
            .from('distribution_centers')
            .select('*')
            .order('name');

        if (clientId) {
            query = query.eq('client_id', clientId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[GET /api/distribution-centers] Error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data || []);
    } catch (err: any) {
        console.error('[GET /api/distribution-centers] Unexpected:', err);
        return NextResponse.json(
            { error: err?.message || 'Internal error' },
            { status: 500 }
        );
    }
}
