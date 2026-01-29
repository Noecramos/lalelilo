import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

        let query = supabase
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
            client_id,
            customer_name,
            customer_email,
            customer_phone,
            customer_cep,
            customer_address,
            customer_city,
            customer_state,
            customer_neighborhood,
            customer_complement,
            order_type,
            items,
            subtotal,
            delivery_fee,
            discount,
            total_amount,
            payment_method,
            customer_notes
        } = body;

        // Validation
        if (!client_id || !customer_name || !customer_phone || !order_type || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Generate order number
        const orderNumber = generateOrderNumber();

        // Create order
        const { data: order, error } = await supabase
            .from('orders')
            .insert({
                order_number: orderNumber,
                shop_id,
                client_id,
                customer_name,
                customer_email,
                customer_phone,
                customer_cep,
                customer_address,
                customer_city,
                customer_state,
                customer_neighborhood,
                customer_complement,
                order_type,
                status: 'pending',
                subtotal: parseFloat(subtotal),
                delivery_fee: parseFloat(delivery_fee || 0),
                discount: parseFloat(discount || 0),
                total_amount: parseFloat(total_amount),
                payment_method,
                payment_status: 'pending',
                items,
                customer_notes
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

        // TODO: Send WhatsApp notification to shop
        // TODO: Update inventory

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
