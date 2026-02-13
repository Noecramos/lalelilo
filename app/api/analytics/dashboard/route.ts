import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// GET /api/analytics/dashboard - Get dashboard metrics
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const shopSlug = searchParams.get('shop_slug');
        const shopIdParam = searchParams.get('shop_id');
        const period = searchParams.get('period') || '30'; // days

        const periodDays = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);

        let targetShopId = shopIdParam;

        // Resolve slug to ID if needed
        if (shopSlug && !targetShopId) {
            const { data: shop } = await supabase
                .from('shops')
                .select('id')
                .eq('slug', shopSlug)
                .single();

            if (shop) {
                targetShopId = shop.id;
            } else {
                return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
            }
        }

        // Build orders query
        // Note: In schema, orders.client_id references shops.id
        let ordersQuery = supabase
            .from('orders')
            .select('*, client_id') // client_id IS the shop_id here
            .gte('created_at', startDate.toISOString())
            .neq('status', 'cancelled');

        if (targetShopId) {
            ordersQuery = ordersQuery.eq('client_id', targetShopId);
        }

        const { data: orders, error } = await ordersQuery;

        if (error) {
            console.error('Error fetching orders:', error);
            return NextResponse.json(
                { error: 'Failed to fetch analytics', details: error.message },
                { status: 500 }
            );
        }

        // Calculate aggregate metrics
        const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;
        const totalOrders = orders?.length || 0;
        const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Get shops info
        let shopsQuery = supabase
            .from('shops')
            .select('id, name, city, is_active');

        const { data: shops } = await shopsQuery;
        const activeShops = shops?.filter(s => s.is_active).length || 0;
        const shopsMap = new Map(shops?.map(s => [s.id, s]) || []);

        // Revenue by shop (Top Shops)
        const revenueByShop: Record<string, { revenue: number; orders: number; shop_name: string; city: string; growth: number }> = {};

        if (orders) {
            for (const order of orders) {
                const sId = order.client_id; // Mapping client_id to shop
                if (!sId) continue;

                if (!revenueByShop[sId]) {
                    const shopInfo = shopsMap.get(sId);
                    revenueByShop[sId] = {
                        revenue: 0,
                        orders: 0,
                        shop_name: shopInfo?.name || 'Unknown',
                        city: shopInfo?.city || '-',
                        growth: 0 // Placeholder for real growth calc
                    };
                }

                revenueByShop[sId].revenue += parseFloat(order.total_amount || 0);
                revenueByShop[sId].orders += 1;
            }
        }

        const topShops = Object.entries(revenueByShop)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Top products
        const productSales: Record<string, { quantity: number; revenue: number; name: string }> = {};

        if (orders) {
            for (const order of orders) {
                // Handle different item structure if needed (array vs jsonb)
                const items = Array.isArray(order.items) ? order.items : [];
                for (const item of items) {
                    // Need handle cases where items might be stored differently
                    const pName = item.name || item.product_name || 'Produto';
                    const pId = item.id || item.product_id || pName;

                    if (!productSales[pId]) {
                        productSales[pId] = {
                            quantity: 0,
                            revenue: 0,
                            name: pName
                        };
                    }
                    productSales[pId].quantity += (item.quantity || 1);
                    productSales[pId].revenue += parseFloat(item.price || item.unit_price || 0) * (item.quantity || 1);
                }
            }
        }

        const topProducts = Object.entries(productSales)
            .map(([id, data]) => ({ product_id: id, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

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
                activeShops,
                // Mock growths for now as we don't fetch prev period
                revenueGrowth: 12.5,
                ordersGrowth: 8.3
            },
            topShops,
            topProducts,
            revenueTrend: trendData,
            period: periodDays,
            recentOrders: orders?.slice(0, 10) || [] // Return recent orders for shop dashboard
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
