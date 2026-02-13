// Lalelilo - Module 3: E-Commerce (Cart, Promo, KPIs, Order Tracking)

import { createClient } from '@supabase/supabase-js';
import { createNotification } from './core';
import { buildOrderStatusMessage } from './waha';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const getSupabase = () => createClient(supabaseUrl, supabaseKey);

// ============================================================================
// CART
// ============================================================================

export async function createOrUpdateCart(params: {
    clientId: string;
    shopId?: string;
    customerPhone?: string;
    customerName?: string;
    items: Array<{ product_id: string; size?: string; color?: string; quantity: number; price: number }>;
}) {
    const supabase = getSupabase();
    let cart = null;

    if (params.customerPhone) {
        const { data } = await supabase.from('carts').select('id')
            .eq('customer_phone', params.customerPhone).eq('is_abandoned', false)
            .is('converted_at', null).order('created_at', { ascending: false }).limit(1).single();
        cart = data;
    }

    if (cart) {
        await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    } else {
        const exp = new Date(); exp.setHours(exp.getHours() + 2);
        const { data: c } = await supabase.from('carts').insert({
            client_id: params.clientId, shop_id: params.shopId,
            customer_phone: params.customerPhone, customer_name: params.customerName,
            expires_at: exp.toISOString(),
        }).select().single();
        cart = c;
    }

    if (!cart) return { error: new Error('Failed to create cart') };
    await supabase.from('cart_items').insert(params.items.map(i => ({ cart_id: cart!.id, ...i })));
    return { data: cart };
}

export async function flagAbandonedCarts(timeoutMinutes = 120) {
    const supabase = getSupabase();
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString();
    return supabase.from('carts').update({ is_abandoned: true, abandoned_at: new Date().toISOString() })
        .eq('is_abandoned', false).is('converted_at', null).lt('updated_at', cutoff).select('id, customer_phone');
}

export async function getAbandonedCarts(clientId: string, limit = 50) {
    const supabase = getSupabase();
    return supabase.from('carts')
        .select('*, items:cart_items(*, product:products(id, name, image_url, price))')
        .eq('client_id', clientId).eq('is_abandoned', true).is('converted_at', null)
        .order('abandoned_at', { ascending: false }).limit(limit);
}

// ============================================================================
// PROMO CODES
// ============================================================================

export async function createPromoCode(params: {
    clientId: string; code: string; description?: string;
    discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
    discountValue: number; minOrderValue?: number; maxUses?: number;
    maxUsesPerUser?: number; validFrom?: string; validUntil?: string;
    createdBy: string;
}) {
    const supabase = getSupabase();
    return supabase.from('promo_codes').insert({
        client_id: params.clientId, code: params.code.toUpperCase(),
        description: params.description, discount_type: params.discountType,
        discount_value: params.discountValue, min_order_value: params.minOrderValue || 0,
        max_uses: params.maxUses, max_uses_per_user: params.maxUsesPerUser || 1,
        valid_from: params.validFrom || new Date().toISOString(),
        valid_until: params.validUntil, created_by: params.createdBy,
    }).select().single();
}

export async function validatePromoCode(code: string, clientId: string, orderTotal: number, customerPhone?: string) {
    const supabase = getSupabase();
    const { data: promo } = await supabase.from('promo_codes').select('*')
        .eq('client_id', clientId).eq('code', code.toUpperCase()).eq('is_active', true).single();

    if (!promo) return { valid: false, reason: 'Código inválido' };

    const now = new Date();
    if (promo.valid_from && new Date(promo.valid_from) > now) return { valid: false, reason: 'Promoção ainda não começou' };
    if (promo.valid_until && new Date(promo.valid_until) < now) return { valid: false, reason: 'Promoção expirada' };
    if (promo.max_uses && promo.uses_count >= promo.max_uses) return { valid: false, reason: 'Limite atingido' };
    if (orderTotal < promo.min_order_value) return { valid: false, reason: `Pedido mínimo R$ ${promo.min_order_value}` };

    if (customerPhone && promo.max_uses_per_user) {
        const { count } = await supabase.from('promo_usage').select('id', { count: 'exact' })
            .eq('promo_code_id', promo.id).eq('customer_phone', customerPhone);
        if (count && count >= promo.max_uses_per_user) return { valid: false, reason: 'Cupom já utilizado' };
    }

    let discount = 0;
    if (promo.discount_type === 'percentage') discount = (orderTotal * promo.discount_value) / 100;
    else if (promo.discount_type === 'fixed_amount') discount = promo.discount_value;

    return { valid: true, promo, discount: Math.min(discount, orderTotal) };
}

