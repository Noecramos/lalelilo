/**
 * Seed Database with Demo Data
 * Runs seed_v2.sql to populate demo shops, products, users, badges
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '').replace(/\\r\\n/g, '');
        envVars[key] = value;
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runSeed() {
    console.log('🌱 Seeding Lalelilo Database with Demo Data...\n');
    console.log('📡 Connected to:', supabaseUrl);
    console.log('');

    // Read the seed SQL file
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed_v2.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf-8');

    console.log('📄 Loaded seed_v2.sql');
    console.log('📊 This will create:');
    console.log('   - 2 Regions (São Paulo, Rio de Janeiro)');
    console.log('   - 1 Distribution Center');
    console.log('   - 3 Demo Shops (Ibirapuera, Morumbi, Barra)');
    console.log('   - 6 Clothing Products with sizes');
    console.log('   - 5 Demo Users (admin, managers, sales, auditor)');
    console.log('   - 7 Badges for gamification');
    console.log('   - 3 Promo Codes');
    console.log('   - 1 Checklist Template with 9 items');
    console.log('   - 2 CRM Contacts with birthday events');
    console.log('   - Demo inventory and XP data');
    console.log('');

    try {
        console.log('⏳ Executing seed script...\n');

        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: seedSQL });

        if (error) {
            // If rpc doesn't exist, try direct execution
            console.log('⚠️  RPC method not available, trying alternative approach...\n');

            // We'll need to execute this manually in Supabase SQL Editor
            console.log('📋 Please run the following SQL in your Supabase SQL Editor:');
            console.log('   1. Go to: https://supabase.com/dashboard/project/lecgrltttoomuodptfol/sql');
            console.log('   2. Open: supabase/seed_v2.sql');
            console.log('   3. Copy and paste the entire file');
            console.log('   4. Click "Run"');
            console.log('');
            console.log('💡 Alternatively, I can verify if data already exists...\n');

            // Check if data already exists
            await checkExistingData();
        } else {
            console.log('✅ Seed data executed successfully!');
            await verifySeededData();
        }

    } catch (err) {
        console.error('❌ Error executing seed:', err.message);
        console.log('\n📋 Manual seeding required:');
        console.log('   Run supabase/seed_v2.sql in Supabase SQL Editor');
    }
}

async function checkExistingData() {
    console.log('🔍 Checking for existing demo data...\n');

    const checks = [
        { table: 'regions', name: 'Regions' },
        { table: 'shops', name: 'Shops' },
        { table: 'products', name: 'Products' },
        { table: 'users', name: 'Users' },
        { table: 'badges', name: 'Badges' },
        { table: 'promo_codes', name: 'Promo Codes' },
        { table: 'checklist_templates', name: 'Checklist Templates' },
        { table: 'contacts', name: 'CRM Contacts' }
    ];

    for (const check of checks) {
        const { data, error } = await supabase
            .from(check.table)
            .select('id', { count: 'exact', head: true });

        if (error) {
            console.log(`  ❌ ${check.name}: Error - ${error.message}`);
        } else {
            const count = data?.length || 0;
            if (count > 0) {
                console.log(`  ✅ ${check.name}: ${count} records found`);
            } else {
                console.log(`  ⚠️  ${check.name}: No data (needs seeding)`);
            }
        }
    }

    console.log('\n💡 If you see missing data, run seed_v2.sql in Supabase SQL Editor');
}

async function verifySeededData() {
    console.log('\n✅ Verifying seeded data...\n');

    // Check shops
    const { data: shops } = await supabase.from('shops').select('name');
    console.log(`📍 Shops created: ${shops?.length || 0}`);
    shops?.forEach(s => console.log(`   - ${s.name}`));

    // Check products
    const { data: products } = await supabase.from('products').select('name, price');
    console.log(`\n👕 Products created: ${products?.length || 0}`);
    products?.slice(0, 3).forEach(p => console.log(`   - ${p.name} (R$ ${p.price})`));
    if (products?.length > 3) console.log(`   ... and ${products.length - 3} more`);

    // Check users
    const { data: users } = await supabase.from('users').select('name, role');
    console.log(`\n👥 Users created: ${users?.length || 0}`);
    users?.forEach(u => console.log(`   - ${u.name} (${u.role})`));

    // Check badges
    const { data: badges } = await supabase.from('badges').select('name');
    console.log(`\n🏆 Badges created: ${badges?.length || 0}`);
    badges?.forEach(b => console.log(`   - ${b.name}`));

    console.log('\n🎉 Demo data seeding complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test super-admin features at /super-admin');
    console.log('   2. Verify checklists, CRM, gamification pages');
    console.log('   3. Configure WAHA webhooks for messaging');
}

runSeed().catch(console.error);
