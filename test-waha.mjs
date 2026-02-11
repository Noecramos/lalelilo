// Test WAHA API
const WAHA_URL = 'https://devlikeaprowaha-production-4105.up.railway.app';
const WAHA_KEY = 'REDACTED_WAHA_API_KEY';

console.log('🧪 Testing WAHA...');

const testPhone = '5581987654321';
const chatId = `${testPhone}@c.us`;

const response = await fetch(`${WAHA_URL}/api/sendText`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': WAHA_KEY
    },
    body: JSON.stringify({
        session: 'default',
        chatId: chatId,
        text: '🤖 Test from bot!'
    })
});

const result = await response.json();
console.log('Status:', response.status);
console.log('Result:', result);
