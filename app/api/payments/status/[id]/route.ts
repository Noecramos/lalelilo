// GET /api/payments/status/[id]
// Check payment status from Getnet

import { NextRequest, NextResponse } from 'next/server';
import { getnetService } from '@/lib/services/getnet';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: paymentId } = await params;

        // Get payment from database
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (paymentError || !payment) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            );
        }

        // If payment has a Getnet payment ID, check status with Getnet
        if (payment.getnet_payment_id) {
            try {
                const getnetStatus = await getnetService.getPaymentStatus(payment.getnet_payment_id);

                // Update database if status changed
                if (getnetStatus.status !== payment.status) {
                    await supabase
                        .from('payments')
                        .update({
                            status: getnetStatus.status,
                            status_message: getnetStatus.message,
                            approved_at: getnetStatus.status === 'approved' ? new Date().toISOString() : payment.approved_at,
                            declined_at: getnetStatus.status === 'declined' ? new Date().toISOString() : payment.declined_at,
                        })
                        .eq('id', paymentId);

                    // Update order status
                    if (getnetStatus.status === 'approved') {
                        await supabase
                            .from('orders')
                            .update({
                                payment_status: 'approved',
                                paid_at: new Date().toISOString(),
                                status: 'confirmed',
                            })
                            .eq('id', payment.order_id);
                    }
                }

                return NextResponse.json({
                    id: payment.id,
                    orderId: payment.order_id,
                    status: getnetStatus.status,
                    message: getnetStatus.message,
                    amount: payment.amount,
                    paymentMethod: payment.payment_method,
                    installments: payment.installments,
                    authorizationCode: getnetStatus.authorizationCode,
                    createdAt: payment.created_at,
                    approvedAt: getnetStatus.status === 'approved' ? new Date().toISOString() : payment.approved_at,
                });

            } catch (error) {
                console.error('Error checking Getnet status:', error);
                // Return database status if Getnet check fails
            }
        }

        // Return database status
        return NextResponse.json({
            id: payment.id,
            orderId: payment.order_id,
            status: payment.status,
            message: payment.status_message,
            amount: payment.amount,
            paymentMethod: payment.payment_method,
            installments: payment.installments,
            authorizationCode: payment.getnet_authorization_code,
            createdAt: payment.created_at,
            approvedAt: payment.approved_at,
        });

    } catch (error) {
        console.error('Payment status error:', error);
        return NextResponse.json(
            { error: 'Failed to get payment status' },
            { status: 500 }
        );
    }
}
