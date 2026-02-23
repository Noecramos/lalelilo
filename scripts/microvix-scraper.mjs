/**
 * Microvix ERP Scraper v3
 * 
 * Now with correct selectors based on actual DOM analysis.
 * Key findings:
 * - Login page is at erp.microvix.com.br (Vue.js SPA)
 * - Company selection uses a.company-link inside li.list-group-item
 * - After company selection, redirects to linx.microvix.com.br/v4/home/index2.asp
 * - ERP dashboard loads modules in the main frame (no iframes on initial load)
 * - Menu items use a[title] with data-endereco attribute
 * - Products: title="Cadastros > Produtos " (trailing space!)
 * - Clients: title="Cadastros > Clientes e Fornecedores"
 * 
 * Usage: node scripts/microvix-scraper.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'microvix');

// Load credentials from .env.local
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('❌ .env.local not found! Create it with MICROVIX_USERNAME and MICROVIX_PASSWORD');
        process.exit(1);
    }
    const content = fs.readFileSync(envPath, 'utf8');
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

const CONFIG = {
    loginUrl: 'https://erp.microvix.com.br/',
    dashboardUrl: 'https://linx.microvix.com.br/v4/home/index2.asp',
    username: env.MICROVIX_USERNAME || '',
    password: env.MICROVIX_PASSWORD || '',
};

if (!CONFIG.username || !CONFIG.password) {
    console.error('❌ Missing MICROVIX_USERNAME or MICROVIX_PASSWORD in .env.local');
    process.exit(1);
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function saveJson(filename, data) {
    ensureDir(DATA_DIR);
    const fp = path.join(DATA_DIR, filename);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log(`  💾 ${data.length} records → ${fp}`);
}
function log(msg) {
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`);
}

async function main() {
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║   MICROVIX ERP SCRAPER v3                           ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    ensureDir(DATA_DIR);

    const browser = await chromium.launch({ headless: false, slowMo: 50 });
    const context = await browser.newContext({
        viewport: { width: 1600, height: 900 },
        locale: 'pt-BR',
    });
    const page = await context.newPage();

    try {
        // ══════ STEP 1: LOGIN ══════
        log('🔐 Logging in...');
        await page.goto(CONFIG.loginUrl, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(2000);

        // Fill credentials via JS (Vue.js SPA needs input events)
        await page.evaluate(({ u, p }) => {
            const login = document.querySelector('#f_login');
            const senha = document.querySelector('#f_senha');
            if (login) {
                login.value = u;
                login.dispatchEvent(new Event('input', { bubbles: true }));
                login.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (senha) {
                senha.value = p;
                senha.dispatchEvent(new Event('input', { bubbles: true }));
                senha.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, { u: CONFIG.username, p: CONFIG.password });

        await page.waitForTimeout(500);
        await page.click('#lmxta-login-btn-autenticar');

        // Wait for company selection page
        await page.waitForSelector('.company-link', { timeout: 15000 });
        log('  ✅ Logged in → company selection page');

        // ══════ STEP 2: GET COMPANIES ══════
        const companies = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('li.list-group-item')).map((li, i) => {
                const span = li.querySelector('span');
                const small = li.querySelector('small');
                return {
                    index: i,
                    name: span?.textContent?.trim() || '',
                    cnpj: small?.textContent?.replace('CNPJ:', '').trim() || '',
                };
            });
        });
        log(`🏬 Found ${companies.length} companies:`);
        companies.forEach(c => log(`    ${c.name} (${c.cnpj})`));

        // ══════ STEP 3: SELECT FIRST COMPANY & WAIT FOR DASHBOARD ══════
        log('\n🏬 Selecting first company (1 - GRAVATÁ)...');

        // Click the first company link
        await page.evaluate(() => {
            const firstLink = document.querySelector('a.company-link');
            if (firstLink) firstLink.click();
        });

        // Wait for redirect to the ERP dashboard (different domain)
        log('  Waiting for ERP dashboard redirect...');
        await page.waitForURL(/linx\.microvix\.com\.br/, { timeout: 30000 });
        await page.waitForTimeout(5000); // Extra wait for dashboard widgets to load

        const currentUrl = page.url();
        log(`  ✅ On dashboard: ${currentUrl}`);
        await page.screenshot({ path: path.join(DATA_DIR, 'step3_dashboard.png') });

        // ══════ STEP 4: SCRAPE PRODUCTS ══════
        log('\n📦 Navigating to Products...');

        // Click the Produtos menu item
        const prodClicked = await page.evaluate(() => {
            // Try with trailing space first (confirmed from earlier DOM inspection)
            let link = document.querySelector('a[title="Cadastros > Produtos "]');
            if (!link) {
                // Try without trailing space
                link = document.querySelector('a[title="Cadastros > Produtos"]');
            }
            if (!link) {
                // Fallback: find by text content
                const allLinks = document.querySelectorAll('a');
                for (const a of allLinks) {
                    if (a.textContent.trim() === 'Produtos' && a.closest('.sidebar-menu, #sidebar, nav')) {
                        link = a;
                        break;
                    }
                }
            }
            if (link) {
                link.click();
                return { found: true, title: link.title, endereco: link.getAttribute('data-endereco') };
            }
            return { found: false };
        });

        log(`  Menu click result: ${JSON.stringify(prodClicked)}`);

        if (!prodClicked.found) {
            // Try expanding Cadastros menu first
            log('  Expanding Cadastros menu...');
            await page.evaluate(() => {
                const items = document.querySelectorAll('a');
                for (const a of items) {
                    if (a.textContent.trim() === 'Cadastros') {
                        a.click();
                        break;
                    }
                }
            });
            await page.waitForTimeout(1500);

            // Try again
            await page.evaluate(() => {
                const link = document.querySelector('a[title*="Produtos"]');
                if (link) link.click();
            });
        }

        // Wait for product list to load
        await page.waitForTimeout(6000);
        await page.screenshot({ path: path.join(DATA_DIR, 'step4_products.png') });

        // Check all frames for product data
        const allFrames = page.frames();
        log(`  Total frames: ${allFrames.length}`);
        for (let i = 0; i < allFrames.length; i++) {
            const f = allFrames[i];
            try {
                const url = f.url();
                const tableCount = await f.evaluate(() => {
                    const tables = document.querySelectorAll('table');
                    let maxRows = 0;
                    tables.forEach(t => {
                        const rows = t.querySelectorAll('tbody tr').length;
                        if (rows > maxRows) maxRows = rows;
                    });
                    return { tables: tables.length, maxRows };
                });
                log(`    Frame ${i}: ${url.slice(0, 80)}... tables=${tableCount.tables}, maxRows=${tableCount.maxRows}`);
            } catch (e) {
                log(`    Frame ${i}: cross-origin or error`);
            }
        }

        // Extract products from whichever frame has the data
        let products = [];
        for (const frame of allFrames) {
            try {
                const data = await frame.evaluate(() => {
                    const tables = document.querySelectorAll('table');
                    for (const table of tables) {
                        const trs = table.querySelectorAll('tbody tr');
                        if (trs.length < 2) continue;

                        const headers = Array.from(table.querySelectorAll('th')).map(th =>
                            th.textContent.trim()
                                .replace(/[↑↓▲▼♦\u25B2\u25BC]/g, '')
                                .replace(/\s+/g, ' ')
                                .trim()
                        );

                        const rows = [];
                        for (const tr of trs) {
                            const cells = tr.querySelectorAll('td');
                            if (cells.length < 2) continue;
                            const record = {};
                            cells.forEach((td, i) => {
                                const key = headers[i] || `col_${i}`;
                                record[key] = td.textContent.trim();
                            });
                            rows.push(record);
                        }
                        if (rows.length > 0) return rows;
                    }
                    return [];
                });
                if (data.length > 0) {
                    products = data;
                    log(`  📊 Extracted ${products.length} products!`);
                    break;
                }
            } catch (e) { }
        }

        if (products.length === 0) {
            log('  ⚠️ No products extracted. Dumping page state...');
            const html = await page.content();
            fs.writeFileSync(path.join(DATA_DIR, 'debug_products_v3.html'), html, 'utf8');

            // Also try to get inner HTML of the main content area
            const innerContent = await page.evaluate(() => {
                const iframe = document.querySelector('iframe');
                if (iframe) return { type: 'iframe', src: iframe.src };
                const main = document.querySelector('.main-content, #conteudo, .content, main');
                if (main) return { type: 'main', html: main.innerHTML.slice(0, 2000) };
                return { type: 'nothing', bodyLength: document.body.innerHTML.length };
            });
            log(`  Content info: ${JSON.stringify(innerContent).slice(0, 500)}`);
        }

        // ══════ STEP 5: SCRAPE CLIENTS ══════
        log('\n👥 Navigating to Clients...');

        await page.evaluate(() => {
            let link = document.querySelector('a[title="Cadastros > Clientes e Fornecedores"]');
            if (!link) link = document.querySelector('a[title*="Clientes"]');
            if (link) link.click();
        });
        await page.waitForTimeout(6000);
        await page.screenshot({ path: path.join(DATA_DIR, 'step5_clients.png') });

        let clients = [];
        for (const frame of page.frames()) {
            try {
                const data = await frame.evaluate(() => {
                    const tables = document.querySelectorAll('table');
                    for (const table of tables) {
                        const trs = table.querySelectorAll('tbody tr');
                        if (trs.length < 2) continue;
                        const headers = Array.from(table.querySelectorAll('th')).map(th =>
                            th.textContent.trim().replace(/[↑↓▲▼♦]/g, '').replace(/\s+/g, ' ').trim()
                        );
                        const rows = [];
                        for (const tr of trs) {
                            const cells = tr.querySelectorAll('td');
                            if (cells.length < 2) continue;
                            const record = {};
                            cells.forEach((td, i) => {
                                record[headers[i] || `col_${i}`] = td.textContent.trim();
                            });
                            rows.push(record);
                        }
                        if (rows.length > 0) return rows;
                    }
                    return [];
                });
                if (data.length > 0) {
                    clients = data;
                    log(`  📊 Extracted ${clients.length} clients!`);
                    break;
                }
            } catch (e) { }
        }

        if (clients.length === 0) {
            log('  ⚠️ No clients extracted. Saving debug info...');
            const html = await page.content();
            fs.writeFileSync(path.join(DATA_DIR, 'debug_clients_v3.html'), html, 'utf8');
        }

        // ══════ STEP 6: SAVE ══════
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

        if (products.length > 0) {
            saveJson(`products_${ts}.json`, products);
            saveJson('products_latest.json', products);
        }
        if (clients.length > 0) {
            saveJson(`clients_${ts}.json`, clients);
            saveJson('clients_latest.json', clients);
        }

        console.log('\n╔════════════════════════════════════════╗');
        console.log('║   RESULTS                              ║');
        console.log('╚════════════════════════════════════════╝');
        console.log(`  📦 Products: ${products.length}`);
        console.log(`  👥 Clients:  ${clients.length}`);
        console.log(`  📁 ${DATA_DIR}\n`);

        // Keep all companies info for reference
        saveJson('companies.json', companies);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await page.screenshot({ path: path.join(DATA_DIR, 'error.png') }).catch(() => { });
    } finally {
        await browser.close();
    }
}

main().catch(console.error);
