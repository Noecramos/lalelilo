// API: E-Commerce (Cart, Promo Codes, KPIs, Order Tracking)
import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateCart, flagAbandonedCarts, getAbandonedCarts, validatePromoCode, createPromoCode, getSalesKPIs, getOrderTracking, logOrderStatusChange } from '@/lib/services/ecommerce';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'abandoned_carts') {
        const clientId = searchParams.get('client_id');
        if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 });
        const { data, error } = await getAbandonedCarts(clientId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }

    if (action === 'kpis') {
        const clientId = searchParams.get('client_id');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        if (!clientId || !startDate || !endDate) {
            return NextResponse.json({ error: 'client_id, start_date, end_date required' }, { status: 400 });
        }
        const kpis = await getSalesKPIs({
            clientId, startDate, endDate,
            shopId: searchParams.get('shop_id') || undefined,
        });
        return NextResponse.json(kpis);
    }

    if (action === 'order_tracking') {
        const orderId = searchParams.get('order_id');
        if (!orderId) return NextResponse.json({ error: 'order_id required' }, { status: 400 });
        const { data, error } = await getOrderTracking(orderId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { action } = body;

    if (action === 'update_cart') {
        const { clientId, shopId, customerPhone, customerName, items } = body;
        if (!clientId || !items?.length) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        const { data, error } = await createOrUpdateCart({ clientId, shopId, customerPhone, customerName, items });
        if (error) return NextResponse.json({ error: (error as Error).message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    }

    if (action === 'flag_abandoned') {
        const { data, error } = await flagAbandonedCarts(body.timeoutMinutes || 120);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ flagged: data?.length || 0 });
    }

    if (action === 'validate_promo') {
        const { code, clientId, orderTotal, customerPhone } = body;
        if (!code || !clientId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        const result = await validatePromoCode(code, clientId, orderTotal || 0, customerPhone);
        return NextResponse.json(result);
    }

    if (action === 'create_promo') {
        const { data, error } = await createPromoCode(body);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    }

    if (action === 'log_order_status') {
        const { orderId, fromStatus, toStatus, changedBy, message } = body;
        if (!orderId || !toStatus) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        await logOrderStatusChange({ orderId, fromStatus, toStatus, changedBy, message });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
