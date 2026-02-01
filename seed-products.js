const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        // Clean up keys and values (remove quotes and \r\n)
        const cleanKey = key.trim();
        const cleanValue = value.trim()
            .replace(/^["'](.*)["']$/, '$1')
            .replace(/\\r\\n$/, '')
            .replace(/\r$/, '');
        env[cleanKey] = cleanValue;
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Using URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Starting seed...');

    // 1. Get or create a default shop
    let { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .limit(1)
        .maybeSingle();

    if (shopError || !shop) {
        console.log('No shop found or error, creating default shop...');
        const { data: newShop, error: createShopError } = await supabase
            .from('shops')
            .insert({
                name: 'Lalelilo Demo Shop',
                slug: 'lalelilo-demo',
                city: 'Recife',
                address: 'Av. Principal, 123',
                is_active: true
            })
            .select()
            .single();

        if (createShopError) {
            console.error('Error creating shop:', createShopError);
            return;
        }
        shop = newShop;
    }

    console.log('Using shop ID:', shop.id);

    // 2. Prepare 10 products
    const products = [];

    for (let i = 1; i <= 10; i++) {
        const name = `Produto Infantil Demo ${i}`;
        const slug = `produto-infantil-demo-${i}`;
        const price = Math.floor(Math.random() * (120 - 45 + 1)) + 45;

        products.push({
            client_id: shop.id,
            name: name,
            slug: slug,
            description: `Esta é uma descrição detalhada para o ${name}. Perfeito para crianças de todas as idades, combinando conforto e estilo.`,
            price: price,
            compare_at_price: price + 20,
            image_url: `/demo/Image ${i}.jpg`,
            images: [`/demo/Image ${i}.jpg`],
            is_active: true,
            created_at: new Date().toISOString()
        });
    }

    // 3. Clear existing demo products to avoid slug conflicts
    await supabase
        .from('products')
        .delete()
        .eq('client_id', shop.id)
        .ilike('slug', 'produto-infantil-demo-%');

    // 4. Insert products
    const { data: insertedProducts, error: insertError } = await supabase
        .from('products')
        .insert(products)
        .select();

    if (insertError) {
        console.error('Error inserting products:', insertError);
    } else {
        console.log(`Successfully inserted ${insertedProducts.length} products!`);
    }
}

seed();
