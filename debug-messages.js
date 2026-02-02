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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectMessages() {
    console.log('--- Messages Inspection ---');
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching messages:', error);
    } else {
        console.log('Last 10 messages:', JSON.stringify(messages, null, 2));
    }

    const { data: shops } = await supabase.from('shops').select('id, name, slug');
    console.log('Available Shops (IDs and Slugs):', shops);
}

inspectMessages();
