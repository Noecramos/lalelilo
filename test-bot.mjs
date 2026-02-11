// Test bot flow locally
import { config } from 'dotenv';
config({ path: '.env.local' });

const WAHA_URL = process.env.WAHA_API_URL;
const WAHA_KEY = process.env.WAHA_API_KEY;

console.log('🧪 Testing WAHA connection...');
console.log('WAHA_URL:', WAHA_URL);
console.log('WAHA_KEY:', WAHA_KEY ? '✅ Set' : '❌ Missing');

// Test 1: Send text message
const testPhone = '5581987654321';
const chatId = `${testPhone}@c.us`;

try {
    console.log('\n📤 Sending test message...');

    const response = await fetch(`${WAHA_URL}/api/sendText`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': WAHA_KEY
        },
        body: JSON.stringify({
            session: 'default',
            chatId: chatId,
            text: '🤖 Test message from Lalelilo bot!'
        })
    });

    const result = await response.json();

    if (response.ok) {
        console.log('✅ Message sent successfully!');
        console.log('Response:', result);
    } else {
        console.log('❌ Failed to send message');
        console.log('Status:', response.status);
        console.log('Error:', result);
    }
} catch (error) {
    console.error('❌ Error:', error.message);
}
