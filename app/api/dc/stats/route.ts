import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/dc/stats — Aggregated DC dashboard stats
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('client_id') || 'acb4b354-728f-479d-915a-c857d27da9ad';

        // Get DC info
        const { data: dcs } = await supabaseAdmin
            .from('distribution_centers')
            .select('*')
            .eq('client_id', clientId);

        const dcIds = dcs?.map(d => d.id) || [];

        // Get DC inventory stats
        const { data: inventory } = await supabaseAdmin
            .from('dc_inventory')
            .select('quantity, low_stock_threshold')
            .in('dc_id', dcIds);

        const totalSKUs = inventory?.length || 0;
        const totalUnits = inventory?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
        const lowStockCount = inventory?.filter(i => i.quantity <= i.low_stock_threshold).length || 0;

        // Get replenishment request stats
        const { data: requests } = await supabaseAdmin
            .from('replenishment_requests')
            .select('id, status, shop_id, total_items, created_at')
            .eq('client_id', clientId);

        const allRequests = requests || [];
        const activeRequests = allRequests.filter(r => !['received', 'cancelled'].includes(r.status));
        const uniqueShops = new Set(activeRequests.map(r => r.shop_id)).size;
        const totalItemsRequested = activeRequests.reduce((s, r) => s + (r.total_items || 0), 0);

        // Status breakdown
        const statusBreakdown: Record<string, number> = {};
        allRequests.forEach(r => {
            statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
        });

        // Recent transfers (received in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentTransfers = allRequests.filter(
            r => r.status === 'received' && new Date(r.created_at) >= thirtyDaysAgo
        ).length;

        // Get shops with pending requests
        const { data: shops } = await supabaseAdmin
            .from('shops')
            .select('id, name, slug')
            .eq('client_id', clientId);

        const shopsWithRequests = (shops || []).map(shop => {
            const shopRequests = allRequests.filter(r => r.shop_id === shop.id);
            const pending = shopRequests.filter(r => !['received', 'cancelled'].includes(r.status));
            return {
                ...shop,
                totalRequests: shopRequests.length,
                pendingRequests: pending.length,
                pendingItems: pending.reduce((s, r) => s + (r.total_items || 0), 0),
            };
        }).filter(s => s.totalRequests > 0)
            .sort((a, b) => b.pendingRequests - a.pendingRequests);

        return NextResponse.json({
            dc: dcs?.[0] || null,
            stats: {
                totalSKUs,
                totalUnits,
                lowStockCount,
                activeRequests: activeRequests.length,
                totalRequests: allRequests.length,
                uniqueShopsRequesting: uniqueShops,
                totalItemsRequested,
                recentTransfers,
                statusBreakdown,
            },
            shopsWithRequests,
        });
    } catch (err: any) {
        console.error('[GET /api/dc/stats]', err);
        return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
    }
}
