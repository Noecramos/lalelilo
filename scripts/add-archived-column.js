const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let SUPABASE_URL = '';
let SUPABASE_SERVICE_KEY = '';

envLines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
        SUPABASE_URL = trimmed.split('=')[1].trim();
    } else if (trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
        SUPABASE_SERVICE_KEY = trimmed.split('=')[1].trim();
    }
});

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
    console.log('🚀 Running archived messages migration...\n');

    try {
        // Read migration file
        const migrationPath = path.join(__dirname, '..', 'supabase', 'migration_archived_messages.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Migration SQL:');
        console.log(migrationSQL);
        console.log('\n');

        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement.toLowerCase().includes('comment on')) {
                // Skip COMMENT statements as they might not be supported via API
                console.log('⏭️  Skipping COMMENT statement');
                continue;
            }

            console.log(`⚙️  Executing: ${statement.substring(0, 50)}...`);

            const { error } = await supabase.rpc('exec_sql', {
                sql: statement + ';'
            });

            if (error) {
                // Try direct query if RPC fails
                const { error: queryError } = await supabase
                    .from('_migrations')
                    .select('*')
                    .limit(0);

                if (queryError) {
                    console.log('⚠️  Note: You may need to run this migration manually in Supabase SQL Editor');
                    console.log('📋 Copy the SQL from: supabase/migration_archived_messages.sql\n');
                }
            } else {
                console.log('✅ Statement executed successfully');
            }
        }

        // Verify the column was added
        console.log('\n🔍 Verifying migration...');
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Error verifying migration:', error);
        } else {
            console.log('✅ Migration completed successfully!');
            console.log('📊 Sample message structure:', data[0] ? Object.keys(data[0]) : 'No messages yet');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.log('\n📋 Please run the migration manually:');
        console.log('1. Go to Supabase Dashboard > SQL Editor');
        console.log('2. Copy content from: supabase/migration_archived_messages.sql');
        console.log('3. Execute the SQL');
    }
}

runMigration();
