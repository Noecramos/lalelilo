// Create Test Order for Payment Testing
// Usage: node create-test-order.mjs

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestOrder() {
    console.log('🧪 Creating Test Order for Payment Testing...\n');

    try {
        // Get first shop
        const { data: shops } = await supabase
            .from('shops')
            .select('*')
            .limit(1);

        if (!shops || shops.length === 0) {
            console.error('❌ No shops found. Please create a shop first.');
            return;
        }

        const shop = shops[0];
        console.log('✅ Using shop:', shop.name);

        // Get first client
        const { data: clients } = await supabase
            .from('clients')
            .select('*')
            .limit(1);

        if (!clients || clients.length === 0) {
            console.error('❌ No clients found. Please create a client first.');
            return;
        }

        const client = clients[0];
        console.log('✅ Using client:', client.name);

        // Create test order
        const testOrder = {
            order_number: 'TEST-' + Date.now(),
            shop_id: shop.id,
            client_id: client.id,
            customer_name: 'João Silva Teste',
            customer_email: 'joao.teste@example.com',
            customer_phone: '81999999999',
            customer_address: 'Rua Teste, 123',
            customer_city: 'Recife',
            customer_state: 'PE',
            customer_cep: '50000000',
            customer_neighborhood: 'Boa Viagem',
            order_type: 'delivery',
            delivery_fee: 5.00,
            subtotal: 45.00,
            total_amount: 50.00,
            status: 'pending',
            payment_status: 'pending',
            items: [
                {
                    name: 'Produto Teste 1',
                    quantity: 2,
                    price: 15.00,
                    total: 30.00
                },
                {
                    name: 'Produto Teste 2',
                    quantity: 1,
                    price: 15.00,
                    total: 15.00
                }
            ],
            customer_notes: 'Pedido de teste para integração de pagamento Getnet'
        };

        const { data: order, error } = await supabase
            .from('orders')
            .insert(testOrder)
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating order:', error);
            return;
        }

        console.log('\n✅ Test Order Created Successfully!\n');
        console.log('📋 Order Details:');
        console.log('   ID:', order.id);
        console.log('   Order Number:', order.order_number);
        console.log('   Customer:', order.customer_name);
        console.log('   Email:', order.customer_email);
        console.log('   Total: R$', order.total_amount.toFixed(2));
        console.log('   Status:', order.status);
        console.log('   Payment Status:', order.payment_status);

        console.log('\n🔗 Payment URL:');
        console.log(`   http://localhost:3000/checkout/payment?orderId=${order.id}`);

        console.log('\n💳 Test Cards:');
        console.log('   Approved: 4012 0010 3714 1112');
        console.log('   Declined: 4012 0010 3844 3335');
        console.log('   CVV: 123 | Expiry: 12/28');

        console.log('\n🎯 Next Steps:');
        console.log('   1. Copy the Payment URL above');
        console.log('   2. Open it in your browser');
        console.log('   3. Enter the test card details');
        console.log('   4. Click "Pagar"');
        console.log('   5. Watch the magic happen! ✨');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

createTestOrder();
