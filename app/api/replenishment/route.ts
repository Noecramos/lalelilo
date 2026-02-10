// API: Replenishment Requests
import { NextRequest, NextResponse } from 'next/server';
import { createReplenishmentRequest, getReplenishmentRequests } from '@/lib/services/replenishment';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shop_id') || undefined;
    const dcId = searchParams.get('dc_id') || undefined;
    const status = searchParams.get('status') || undefined;

    const { data, error } = await getReplenishmentRequests({ shopId, dcId, status });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { clientId, shopId, dcId, requestedBy, items, notes, expectedDelivery } = body;

    if (!clientId || !shopId || !dcId || !requestedBy || !items?.length) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await createReplenishmentRequest({
        clientId, shopId, dcId, requestedBy, items, notes, expectedDelivery,
    });

    if (error) return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
