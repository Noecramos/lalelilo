import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET /api/orders/[id] - Get order by ID
// GET /api/orders/[id] - Get order by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('*, shops(id, name, slug, phone, whatsapp, address)')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Order not found' },
                    { status: 404 }
                );
            }
            console.error('Error fetching order:', error);
            return NextResponse.json(
                { error: 'Failed to fetch order', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/orders/[id] - Update order (mainly for status updates)
// PUT /api/orders/[id] - Update order (mainly for status updates)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Extract allowed update fields
        const {
            status,
            payment_status,
            internal_notes
        } = body;

        const updateData: any = {};

        if (status) {
            updateData.status = status;

            // Set timestamps based on status
            if (status === 'confirmed' && !updateData.confirmed_at) {
                updateData.confirmed_at = new Date().toISOString();
            }
            if (status === 'delivered' && !updateData.delivered_at) {
                updateData.delivered_at = new Date().toISOString();
            }
            if (status === 'cancelled' && !updateData.cancelled_at) {
                updateData.cancelled_at = new Date().toISOString();
            }
        }

        if (payment_status) {
            updateData.payment_status = payment_status;
        }

        if (internal_notes !== undefined) {
            updateData.internal_notes = internal_notes;
        }

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Order not found' },
                    { status: 404 }
                );
            }
            console.error('Error updating order:', error);
            return NextResponse.json(
                { error: 'Failed to update order', details: error.message },
                { status: 500 }
            );
        }

        // TODO: Send WhatsApp notification on status change

        return NextResponse.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/orders/[id] - Cancel order
// DELETE /api/orders/[id] - Cancel order
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Order not found' },
                    { status: 404 }
                );
            }
            console.error('Error cancelling order:', error);
            return NextResponse.json(
                { error: 'Failed to cancel order', details: error.message },
                { status: 500 }
            );
        }

        // TODO: Restore inventory
        // TODO: Send cancellation notification

        return NextResponse.json({
            success: true,
            message: 'Order cancelled successfully',
            order
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
