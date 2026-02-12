// Test Getnet Payment Gateway Connection
// Usage: node test-getnet-simple.mjs

async function testGetnetAuth() {
    console.log('🧪 Testing Getnet Payment Gateway Authentication...\n');

    const clientId = process.env.GETNET_CLIENT_ID || 'REDACTED_GETNET_CLIENT_ID';
    const clientSecret = process.env.GETNET_CLIENT_SECRET || 'REDACTED_GETNET_SECRET';
    const apiUrl = process.env.GETNET_API_URL || 'https://api-sbx.globalgetnet.com';

    console.log('📋 Configuration:');
    console.log('   Client ID:', clientId);
    console.log('   API URL:', apiUrl);
    console.log('   Environment: sandbox\n');

    // Test 1: OAuth Authentication
    console.log('📝 Test 1: OAuth2 Authentication');

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        const response = await fetch(
            `${apiUrl}/authentication/oauth2/access_token`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'grant_type=client_credentials',
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Authentication failed:', error);
            process.exit(1);
        }

        const data = await response.json();

        console.log('✅ Authentication successful!');
        console.log('   Access Token:', data.access_token.substring(0, 20) + '...');
        console.log('   Token Type:', data.token_type);
        console.log('   Expires In:', data.expires_in, 'seconds');
        console.log('\n🎉 Getnet credentials are valid and working!');
        console.log('\n✅ Phase 1 Complete:');
        console.log('   - Credentials configured ✅');
        console.log('   - Authentication working ✅');
        console.log('   - API connection successful ✅');
        console.log('\n📋 Next: Run database migration and create payment APIs');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testGetnetAuth();
