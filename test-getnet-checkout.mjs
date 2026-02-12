// Test Getnet Web Checkout - Payment Intent
// Usage: GETNET_CLIENT_ID=xxx GETNET_CLIENT_SECRET=xxx GETNET_SELLER_ID=xxx node test-getnet-checkout.mjs

const API_URL = process.env.GETNET_API_URL || 'https://api-sbx.globalgetnet.com';
const CLIENT_ID = process.env.GETNET_CLIENT_ID;
const CLIENT_SECRET = process.env.GETNET_CLIENT_SECRET;
const SELLER_ID = process.env.GETNET_SELLER_ID;

if (!CLIENT_ID || !CLIENT_SECRET || !SELLER_ID) {
    console.error('❌ Missing credentials!');
    console.error('   Set GETNET_CLIENT_ID, GETNET_CLIENT_SECRET, and GETNET_SELLER_ID environment variables.');
    process.exit(1);
}

console.log('🧪 Testing Getnet Web Checkout\n');

async function test() {
    // Step 1: Get token
    console.log('Step 1: Getting access token...');
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const authResponse = await fetch(`${API_URL}/authentication/oauth2/access_token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
        console.error('❌ Auth failed:', await authResponse.text());
        return;
    }

    const authData = await authResponse.json();
    const token = authData.access_token;
    console.log('✅ Got token!\n');

    // Step 2: Create payment intent (checkout session)
    console.log('Step 2: Creating payment intent...');

    const payload = {
        amount: 5000, // R$ 50.00 in cents
        currency: 'BRL',
        order_id: 'order-' + Date.now(),
        customer: {
            customer_id: 'customer-test',
            email: 'joao.teste@example.com',
            name: 'João Silva Teste',
        },
        success_url: 'http://localhost:3000/checkout/success',
        cancel_url: 'http://localhost:3000/checkout/payment',
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('');

    // Try different possible endpoints
    const endpoints = [
        '/v1/payment-intents',
        '/v1/checkout/payment-intents',
        '/checkout/v1/payment-intents',
        '/v1/payments/intents',
    ];

    for (const endpoint of endpoints) {
        console.log(`Trying: ${endpoint}`);

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'seller_id': SELLER_ID,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.text();

        console.log(`  Status: ${response.status}`);

        if (response.ok) {
            console.log('  ✅ SUCCESS!');
            console.log('  Response:', data);

            try {
                const json = JSON.parse(data);
                if (json.checkout_url || json.url || json.payment_url) {
                    console.log('\n🎉 CHECKOUT URL:', json.checkout_url || json.url || json.payment_url);
                }
            } catch (e) { }

            return;
        } else {
            console.log(`  ❌ Failed: ${data.substring(0, 100)}`);
        }
        console.log('');
    }
}

test().catch(console.error);
