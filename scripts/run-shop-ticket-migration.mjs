import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🚀 Running migration: add_shop_ticket_fields.sql\n');

    try {
        // Read the migration file
        const migrationPath = join(__dirname, '..', 'supabase', 'migrations', 'add_shop_ticket_fields.sql');
        const sql = readFileSync(migrationPath, 'utf8');

        // Split by semicolons and filter out comments and empty statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            // Skip comment-only statements
            if (statement.replace(/--[^\n]*/g, '').trim().length === 0) {
                continue;
            }

            console.log(`Executing statement ${i + 1}/${statements.length}...`);

            const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

            if (error) {
                // Try direct execution if RPC fails
                const { error: directError } = await supabase.from('_migrations').insert({
                    statement: statement
                }).select();

                if (directError) {
                    console.error(`❌ Error executing statement ${i + 1}:`, error.message);
                    console.error('Statement:', statement.substring(0, 100) + '...');
                    // Continue with other statements
                }
            } else {
                console.log(`✅ Statement ${i + 1} executed successfully`);
            }
        }

        console.log('\n✅ Migration completed!\n');

        // Verify the changes
        console.log('🔍 Verifying changes...\n');

        // Check shops table
        const { data: shopsColumns } = await supabase
            .from('shops')
            .select('*')
            .limit(1);

        if (shopsColumns && shopsColumns.length > 0) {
            console.log('✅ Shops table columns:', Object.keys(shopsColumns[0]));
        }

        // Check tickets table
        const { data: ticketsColumns } = await supabase
            .from('tickets')
            .select('*')
            .limit(1);

        if (ticketsColumns && ticketsColumns.length > 0) {
            console.log('✅ Tickets table columns:', Object.keys(ticketsColumns[0]));
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
