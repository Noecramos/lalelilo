import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const DEFAULT_CLIENT_ID = (process.env.DEFAULT_CLIENT_ID || 'acb4b354-728f-479d-915a-c857d27da9ad').trim();

// Generate unique order number
function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `LAL-${timestamp}-${random}`.toUpperCase();
}

// GET /api/orders - List orders
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const shopId = searchParams.get('shop_id');
        const clientId = searchParams.get('client_id');
        const status = searchParams.get('status');
        const orderType = searchParams.get('order_type');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = supabaseAdmin
            .from('orders')
            .select('*, shops(name, slug)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Filters
        if (shopId) {
            query = query.eq('shop_id', shopId);
        }

        if (clientId) {
            query = query.eq('client_id', clientId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (orderType) {
            query = query.eq('order_type', orderType);
        }

        const { data: orders, error, count } = await query;

        if (error) {
            console.error('Error fetching orders:', error);
            return NextResponse.json(
                { error: 'Failed to fetch orders', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            orders,
            count,
            limit,
            offset
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            shop_id,
            customer_name,
            customer_email,
            customer_phone,
            customer_cpf,
            customer_cep,
            customer_address,
            customer_city,
            customer_state,
            customer_neighborhood,
            customer_complement,
            order_type = 'delivery',
            items,
            subtotal,
            delivery_fee,
            delivery_address,
            discount,
            total_amount,
            total,
            payment_method,
            customer_notes
        } = body;

        const clientId = body.client_id || DEFAULT_CLIENT_ID;

        // Validation
        if (!customer_name || !customer_phone || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields: customer_name, customer_phone, items' },
                { status: 400 }
            );
        }

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Calculate total if not provided
        const computedSubtotal = subtotal || items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
        const computedDelivery = delivery_fee ?? 0;
        const computedTotal = total_amount || total || (computedSubtotal + computedDelivery - (discount || 0));

        // Extract address fields from delivery_address if provided
        const addr = delivery_address || {};

        // Create order
        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .insert({
                order_number: orderNumber,
                shop_id: shop_id || null,
                client_id: clientId,
                customer_name,
                customer_email: customer_email || null,
                customer_phone,
                customer_cep: customer_cep || addr.cep || null,
                customer_address: customer_address || addr.address || null,
                customer_city: customer_city || addr.city || null,
                customer_state: customer_state || addr.state || null,
                customer_neighborhood: customer_neighborhood || addr.neighborhood || null,
                customer_complement: customer_complement || addr.complement || null,
                order_type,
                status: 'pending',
                subtotal: parseFloat(computedSubtotal) || 0,
                delivery_fee: parseFloat(computedDelivery) || 0,
                discount: parseFloat(discount || 0),
                total_amount: parseFloat(computedTotal) || 0,
                payment_method: payment_method || 'pix',
                payment_status: 'pending',
                items,
                customer_notes: customer_notes || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating order:', error);
            return NextResponse.json(
                { error: 'Failed to create order', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            order
        }, { status: 201 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
