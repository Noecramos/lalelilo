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

async function run() {
    console.log('--- DB Inspection ---');
    const { data: shops } = await supabase.from('shops').select('id, name');
    console.log('Shops:', shops);

    const { data: products, error: pError } = await supabase.from('products').select('*, categories(name)');
    if (pError) {
        console.error('Products Error:', pError);
        // Try without join
        const { data: pSimple } = await supabase.from('products').select('*');
        console.log('Products (simple):', pSimple ? pSimple.length : 0);
    } else {
        console.log('Products found with join:', products.length);
    }

    const { data: cats, error: cError } = await supabase.from('categories').select('id');
    console.log('Categories Error:', cError ? cError.message : 'Fine');
    console.log('Categories count:', cats ? cats.length : 0);
}

run();
