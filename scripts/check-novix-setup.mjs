import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local file
const envPath = join(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf8');

// Parse environment variables
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
        env[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function checkNovixSetup() {
    console.log('\n🔍 Checking Novix setup...\n');

    try {
        // Check if table exists
        const { data, error } = await supabaseAdmin
            .from('novix_managers')
            .select('*')
            .eq('username', 'novix-admin')
            .single();

        if (error) {
            console.error('❌ Error:', error.message);
            console.log('\n⚠️  The novix_managers table does NOT exist yet!');
            console.log('\n📋 TO FIX: Run the SQL script in Supabase:\n');
            console.log('   1. Go to: https://supabase.com/dashboard/project/lecgrltttoomuodptfol/sql/new');
            console.log('   2. Copy ALL contents of: supabase/novix_complete_setup.sql');
            console.log('   3. Paste into SQL Editor');
            console.log('   4. Click "Run" button\n');
            return;
        }

        if (!data) {
            console.log('❌ No novix-admin user found');
            console.log('📋 Please run the SQL script in Supabase\n');
            return;
        }

        console.log('✅ Novix manager found!');
        console.log('\n📊 User details:');
        console.log('  Username:', data.username);
        console.log('  Email:', data.email);
        console.log('  Active:', data.is_active);
        console.log('  Password:', data.password_hash ? '✅ Set' : '❌ Not set');
        console.log('  Created:', data.created_at);

        if (!data.password_hash || data.password_hash === '') {
            console.log('\n⚠️  PASSWORD NOT SET!');
            console.log('\n📋 Run this SQL in Supabase:\n');
            console.log(`UPDATE novix_managers`);
            console.log(`SET password_hash = '$2b$10$RbWoIiuOzM5lSAUROeV9WuoEQ9uOsRcO92Fp5QONsQ.jyMSMzJcnq'`);
            console.log(`WHERE username = 'novix-admin';\n`);
        } else {
            console.log('\n✅ ============================================');
            console.log('✅ EVERYTHING IS SET UP CORRECTLY!');
            console.log('✅ ============================================');
            console.log('\n🔐 Login credentials:');
            console.log('   Username: novix-admin');
            console.log('   Password: Novix@2026!Secure');
            console.log('\n🌐 Access: http://localhost:3000/novix-login');
            console.log('\n✅ ============================================\n');
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
    }
}

checkNovixSetup();
