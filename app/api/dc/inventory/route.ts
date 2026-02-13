import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/dc/inventory — DC inventory with product info
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('client_id');
        const lowStockOnly = searchParams.get('low_stock') === 'true';

        // First get DC IDs for the client
        let dcQuery = supabaseAdmin.from('distribution_centers').select('id');
        if (clientId) dcQuery = dcQuery.eq('client_id', clientId);
        const { data: dcs } = await dcQuery;
        const dcIds = dcs?.map(d => d.id) || [];

        if (dcIds.length === 0) {
            return NextResponse.json({ inventory: [], stats: { totalSKUs: 0, totalUnits: 0, lowStockCount: 0 } });
        }

        const { data: inventory, error } = await supabaseAdmin
            .from('dc_inventory')
            .select('*, products(id, name, slug, image_url, sku, price, cost_price, sizes)')
            .in('dc_id', dcIds)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('[GET /api/dc/inventory] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const items = inventory || [];
        const lowStockItems = items.filter(i => i.quantity <= i.low_stock_threshold);

        const stats = {
            totalSKUs: items.length,
            totalUnits: items.reduce((sum, i) => sum + (i.quantity || 0), 0),
            lowStockCount: lowStockItems.length,
        };

        return NextResponse.json({
            inventory: lowStockOnly ? lowStockItems : items,
            stats,
        });
    } catch (err: any) {
        console.error('[GET /api/dc/inventory] Unexpected:', err);
        return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
    }
}

// PUT /api/dc/inventory — Update DC inventory quantity
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, quantity, low_stock_threshold } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing inventory ID' }, { status: 400 });
        }

        const updateData: any = {};
        if (quantity !== undefined) updateData.quantity = quantity;
        if (low_stock_threshold !== undefined) updateData.low_stock_threshold = low_stock_threshold;

        const { data, error } = await supabaseAdmin
            .from('dc_inventory')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
    }
}
