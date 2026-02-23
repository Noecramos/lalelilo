/**
 * Microvix → Supabase Sync
 * Reads scraped JSON and upserts into Lalelilo DB.
 * Usage: node scripts/microvix-sync.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'microvix');

// Load .env.local
function loadEnv() {
    const content = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        if (line.startsWith('#') || !line.includes('=')) return;
        const i = line.indexOf('=');
        let k = line.substring(0, i).trim();
        let v = line.substring(i + 1).trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        env[k] = v;
    });
    return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function log(msg) { console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`); }

function parsePrice(s) {
    if (!s) return 0;
    return parseFloat(s.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0;
}

function parseStock(s) {
    if (!s) return 0;
    return parseInt(s.replace(/[^\d-]/g, ''), 10) || 0;
}

function slugify(text) {
    return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 80);
}

function normalizePhone(phone) {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
}

// ─── Sync Products ──────────────────────────────────────────────────────────────

async function syncProducts() {
    const filePath = path.join(DATA_DIR, 'products_latest.json');
    if (!fs.existsSync(filePath)) { log('❌ No products_latest.json'); return; }

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    log(`📦 Syncing ${raw.length} products...`);

    // Get a client_id from existing shops
    const { data: shops } = await supabase.from('shops').select('client_id').limit(1).single();
    const clientId = shops?.client_id;
    if (!clientId) {
        log('  ⚠️ No client_id found. Fetching from products...');
        const { data: existingProd } = await supabase.from('products').select('client_id').limit(1).single();
        if (!existingProd?.client_id) {
            log('  ❌ Cannot determine client_id. Aborting.');
            return;
        }
    }
    const finalClientId = clientId || (await supabase.from('products').select('client_id').limit(1).single()).data?.client_id;

    let synced = 0, skipped = 0, errors = 0;

    for (const item of raw) {
        const code = item['Código'] || '';
        const rawName = item['Nome'] || '';
        const nameParts = rawName.split('\n').map(s => s.trim()).filter(Boolean);
        const name = nameParts[0] || '';
        const supplier = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const reference = item['Referência'] || '';
        const price = parsePrice(item['Preço de venda'] || '');
        const stock = parseStock(item['Saldo empresa'] || '');

        if (!name || name.length < 2) { skipped++; continue; }

        const slug = slugify(name) || `product-${code}`;
        const sku = code ? `MV-${code}` : '';

        // Check if already exists by SKU
        const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('sku', sku)
            .limit(1)
            .maybeSingle();

        const productData = {
            client_id: finalClientId,
            name,
            slug: existing ? undefined : slug, // Don't update slug on existing
            price,
            cost_price: Math.round(price * 0.4 * 100) / 100,
            sku,
            is_active: stock > 0 || price > 0,
            description: supplier ? `Fornecedor: ${supplier}` : null,
            barcode: reference || null,
        };

        try {
            if (existing) {
                // Update price and stock info
                delete productData.slug;
                delete productData.client_id;
                const { error } = await supabase.from('products').update(productData).eq('id', existing.id);
                if (error) { log(`  ❌ Update ${sku}: ${error.message}`); errors++; }
                else synced++;
            } else {
                // Make slug unique
                const { data: slugCheck } = await supabase.from('products').select('id').eq('slug', slug).limit(1).maybeSingle();
                if (slugCheck) productData.slug = `${slug}-${code}`;

                const { error } = await supabase.from('products').insert(productData);
                if (error) {
                    if (error.message.includes('duplicate') || error.message.includes('unique')) {
                        productData.slug = `${slug}-${code}-${Date.now()}`;
                        const { error: retry } = await supabase.from('products').insert(productData);
                        if (retry) { log(`  ❌ Insert ${sku}: ${retry.message}`); errors++; }
                        else synced++;
                    } else {
                        log(`  ❌ Insert ${sku}: ${error.message}`);
                        errors++;
                    }
                } else synced++;
            }
        } catch (e) {
            log(`  ❌ ${sku}: ${e.message}`);
            errors++;
        }
    }

    log(`  ✅ Products: ${synced} synced, ${skipped} skipped, ${errors} errors`);
}

// ─── Sync Clients → Contacts ────────────────────────────────────────────────────

async function syncClients() {
    const filePath = path.join(DATA_DIR, 'clients_latest.json');
    if (!fs.existsSync(filePath)) { log('❌ No clients_latest.json'); return; }

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    log(`👥 Syncing ${raw.length} clients → contacts...`);

    // Get client_id
    const { data: existingContact } = await supabase.from('contacts').select('client_id').limit(1).maybeSingle();
    const { data: existingProd } = await supabase.from('products').select('client_id').limit(1).maybeSingle();
    const clientId = existingContact?.client_id || existingProd?.client_id;

    if (!clientId) {
        log('  ❌ Cannot determine client_id. Aborting.');
        return;
    }

    let synced = 0, skipped = 0, errors = 0;

    for (const item of raw) {
        const code = item['Código'] || '';
        const name = (item['Nome'] || '').trim();
        const document = item['Documento'] || '';
        const phone = normalizePhone(item['Telefone'] || '');
        const email = (item['E-mail'] || '').trim();
        const type = item['Tipo'] || '';

        if (!name || name.length < 2) { skipped++; continue; }
        // Skip suppliers/transport-only entries
        if (type === 'Fornecedor' || type === 'Transportadora') { skipped++; continue; }

        // Check if contact already exists by phone or name+document
        let existing = null;
        if (phone && phone.length >= 10) {
            const { data } = await supabase
                .from('contacts')
                .select('id')
                .eq('client_id', clientId)
                .eq('phone', phone)
                .limit(1)
                .maybeSingle();
            existing = data;
        }

        // Also check by metadata (microvix code)
        if (!existing) {
            const { data } = await supabase
                .from('contacts')
                .select('id, metadata')
                .eq('client_id', clientId)
                .ilike('name', name)
                .limit(1)
                .maybeSingle();
            existing = data;
        }

        const metadata = {
            microvix_code: code,
            document: document,
            type: type,
            state_registration: item['Inscrição Estadual'] || '',
            source: 'microvix_scrape',
            scraped_at: new Date().toISOString(),
        };

        const contactData = {
            client_id: clientId,
            name: name,
            phone: phone || null,
            email: email || null,
            source: 'erp',
            metadata: metadata,
            status: 'active',
        };

        try {
            if (existing) {
                delete contactData.client_id;
                delete contactData.source;
                const { error } = await supabase.from('contacts').update(contactData).eq('id', existing.id);
                if (error) { log(`  ❌ Update contact ${code}: ${error.message}`); errors++; }
                else synced++;
            } else {
                const { error } = await supabase.from('contacts').insert(contactData);
                if (error) { log(`  ❌ Insert contact ${code}: ${error.message}`); errors++; }
                else synced++;
            }
        } catch (e) {
            log(`  ❌ Contact ${code}: ${e.message}`);
            errors++;
        }
    }

    log(`  ✅ Contacts: ${synced} synced, ${skipped} skipped, ${errors} errors`);
}

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║   MICROVIX → SUPABASE SYNC                         ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    await syncProducts();
    await syncClients();

    console.log('\n  ✅ Sync complete!\n');
}

main().catch(console.error);
