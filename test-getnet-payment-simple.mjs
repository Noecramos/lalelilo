// SIMPLE Getnet Payment Test
// Using the EXACT sandbox credentials and simplest possible payload

const API_URL = 'https://api-sbx.globalgetnet.com';
const CLIENT_ID = 'REDACTED_GETNET_CLIENT_ID';
const CLIENT_SECRET = 'REDACTED_GETNET_SECRET';
const SELLER_ID = 'REDACTED_GETNET_SELLER_ID';

console.log('🧪 SIMPLE Getnet Payment Test\n');

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

    // Step 2: Try payment with MINIMAL payload
    console.log('Step 2: Attempting payment...');

    const payload = {
        seller_id: SELLER_ID,
        amount: 1000, // R$ 10.00
        currency: 'BRL',
        order: {
            order_id: 'test-' + Date.now(),
        },
        customer: {
            customer_id: 'customer-test',
            first_name: 'TESTE',
            last_name: 'APROVADO',
            name: 'TESTE APROVADO',
            email: 'teste@example.com',
            document_type: 'CPF',
            document_number: '12345678909',
        },
        device: {
            ip_address: '127.0.0.1',
        },
        credit: {
            delayed: false,
            pre_authorization: false,
            save_card_data: false,
            transaction_type: 'FULL',
            number_installments: 1,
            card: {
                number_token: '4012001037141112',
                cardholder_name: 'TESTE APROVADO',
                security_code: '123',
                expiration_month: '12',
                expiration_year: '2028',
            },
        },
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('');

    const paymentResponse = await fetch(`${API_URL}/v1/payments/credit`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const paymentData = await paymentResponse.text();

    console.log('Response Status:', paymentResponse.status);
    console.log('Response:', paymentData);

    if (paymentResponse.ok) {
        console.log('\n✅ PAYMENT SUCCESSFUL!');
    } else {
        console.log('\n❌ PAYMENT FAILED');
        try {
            const error = JSON.parse(paymentData);
            console.log('\nError details:', JSON.stringify(error, null, 2));
        } catch (e) {
            // Already logged
        }
    }
}

test().catch(console.error);
