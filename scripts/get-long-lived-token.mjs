/**
 * Meta Long-Lived Token Generator
 * 
 * This script converts a short-lived (1hr) Meta token into a permanent Page Access Token.
 * 
 * Steps:
 * 1. Go to https://developers.facebook.com/tools/explorer/
 * 2. Select your app
 * 3. Click "Generate Access Token" (get a short-lived user token)
 * 4. Make sure you have these permissions:
 *    - pages_messaging
 *    - pages_read_engagement  
 *    - pages_manage_metadata
 *    - instagram_basic
 *    - instagram_manage_messages
 * 5. Copy the token and paste it below as SHORT_LIVED_TOKEN
 * 6. Run: node scripts/get-long-lived-token.mjs
 */

// ═══════════════════════════════════════════════════
// PASTE YOUR NEW SHORT-LIVED TOKEN HERE:
const SHORT_LIVED_TOKEN = process.env.META_ACCESS_TOKEN || 'PASTE_YOUR_TOKEN_HERE';
// ═══════════════════════════════════════════════════

const APP_ID = process.env.META_APP_ID || '';
const APP_SECRET = process.env.META_APP_SECRET || '';
const PAGE_ID = process.env.META_PAGE_ID || '';

async function main() {
    console.log('🔑 Meta Long-Lived Token Generator');
    console.log('═══════════════════════════════════\n');

    if (!APP_ID || !APP_SECRET || !PAGE_ID) {
        console.log('❌ Missing environment variables!');
        console.log('   Make sure META_APP_ID, META_APP_SECRET, and META_PAGE_ID are set in .env.local');
        process.exit(1);
    }

    if (SHORT_LIVED_TOKEN === 'PASTE_YOUR_TOKEN_HERE') {
        console.log('❌ Please paste your short-lived token in the script first!');
        console.log('   Open scripts/get-long-lived-token.mjs and set SHORT_LIVED_TOKEN\n');
        console.log('To get a short-lived token:');
        console.log('1. Go to https://developers.facebook.com/tools/explorer/');
        console.log('2. Select your app');
        console.log('3. Add permissions: pages_messaging, pages_read_engagement, instagram_basic, instagram_manage_messages');
        console.log('4. Click "Generate Access Token"');
        console.log('5. Copy the token and paste it in this script');
        process.exit(1);
    }

    // Step 1: Exchange short-lived token for long-lived user token (~60 days)
    console.log('Step 1: Converting short-lived token to long-lived user token...');
    const llUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${SHORT_LIVED_TOKEN}`;

    const llRes = await fetch(llUrl);
    const llData = await llRes.json();

    if (llData.error) {
        console.log(`\n❌ Error: ${llData.error.message}`);
        console.log('   The short-lived token may have expired. Generate a new one at:');
        console.log('   https://developers.facebook.com/tools/explorer/\n');
        process.exit(1);
    }

    const longLivedUserToken = llData.access_token;
    console.log(`✅ Long-lived user token obtained (expires in ${llData.expires_in ? Math.round(llData.expires_in / 86400) + ' days' : 'unknown'})\n`);

    // Step 2: Get permanent page token
    console.log('Step 2: Getting permanent page access token...');
    const pageUrl = `https://graph.facebook.com/v21.0/${PAGE_ID}?fields=access_token&access_token=${longLivedUserToken}`;

    const pageRes = await fetch(pageUrl);
    const pageData = await pageRes.json();

    if (pageData.error) {
        console.log(`\n❌ Error: ${pageData.error.message}`);
        console.log('   Make sure you have admin access to page ID:', PAGE_ID);
        process.exit(1);
    }

    const permanentPageToken = pageData.access_token;
    console.log('✅ Permanent page token obtained!\n');

    // Step 3: Verify the token
    console.log('Step 3: Verifying token...');
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${permanentPageToken}&access_token=${APP_ID}|${APP_SECRET}`;
    const debugRes = await fetch(debugUrl);
    const debugData = await debugRes.json();

    const tokenInfo = debugData.data;
    console.log(`   Type: ${tokenInfo?.type || 'unknown'}`);
    console.log(`   Valid: ${tokenInfo?.is_valid ? '✅ Yes' : '❌ No'}`);
    console.log(`   Expires: ${tokenInfo?.expires_at === 0 ? '🔒 Never (permanent!)' : new Date(tokenInfo?.expires_at * 1000).toISOString()}`);
    console.log(`   Scopes: ${tokenInfo?.scopes?.join(', ') || 'unknown'}\n`);

    // Step 4: Test the token by fetching conversations
    console.log('Step 4: Testing token by fetching conversations...');
    const testUrl = `https://graph.facebook.com/v21.0/${PAGE_ID}/conversations?fields=id&limit=3&access_token=${permanentPageToken}`;
    const testRes = await fetch(testUrl);
    const testData = await testRes.json();

    if (testData.error) {
        console.log(`❌ Token test failed: ${testData.error.message}\n`);
    } else {
        console.log(`✅ Token works! Found ${testData.data?.length || 0} conversations\n`);
    }

    // Output
    console.log('═══════════════════════════════════════════════════════════');
    console.log('YOUR PERMANENT PAGE TOKEN (copy this):');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n${permanentPageToken}\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📋 Next steps:');
    console.log('1. Update .env.local:');
    console.log(`   META_PAGE_TOKEN="${permanentPageToken}"`);
    console.log('\n2. Update Vercel Environment Variables:');
    console.log('   https://vercel.com/noe-ramos-projects/lalelilo/settings/environment-variables');
    console.log(`   Set META_PAGE_TOKEN to the token above`);
    console.log('\n3. Redeploy on Vercel for changes to take effect');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
