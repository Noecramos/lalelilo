// POST /api/payments/create
// Create a new payment transaction with Getnet

import { NextRequest, NextResponse } from 'next/server';
import { getnetService } from '@/lib/services/getnet';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            orderId,
            amount,
            customerId,
            customerName,
            customerEmail,
            customerDocument,
            card,
            installments = 1,
        } = body;

        // Validate required fields
        if (!orderId || !amount || !customerId || !customerName || !customerEmail || !card) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate card data
        if (!card.number || !card.holderName || !card.expirationMonth || !card.expirationYear || !card.securityCode) {
            return NextResponse.json(
                { error: 'Invalid card data' },
                { status: 400 }
            );
        }

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, shop:shops(*)')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Create payment with Getnet
        const paymentRequest = {
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'BRL',
            orderId: orderId,
            customerId: customerId,
            customerName: customerName,
            customerEmail: customerEmail,
            customerDocument: customerDocument || '00000000000',
            card: {
                number: card.number.replace(/\s/g, ''),
                holderName: card.holderName.toUpperCase(),
                expirationMonth: card.expirationMonth.padStart(2, '0'),
                expirationYear: card.expirationYear,
                securityCode: card.securityCode,
            },
            installments: installments,
        };

        const paymentResult = await getnetService.createPayment(paymentRequest);

        // Save payment to database
        const { data: payment, error: paymentDbError } = await supabase
            .from('payments')
            .insert({
                order_id: orderId,
                shop_id: order.shop_id,
                amount: amount,
                currency: 'BRL',
                payment_method: 'credit_card',
                installments: installments,
                getnet_payment_id: paymentResult.paymentId,
                getnet_authorization_code: paymentResult.authorizationCode,
                getnet_transaction_id: paymentResult.transactionId,
                status: paymentResult.status,
                status_message: paymentResult.message,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_document: customerDocument,
                card_last_digits: card.number.slice(-4),
                response_data: paymentResult,
                approved_at: paymentResult.status === 'approved' ? new Date().toISOString() : null,
                declined_at: paymentResult.status === 'declined' ? new Date().toISOString() : null,
            })
            .select()
            .single();

        if (paymentDbError) {
            console.error('Error saving payment:', paymentDbError);
        }

        // Update order with payment info
        if (paymentResult.status === 'approved') {
            await supabase
                .from('orders')
                .update({
                    payment_method: 'credit_card',
                    payment_status: 'approved',
                    payment_id: paymentResult.paymentId,
                    payment_data: paymentResult,
                    paid_at: new Date().toISOString(),
                    status: 'confirmed', // Update order status
                })
                .eq('id', orderId);
        } else {
            await supabase
                .from('orders')
                .update({
                    payment_method: 'credit_card',
                    payment_status: paymentResult.status,
                    payment_id: paymentResult.paymentId,
                    payment_data: paymentResult,
                })
                .eq('id', orderId);
        }

        return NextResponse.json({
            success: paymentResult.status === 'approved',
            payment: {
                id: payment?.id,
                paymentId: paymentResult.paymentId,
                status: paymentResult.status,
                message: paymentResult.message,
                authorizationCode: paymentResult.authorizationCode,
            },
        });

    } catch (error) {
        console.error('Payment creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create payment', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
