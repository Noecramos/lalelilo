import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/analytics/dashboard - Get dashboard metrics
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');
        const shopId = searchParams.get('shop_id');
        const period = searchParams.get('period') || '30'; // days

        if (!clientId) {
            return NextResponse.json(
                { error: 'client_id is required' },
                { status: 400 }
            );
        }

        const periodDays = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);

        // Build base query
        let ordersQuery = supabase
            .from('orders')
            .select('*')
            .eq('client_id', clientId)
            .gte('created_at', startDate.toISOString())
            .neq('status', 'cancelled');

        if (shopId) {
            ordersQuery = ordersQuery.eq('shop_id', shopId);
        }

        const { data: orders, error } = await ordersQuery;

        if (error) {
            console.error('Error fetching orders:', error);
            return NextResponse.json(
                { error: 'Failed to fetch analytics', details: error.message },
                { status: 500 }
            );
        }

        // Calculate metrics
        const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;
        const totalOrders = orders?.length || 0;
        const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Get active shops count
        let shopsQuery = supabase
            .from('shops')
            .select('id', { count: 'exact' })
            .eq('client_id', clientId)
            .eq('is_active', true);

        const { count: activeShops } = await shopsQuery;

        // Revenue by shop
        const revenueByShop: Record<string, { revenue: number; orders: number; shop_name: string }> = {};

        if (orders) {
            for (const order of orders) {
                if (!order.shop_id) continue;

                if (!revenueByShop[order.shop_id]) {
                    revenueByShop[order.shop_id] = {
                        revenue: 0,
                        orders: 0,
                        shop_name: ''
                    };
                }

                revenueByShop[order.shop_id].revenue += parseFloat(order.total_amount || 0);
                revenueByShop[order.shop_id].orders += 1;
            }
        }

        // Get shop names
        const shopIds = Object.keys(revenueByShop);
        if (shopIds.length > 0) {
            const { data: shops } = await supabase
                .from('shops')
                .select('id, name')
                .in('id', shopIds);

            shops?.forEach(shop => {
                if (revenueByShop[shop.id]) {
                    revenueByShop[shop.id].shop_name = shop.name;
                }
            });
        }

        // Top products
        const productSales: Record<string, { quantity: number; revenue: number; name: string }> = {};

        if (orders) {
            for (const order of orders) {
                const items = order.items || [];
                for (const item of items) {
                    if (!productSales[item.product_id]) {
                        productSales[item.product_id] = {
                            quantity: 0,
                            revenue: 0,
                            name: item.product_name || 'Unknown'
                        };
                    }
                    productSales[item.product_id].quantity += item.quantity;
                    productSales[item.product_id].revenue += parseFloat(item.subtotal || 0);
                }
            }
        }

        const topProducts = Object.entries(productSales)
            .map(([id, data]) => ({ product_id: id, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Revenue trend (daily)
        const revenueTrend: Record<string, number> = {};
        if (orders) {
            for (const order of orders) {
                const date = new Date(order.created_at).toISOString().split('T')[0];
                if (!revenueTrend[date]) {
                    revenueTrend[date] = 0;
                }
                revenueTrend[date] += parseFloat(order.total_amount || 0);
            }
        }

        const trendData = Object.entries(revenueTrend)
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            success: true,
            metrics: {
                totalRevenue,
                totalOrders,
                avgTicket,
                activeShops: activeShops || 0
            },
            revenueByShop: Object.entries(revenueByShop).map(([shop_id, data]) => ({
                shop_id,
                ...data
            })),
            topProducts,
            revenueTrend: trendData,
            period: periodDays
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
