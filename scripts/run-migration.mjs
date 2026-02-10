// Lalelilo V2 Migration — Run via Supabase REST API
// First creates exec_sql helper, then runs migration + seed
// Usage: node scripts/run-migration.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing environment variables!');
    console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.error('   You can load them from .env.local:');
    console.error('   node -r dotenv/config scripts/run-migration.mjs');
    process.exit(1);
}

const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Prefer': 'return=representation',
};

// Step 1: Create exec_sql function via direct SQL endpoint
async function createExecSql() {
    console.log('📦 Step 1: Creating exec_sql helper via SQL endpoint...');

    // Try creating via the Supabase SQL HTTP endpoint (available since Supabase v2)
    // This endpoint is at /pg/query for newer versions
    const endpoints = [
        `${SUPABASE_URL}/rest/v1/rpc/query`,
    ];

    // Actually, let's use a different approach - use supabase-js to call the DB function
    // We need the DB password, not the service role key
    // The simplest path is to guide the user to paste in the SQL editor

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  SUPABASE SQL EDITOR — Manual Migration Required            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  The Supabase REST API doesn't support raw DDL statements.   ║
║  You need to run 2 SQL files in the Supabase SQL Editor.     ║
║                                                              ║
║  🔗 Open this URL in your browser:                           ║
║                                                              ║
║  https://supabase.com/dashboard/project/                     ║
║  lecgrltttoomuodptfol/sql/new                                ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  STEP 1: Run MIGRATION                                       ║
║  📄 File: supabase/migration_v2.sql                          ║
║  > Copy the full content and paste in the SQL editor         ║
║  > Click "Run" (green button)                                ║
║  > Wait for "Success. No rows returned"                      ║
║                                                              ║
║  STEP 2: Run SEED DATA                                       ║
║  📄 File: supabase/seed_v2.sql                               ║
║  > Clear the editor, paste seed content                      ║
║  > Click "Run"                                               ║
║  > You should see NOTICE messages with IDs                   ║
║                                                              ║
║  STEP 3: Copy the Client ID from the NOTICE output          ║
║  > Update DEFAULT_CLIENT_ID in .env.local                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);

    // Copy migration to clipboard if possible
    try {
        const migrationPath = path.join(__dirname, '..', 'supabase', 'migration_v2.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        console.log(`\n📋 Migration file ready (${migrationSQL.length} chars)`);
        console.log(`   Path: ${migrationPath}`);

        const seedPath = path.join(__dirname, '..', 'supabase', 'seed_v2.sql');
        const seedSQL = fs.readFileSync(seedPath, 'utf-8');
        console.log(`📋 Seed file ready (${seedSQL.length} chars)`);
        console.log(`   Path: ${seedPath}`);
    } catch (err) {
        console.error('Error reading files:', err.message);
    }

    // Verify current table count
    console.log('\n🔍 Checking current database state...');
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/clients?select=id,name,slug&limit=5`, { headers });
        if (res.ok) {
            const clients = await res.json();
            console.log(`   ✅ Connected! Found ${clients.length} client(s):`);
            clients.forEach(c => console.log(`      - ${c.name} (${c.slug}) → ${c.id}`));
        } else {
            console.log(`   ⚠️  Could not query clients: ${res.status}`);
        }

        // Check if migration tables already exist
        const tablesRes = await fetch(`${SUPABASE_URL}/rest/v1/regions?select=id&limit=1`, { headers });
        if (tablesRes.ok) {
            console.log('   ⚠️  "regions" table already exists — migration may have already run');
        } else {
            console.log('   ✅ "regions" table not found — migration has NOT been run yet');
        }
    } catch (err) {
        console.log(`   Connection error: ${err.message}`);
    }
}

createExecSql();
