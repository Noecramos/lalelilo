// POST /api/payments/pix
// Create a PIX payment via Getnet

import { NextRequest, NextResponse } from 'next/server';
import { getnetService } from '@/lib/services/getnet';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, amount, customerName, customerDocument } = body;

        if (!orderId || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields (orderId, amount)' },
                { status: 400 }
            );
        }

        // Get order details
        const { data: order } = await supabaseAdmin
            .from('orders')
            .select('*, shop:shops(*)')
            .eq('id', orderId)
            .single();

        // Create PIX payment via Getnet
        const pixResult = await getnetService.createPixPayment({
            amount: Math.round(amount * 100), // Convert to cents
            orderId,
            customerId: customerName || 'Cliente',
            customerName: customerName || 'Cliente',
            customerDocument: customerDocument || '00000000000',
        });

        if (pixResult.status === 'error') {
            return NextResponse.json(
                { error: pixResult.message || 'Failed to create PIX payment' },
                { status: 500 }
            );
        }

        // Save payment record
        const { data: payment } = await supabaseAdmin
            .from('payments')
            .insert({
                order_id: orderId,
                shop_id: order?.shop_id,
                amount: amount,
                currency: 'BRL',
                payment_method: 'pix',
                getnet_payment_id: pixResult.paymentId,
                status: 'pending',
                status_message: 'Aguardando pagamento PIX',
                customer_name: customerName,
                customer_document: customerDocument,
                response_data: pixResult,
            })
            .select()
            .single();

        // Update order status
        await supabaseAdmin
            .from('orders')
            .update({
                payment_method: 'pix',
                payment_status: 'pending',
                payment_id: pixResult.paymentId,
                payment_data: pixResult,
            })
            .eq('id', orderId);

        return NextResponse.json({
            success: true,
            pixCode: pixResult.pixCode,
            qrCodeImage: pixResult.qrCodeImage,
            paymentId: pixResult.paymentId || payment?.id,
            message: pixResult.message,
        });

    } catch (error) {
        console.error('PIX payment error:', error);
        return NextResponse.json(
            { error: 'Failed to create PIX payment', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