export async function recordPromoUsage(promoCodeId: string, orderId: string, customerPhone: string, discountApplied: number) {
    const supabase = getSupabase();
    await supabase.from('promo_usage').insert({ promo_code_id: promoCodeId, order_id: orderId, customer_phone: customerPhone, discount_applied: discountApplied });
}

// ============================================================================
// ORDER STATUS TRACKING
// ============================================================================

export async function logOrderStatusChange(params: {
    orderId: string; fromStatus: string; toStatus: string; changedBy?: string; message?: string;
}) {
    const supabase = getSupabase();
    await supabase.from('order_status_log').insert({
        order_id: params.orderId, from_status: params.fromStatus, to_status: params.toStatus,
        changed_by: params.changedBy, message: params.message,
    });

    const { data: order } = await supabase.from('orders').select('order_number, customer_name, customer_phone')
        .eq('id', params.orderId).single();

    if (order?.customer_phone) {
        await createNotification({
            type: 'order_status', phoneNumber: order.customer_phone,
            body: buildOrderStatusMessage(order.order_number, params.toStatus, order.customer_name),
        });
    }
}

export async function getOrderTracking(orderId: string) {
    const supabase = getSupabase();
    return supabase.from('order_status_log').select('*, changed_by_user:users!changed_by(id, name)')
        .eq('order_id', orderId).order('created_at', { ascending: true });
}

// ============================================================================
// SALES KPIs
// ============================================================================

export async function getSalesKPIs(params: { clientId: string; shopId?: string; startDate: string; endDate: string }) {
    const supabase = getSupabase();
    let query = supabase.from('orders').select('id, total_amount, items, status, created_at')
        .eq('client_id', params.clientId).gte('created_at', params.startDate)
        .lte('created_at', params.endDate).neq('status', 'cancelled');
    if (params.shopId) query = query.eq('shop_id', params.shopId);

    const { data: orders } = await query;
    if (!orders?.length) return { aov: 0, total_revenue: 0, total_orders: 0, conversion_rate: 0, top_products: [] };

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
    const aov = totalRevenue / orders.length;

    const { count: cartCount } = await supabase.from('carts').select('id', { count: 'exact' })
        .eq('client_id', params.clientId).gte('created_at', params.startDate).lte('created_at', params.endDate);
    const conversionRate = cartCount && cartCount > 0 ? (orders.length / cartCount) * 100 : 0;

    // Top Products (Curve A)
    const ps: Record<string, { name: string; qty: number; rev: number }> = {};
    for (const o of orders) {
        const items = (typeof o.items === 'string' ? JSON.parse(o.items) : o.items) as Array<{ product_id: string; name?: string; product_name?: string; quantity: number; price: number }>;
        for (const i of items || []) {
            if (!ps[i.product_id]) ps[i.product_id] = { name: i.product_name || i.name || '', qty: 0, rev: 0 };
            ps[i.product_id].qty += i.quantity;
            ps[i.product_id].rev += i.quantity * i.price;
        }
    }

    return {
        aov: Math.round(aov * 100) / 100, total_revenue: Math.round(totalRevenue * 100) / 100,
        total_orders: orders.length, conversion_rate: Math.round(conversionRate * 100) / 100,
        top_products: Object.entries(ps).map(([id, d]) => ({ product_id: id, ...d })).sort((a, b) => b.rev - a.rev).slice(0, 20),
    };
}
