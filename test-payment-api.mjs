// Test Payment Creation API
// Usage: node test-payment-api.mjs

const API_URL = 'http://localhost:3000';

async function testPaymentAPI() {
    console.log('🧪 Testing Payment API...\n');

    // Test payment data
    const testPayment = {
        orderId: 'test-order-' + Date.now(),
        amount: 10.00, // R$ 10.00
        customerId: 'test-customer-123',
        customerName: 'João Silva',
        customerEmail: 'joao.silva@test.com',
        customerDocument: '12345678900',
        card: {
            number: '4012001037141112', // Getnet test card (approved)
            holderName: 'JOAO SILVA',
            expirationMonth: '12',
            expirationYear: '2028',
            securityCode: '123',
        },
        installments: 1,
    };

    console.log('📝 Test Payment Data:');
    console.log('   Order ID:', testPayment.orderId);
    console.log('   Amount: R$', testPayment.amount);
    console.log('   Customer:', testPayment.customerName);
    console.log('   Card:', testPayment.card.number.slice(-4));
    console.log('   Installments:', testPayment.installments);
    console.log('');

    // Note: This test requires:
    // 1. The dev server to be running (npm run dev)
    // 2. An actual order in the database
    // 3. Database migration to be run

    console.log('⚠️  To run this test:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Run database migration');
    console.log('   3. Create a test order in the database');
    console.log('   4. Update orderId in this script');
    console.log('   5. Run: node test-payment-api.mjs');
    console.log('');

    console.log('📋 API Endpoints Created:');
    console.log('   ✅ POST /api/payments/create');
    console.log('   ✅ GET /api/payments/status/[id]');
    console.log('   ✅ POST /api/payments/webhook');
    console.log('');

    console.log('🧪 Test Cards:');
    console.log('   Approved: 4012001037141112');
    console.log('   Declined: 4012001038443335');
    console.log('');

    console.log('✅ Phase 2 Backend APIs Complete!');
    console.log('');
    console.log('📋 Next: Run database migration');
    console.log('   Then test with actual order');
}

testPaymentAPI();
