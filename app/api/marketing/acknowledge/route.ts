import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST /api/marketing/acknowledge — Shop acknowledges a campaign
export async function POST(req: NextRequest) {
    try {
        const { campaign_id, shop_id, notes } = await req.json();

        if (!campaign_id || !shop_id) {
            return NextResponse.json(
                { error: 'campaign_id and shop_id are required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('campaign_acknowledgements')
            .upsert(
                { campaign_id, shop_id, notes, acknowledged_at: new Date().toISOString() },
                { onConflict: 'campaign_id,shop_id' }
            )
            .select()
            .single();

        if (error) {
            console.error('[POST /api/marketing/acknowledge]', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
    }
}
