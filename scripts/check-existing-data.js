/**
 * Check Existing Data in Database
 * Shows what data is already present
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

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function checkData() {
    console.log('🔍 Checking Existing Data in Lalelilo Database\n');
    console.log('═'.repeat(70));

    // Check Clients
    const { data: clients } = await supabase.from('clients').select('*');
    console.log('\n📦 CLIENTS (' + (clients?.length || 0) + '):');
    clients?.forEach(c => {
        console.log(`  ✓ ${c.name} (${c.slug}) - ID: ${c.id}`);
    });

    // Check Regions
    const { data: regions } = await supabase.from('regions').select('*');
    console.log('\n🗺️  REGIONS (' + (regions?.length || 0) + '):');
    regions?.forEach(r => {
        console.log(`  ✓ ${r.name} - ${r.description || 'No description'}`);
    });

    // Check Shops
    const { data: shops } = await supabase.from('shops').select('*');
    console.log('\n🏪 SHOPS (' + (shops?.length || 0) + '):');
    shops?.forEach(s => {
        console.log(`  ✓ ${s.name} (${s.slug})`);
        console.log(`    📍 ${s.city}, ${s.state} | ${s.whatsapp || 'No WhatsApp'}`);
    });

    // Check Products
    const { data: products } = await supabase.from('products').select('*');
    console.log('\n👕 PRODUCTS (' + (products?.length || 0) + '):');
    products?.forEach(p => {
        const sizes = Array.isArray(p.sizes) ? p.sizes.join(', ') : 'No sizes';
        console.log(`  ✓ ${p.name} - R$ ${p.price}`);
        console.log(`    Type: ${p.product_type || 'N/A'} | Tier: ${p.product_tier || 'N/A'} | Gender: ${p.gender || 'N/A'}`);
        console.log(`    Sizes: ${sizes}`);
    });

    // Check Users
    const { data: users } = await supabase.from('users').select('*');
    console.log('\n👥 USERS (' + (users?.length || 0) + '):');
    users?.forEach(u => {
        console.log(`  ✓ ${u.name || u.email} (${u.role})`);
        console.log(`    Email: ${u.email} | Shop: ${u.shop_id ? 'Assigned' : 'No shop'}`);
    });

    // Check Badges
    const { data: badges } = await supabase.from('badges').select('*');
    console.log('\n🏆 BADGES (' + (badges?.length || 0) + '):');
    badges?.forEach(b => {
        console.log(`  ${b.icon_url || '🎖️'} ${b.name} - ${b.description}`);
        console.log(`    XP Threshold: ${b.xp_threshold || 'N/A'} | Category: ${b.category || 'N/A'}`);
    });

    // Check Promo Codes
    const { data: promos } = await supabase.from('promo_codes').select('*');
    console.log('\n🎟️  PROMO CODES (' + (promos?.length || 0) + '):');
    promos?.forEach(p => {
        console.log(`  ✓ ${p.code} - ${p.description}`);
        console.log(`    Type: ${p.discount_type} | Value: ${p.discount_value} | Active: ${p.is_active}`);
    });

    // Check Checklist Templates
    const { data: templates } = await supabase.from('checklist_templates').select('*, checklist_template_items(count)');
    console.log('\n📋 CHECKLIST TEMPLATES (' + (templates?.length || 0) + '):');
    templates?.forEach(t => {
        const itemCount = t.checklist_template_items?.[0]?.count || 0;
        console.log(`  ✓ ${t.name} - ${t.category}`);
        console.log(`    Items: ${itemCount} | Active: ${t.is_active}`);
    });

    // Check Contacts
    const { data: contacts } = await supabase.from('contacts').select('*');
    console.log('\n👤 CRM CONTACTS (' + (contacts?.length || 0) + '):');
    contacts?.forEach(c => {
        console.log(`  ✓ ${c.name} - ${c.phone || 'No phone'}`);
        console.log(`    Email: ${c.email || 'N/A'} | Instagram: ${c.instagram_id || 'N/A'}`);
    });

    // Check Inventory
    const { data: inventory } = await supabase.from('inventory').select('*, products(name), shops(name)');
    console.log('\n📦 INVENTORY RECORDS (' + (inventory?.length || 0) + '):');
    if (inventory && inventory.length > 0) {
        inventory.slice(0, 5).forEach(i => {
            console.log(`  ✓ ${i.products?.name || 'Unknown'} @ ${i.shops?.name || 'Unknown'}`);
            console.log(`    Qty: ${i.quantity} | Size: ${i.size || 'default'}`);
        });
        if (inventory.length > 5) {
            console.log(`  ... and ${inventory.length - 5} more records`);
        }
    }

    // Check XP Ledger
    const { data: xp } = await supabase.from('xp_ledger').select('*');
    console.log('\n⭐ XP LEDGER ENTRIES (' + (xp?.length || 0) + '):');
    if (xp && xp.length > 0) {
        const totalXP = xp.reduce((sum, entry) => sum + entry.amount, 0);
        console.log(`  Total XP Awarded: ${totalXP}`);
        xp.slice(0, 3).forEach(x => {
            console.log(`  ✓ ${x.amount} XP - ${x.reason}`);
        });
    }

    // Check Distribution Centers
    const { data: dcs } = await supabase.from('distribution_centers').select('*');
    console.log('\n🏭 DISTRIBUTION CENTERS (' + (dcs?.length || 0) + '):');
    dcs?.forEach(dc => {
        console.log(`  ✓ ${dc.name} - ${dc.city}, ${dc.state}`);
    });

    // Check Messages/Conversations
    const { data: conversations } = await supabase.from('conversations').select('*');
    const { data: messages } = await supabase.from('messages').select('*');
    console.log('\n💬 MESSAGING:');
    console.log(`  Conversations: ${conversations?.length || 0}`);
    console.log(`  Messages: ${messages?.length || 0}`);

    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('\n📊 SUMMARY:');
    console.log(`  Clients: ${clients?.length || 0}`);
    console.log(`  Regions: ${regions?.length || 0}`);
    console.log(`  Shops: ${shops?.length || 0}`);
    console.log(`  Products: ${products?.length || 0}`);
    console.log(`  Users: ${users?.length || 0}`);
    console.log(`  Badges: ${badges?.length || 0}`);
    console.log(`  Promo Codes: ${promos?.length || 0}`);
    console.log(`  Checklist Templates: ${templates?.length || 0}`);
    console.log(`  CRM Contacts: ${contacts?.length || 0}`);
    console.log(`  Inventory Records: ${inventory?.length || 0}`);
    console.log(`  XP Entries: ${xp?.length || 0}`);
    console.log(`  Distribution Centers: ${dcs?.length || 0}`);

    const hasData = (shops?.length || 0) > 0 || (products?.length || 0) > 0;

    if (hasData) {
        console.log('\n✅ Database has existing data!');
        console.log('💡 You can proceed with testing features.');
    } else {
        console.log('\n⚠️  Database is mostly empty.');
        console.log('💡 Consider running seed_v2.sql to populate demo data.');
    }

    console.log('\n✨ Data check complete!\n');
}

checkData().catch(console.error);
