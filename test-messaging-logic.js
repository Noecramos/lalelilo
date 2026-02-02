const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function getEnv() {
    const content = fs.readFileSync('.env.local', 'utf8');
    const lines = content.split('\n');
    const env = {};
    for (let line of lines) {
        if (line.startsWith('#') || !line.includes('=')) continue;
        const firstEquals = line.indexOf('=');
        let key = line.substring(0, firstEquals).trim();
        let value = line.substring(firstEquals + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
        value = value.replace(/\\r\\n/g, '').replace(/\\n/g, '').trim();
        env[key] = value;
    }
    return env;
}

const env = getEnv();
const API_URL = 'http://localhost:3000'; // Or just use the URL from env if we had the direct vercel one

// Since I can't easily hit the local dev server if it's not running, I'll use the supabase directly to simulate the API logic.
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testApiLogic() {
    console.log('Testing API Logic directly against DB...');

    const shopSlug = 'lalelilo-demo';
    const { data: allShops } = await supabase.from('shops').select('id, slug');
    console.log('Available Shops in DB:', allShops);

    const { data: shop } = await supabase.from('shops').select('id').eq('slug', shopSlug).single();

    if (!shop) {
        console.error('Shop not found');
        return;
    }

    const shopId = shop.id;
    console.log('Resolved Shop UUID:', shopId);

    // 1. Insert a message from shop (using slug)
    console.log('1. Inserting message from shop...');
    const { data: msg1, error: err1 } = await supabase.from('messages').insert({
        sender_type: 'shop',
        sender_id: shopId, // The API resolves this from slug
        recipient_id: 'super-admin',
        content: 'Test message from shop at ' + new Date().toISOString()
    }).select().single();

    if (err1) console.error('Insert Error 1:', err1);
    else console.log('Inserted Message 1 ID:', msg1.id);

    // 2. Fetch for shop
    console.log('2. Fetching for shop admin...');
    const { data: fetch1, error: err2 } = await supabase
        .from('messages')
        .select('*')
        .or(`recipient_id.eq.${shopId},sender_id.eq.${shopId},recipient_id.eq.all`);

    if (err2) console.error('Fetch Error 1:', err2);
    else console.log('Fetched messages for shop count:', fetch1.length);

    // 3. Fetch for super admin (all)
    console.log('3. Fetching for super admin list...');
    const { data: fetch2, error: err3 } = await supabase
        .from('messages')
        .select('*')
        .limit(10);

    if (err3) console.error('Fetch Error 2:', err3);
    else console.log('Fetched messages for admin count:', fetch2.length);
}

testApiLogic();
