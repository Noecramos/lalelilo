// Test Getnet Sandbox Endpoints
// This will help us find the correct payment endpoint

const API_URL = 'https://api-sbx.globalgetnet.com';
const CLIENT_ID = 'REDACTED_GETNET_CLIENT_ID';
const CLIENT_SECRET = 'REDACTED_GETNET_SECRET';
const SELLER_ID = 'REDACTED_GETNET_SELLER_ID';

console.log('🧪 Testing Getnet Sandbox Endpoints\n');
console.log('API URL:', API_URL);
console.log('Seller ID:', SELLER_ID);
console.log('');

async function getToken() {
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const response = await fetch(`${API_URL}/auth/oauth/v2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'scope=oob&grant_type=client_credentials',
    });

    if (!response.ok) {
        throw new Error(`Auth failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Authentication successful!');
    console.log('   Token type:', data.token_type);
    console.log('   Expires in:', data.expires_in, 'seconds\n');

    return data.access_token;
}

async function testEndpoint(token, endpoint, method = 'GET', body = null) {
    console.log(`Testing ${method} ${endpoint}...`);

    try {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'seller_id': SELLER_ID,
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${endpoint}`, options);
        const text = await response.text();

        console.log(`   Status: ${response.status}`);

        if (response.ok) {
            console.log('   ✅ Endpoint exists!');
            try {
                const data = JSON.parse(text);
                console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 200));
            } catch (e) {
                console.log('   Response:', text.substring(0, 200));
            }
        } else {
            console.log(`   ❌ Error: ${text.substring(0, 200)}`);
        }
    } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
    }
    console.log('');
}

async function main() {
    try {
        const token = await getToken();

        // Test different possible endpoints
        const endpoints = [
            '/v1/payments/credit',
            '/v1/payments',
            '/v1/transactions',
            '/payments/credit',
            '/payments',
            '/dpm/payments-gwproxy/v2/payments',
        ];

        console.log('📍 Testing Payment Endpoints:\n');

        for (const endpoint of endpoints) {
            await testEndpoint(token, endpoint, 'GET');
        }

        // Try a minimal payment payload on the most likely endpoint
        console.log('💳 Attempting minimal payment on /v1/payments/credit:\n');

        const minimalPayload = {
            seller_id: SELLER_ID,
            amount: 1000,
            currency: 'BRL',
            order: {
                order_id: 'test-' + Date.now(),
            },
        };

        await testEndpoint(token, '/v1/payments/credit', 'POST', minimalPayload);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

main();
