/**
 * Database Schema Checker
 * Checks what tables and columns exist in the current Supabase database
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
    console.error('URL:', supabaseUrl ? 'Found' : 'Missing');
    console.error('Key:', supabaseKey ? 'Found' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkSchema() {
    console.log('🔍 Checking Supabase Database Schema...\n');
    console.log('📡 Connected to:', supabaseUrl);
    console.log('');

    // List of tables we expect from schema.sql
    const expectedBaseTables = [
        'clients',
        'shops',
        'categories',
        'products',
        'inventory',
        'orders',
        'users',
        'analytics_daily'
    ];

    // List of tables from migration_v2.sql
    const expectedV2Tables = [
        'regions',
        'activity_log',
        'system_settings',
        'attachments',
        'notifications',
        'contacts',
        'channels',
        'conversations',
        'messages',
        'distribution_centers',
        'dc_inventory',
        'replenishment_requests',
        'replenishment_items',
        'replenishment_status_log',
        'xp_ledger',
        'badges',
        'user_badges',
        'kudos',
        'manager_feedback',
        'carts',
        'cart_items',
        'promo_codes',
        'promo_usage',
        'order_status_log',
        'checklist_templates',
        'checklist_template_items',
        'checklist_submissions',
        'checklist_responses',
        'tickets',
        'ticket_comments',
        'crm_events'
    ];

    const allExpectedTables = [...expectedBaseTables, ...expectedV2Tables];

    console.log('📋 Checking for tables...\n');

    const results = {
        existing: [],
        missing: [],
        errors: []
    };

    // Check each table
    for (const tableName of allExpectedTables) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

            if (error) {
                if (error.message.includes('does not exist') || error.code === '42P01') {
                    results.missing.push(tableName);
                } else {
                    results.errors.push({ table: tableName, error: error.message });
                }
            } else {
                results.existing.push(tableName);
            }
        } catch (err) {
            results.errors.push({ table: tableName, error: err.message });
        }
    }

    // Display results
    console.log('✅ EXISTING TABLES (' + results.existing.length + '):');
    console.log('─'.repeat(60));

    // Separate base tables from v2 tables
    const existingBase = results.existing.filter(t => expectedBaseTables.includes(t));
    const existingV2 = results.existing.filter(t => expectedV2Tables.includes(t));

    if (existingBase.length > 0) {
        console.log('\n📦 Base Schema Tables:');
        existingBase.forEach(t => console.log(`  ✓ ${t}`));
    }

    if (existingV2.length > 0) {
        console.log('\n🚀 V2 Migration Tables:');
        existingV2.forEach(t => console.log(`  ✓ ${t}`));
    }

    if (results.missing.length > 0) {
        console.log('\n\n❌ MISSING TABLES (' + results.missing.length + '):');
        console.log('─'.repeat(60));

        const missingBase = results.missing.filter(t => expectedBaseTables.includes(t));
        const missingV2 = results.missing.filter(t => expectedV2Tables.includes(t));

        if (missingBase.length > 0) {
            console.log('\n📦 Missing Base Schema Tables:');
            missingBase.forEach(t => console.log(`  ✗ ${t}`));
        }

        if (missingV2.length > 0) {
            console.log('\n🚀 Missing V2 Migration Tables:');
            missingV2.forEach(t => console.log(`  ✗ ${t}`));
        }
    }

    if (results.errors.length > 0) {
        console.log('\n\n⚠️  ERRORS (' + results.errors.length + '):');
        console.log('─'.repeat(60));
        results.errors.forEach(({ table, error }) => {
            console.log(`  ${table}: ${error}`);
        });
    }

    // Summary
    console.log('\n\n📊 SUMMARY:');
    console.log('─'.repeat(60));
    console.log(`Total Expected Tables: ${allExpectedTables.length}`);
    console.log(`Existing: ${results.existing.length}`);
    console.log(`Missing: ${results.missing.length}`);
    console.log(`Errors: ${results.errors.length}`);

    // Check specific important columns
    console.log('\n\n🔍 Checking Important Columns...\n');

    if (results.existing.includes('users')) {
        const { data: userSample } = await supabase.from('users').select('*').limit(1);
        if (userSample && userSample[0]) {
            const userColumns = Object.keys(userSample[0]);
            console.log('📋 Users table columns:', userColumns.join(', '));

            const requiredUserCols = ['id', 'email', 'role', 'client_id', 'shop_id', 'name'];
            const missingUserCols = requiredUserCols.filter(col => !userColumns.includes(col));
            if (missingUserCols.length > 0) {
                console.log('  ⚠️  Missing columns:', missingUserCols.join(', '));
            } else {
                console.log('  ✓ All required columns present');
            }
        }
    }

    if (results.existing.includes('products')) {
        const { data: productSample } = await supabase.from('products').select('*').limit(1);
        if (productSample && productSample[0]) {
            const productColumns = Object.keys(productSample[0]);
            console.log('\n📋 Products table columns:', productColumns.join(', '));

            const requiredProductCols = ['id', 'client_id', 'name', 'price', 'sizes', 'product_type', 'product_tier', 'gender'];
            const missingProductCols = requiredProductCols.filter(col => !productColumns.includes(col));
            if (missingProductCols.length > 0) {
                console.log('  ⚠️  Missing V2 columns:', missingProductCols.join(', '));
            } else {
                console.log('  ✓ All V2 columns present');
            }
        }
    }

    // Recommendations
    console.log('\n\n💡 RECOMMENDATIONS:');
    console.log('─'.repeat(60));

    if (results.missing.length === 0) {
        console.log('✅ All tables exist! Database is fully migrated.');
    } else {
        const needsPreMigration = results.missing.some(t => expectedBaseTables.includes(t));
        const needsV2Migration = results.missing.some(t => expectedV2Tables.includes(t));

        if (needsPreMigration) {
            console.log('1. Run pre_migration.sql first to create base tables');
        }
        if (needsV2Migration) {
            console.log('2. Run migration_v2.sql to add V2 features');
        }
        if (!needsPreMigration && !needsV2Migration) {
            console.log('3. Run seed_v2.sql to populate demo data');
        }
    }

    console.log('\n✨ Schema check complete!\n');
}

checkSchema().catch(console.error);
