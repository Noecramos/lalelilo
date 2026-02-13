// API: Replenishment Requests
import { NextRequest, NextResponse } from 'next/server';
import { createReplenishmentRequest, getReplenishmentRequests } from '@/lib/services/replenishment';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shop_id') || undefined;
    const dcId = searchParams.get('dc_id') || undefined;
    const status = searchParams.get('status') || undefined;

    try {
        const { data, error } = await getReplenishmentRequests({ shopId, dcId, status });
        if (error) {
            console.error('[GET /api/replenishment] Error:', error);
            return NextResponse.json({ error: (error as any).message || String(error) }, { status: 500 });
        }
        return NextResponse.json(data);
    } catch (err: any) {
        console.error('[GET /api/replenishment] Unexpected:', err);
        return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('[POST /api/replenishment] Body:', JSON.stringify(body));

        const { clientId, shopId, dcId, requestedBy, items, notes, expectedDelivery } = body;

        if (!clientId || !shopId || !dcId || !requestedBy || !items?.length) {
            return NextResponse.json(
                { error: 'Missing required fields: clientId, shopId, dcId, requestedBy, items' },
                { status: 400 }
            );
        }

        const { data, error } = await createReplenishmentRequest({
            clientId, shopId, dcId, requestedBy, items, notes, expectedDelivery,
        });

        if (error) {
            console.error('[POST /api/replenishment] Error:', error);
            return NextResponse.json(
                { error: (error as any).message || String(error), details: JSON.stringify(error) },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (err: any) {
        console.error('[POST /api/replenishment] Unexpected:', err);
        return NextResponse.json(
            { error: err?.message || 'Internal error', details: String(err) },
            { status: 500 }
        );
    }
}
