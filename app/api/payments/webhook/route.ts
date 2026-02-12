// POST /api/payments/webhook
// Handle payment notifications from Getnet

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log('📬 Getnet webhook received:', body);

        // Extract payment info from webhook
        const {
            payment_id,
            status,
            authorization_code,
            order_id,
        } = body;

        if (!payment_id) {
            return NextResponse.json(
                { error: 'Missing payment_id' },
                { status: 400 }
            );
        }

        // Find payment in database
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .select('*')
            .eq('getnet_payment_id', payment_id)
            .single();

        if (paymentError || !payment) {
            console.error('Payment not found for webhook:', payment_id);
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            );
        }

        // Map Getnet status to our status
        const statusMap: Record<string, string> = {
            'APPROVED': 'approved',
            'AUTHORIZED': 'approved',
            'PENDING': 'pending',
            'DENIED': 'declined',
            'ERROR': 'error',
            'CANCELED': 'declined',
        };

        const mappedStatus = statusMap[status] || 'error';

        // Update payment in database
        await supabase
            .from('payments')
            .update({
                status: mappedStatus,
                getnet_authorization_code: authorization_code || payment.getnet_authorization_code,
                response_data: body,
                approved_at: mappedStatus === 'approved' ? new Date().toISOString() : payment.approved_at,
                declined_at: mappedStatus === 'declined' ? new Date().toISOString() : payment.declined_at,
            })
            .eq('id', payment.id);

        // Update order status
        if (mappedStatus === 'approved') {
            await supabase
                .from('orders')
                .update({
                    payment_status: 'approved',
                    paid_at: new Date().toISOString(),
                    status: 'confirmed',
                })
                .eq('id', payment.order_id);

            console.log('✅ Payment approved via webhook:', payment_id);

            // TODO: Send confirmation email to customer
            // TODO: Notify shop owner

        } else if (mappedStatus === 'declined') {
            await supabase
                .from('orders')
                .update({
                    payment_status: 'declined',
                })
                .eq('id', payment.order_id);

            console.log('❌ Payment declined via webhook:', payment_id);
        }

        return NextResponse.json({
            success: true,
            message: 'Webhook processed',
        });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { error: 'Failed to process webhook' },
            { status: 500 }
        );
    }
}

// GET endpoint for webhook verification (some payment gateways require this)
export async function GET(request: NextRequest) {
    return NextResponse.json({
        status: 'active',
        service: 'Lalelilo Payment Webhook',
    });
}
