// Sync Facebook Messages to Supabase CRM
// Uses existing tables: contacts, conversations, messages
// NOTE: Set these environment variables before running:
// - NEXT_PUBLIC_SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - META_PAGE_TOKEN
// - META_PAGE_ID
// - DEFAULT_CLIENT_ID

const SU = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PT = process.env.META_PAGE_TOKEN || '';
const PAGE_ID = process.env.META_PAGE_ID || '';
const CLIENT_ID = process.env.DEFAULT_CLIENT_ID || '';


async function supaFetch(endpoint, method = 'GET', body = null) {
    const opts = {
        method,
        headers: {
            'apikey': SK,
            'Authorization': `Bearer ${SK}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${SU}/rest/v1/${endpoint}`, opts);
    if (!res.ok) {
        const text = await res.text();
        console.error(`  Error ${res.status}: ${text}`);
        return null;
    }
    return res.json();
}

async function getOrCreateContact(fbUser) {
    // Check if contact exists by facebook_id
    const existing = await supaFetch(`contacts?facebook_id=eq.${fbUser.id}&limit=1`);
    if (existing && existing.length > 0) {
        console.log(`  Contact exists: ${existing[0].name} (${existing[0].id})`);
        return existing[0];
    }

    // Create new contact
    const newContact = await supaFetch('contacts', 'POST', {
        client_id: CLIENT_ID,
        name: fbUser.name || 'Facebook User',
        facebook_id: fbUser.id,
        source: 'facebook',
        status: 'active',
        first_contact_date: new Date().toISOString(),
        last_contact_date: new Date().toISOString()
    });

    if (newContact && newContact.length > 0) {
        console.log(`  Created contact: ${newContact[0].name} (${newContact[0].id})`);
        return newContact[0];
    }
    return null;
}

async function getOrCreateConversation(contact, convId) {
    // Check if conversation exists
    const existing = await supaFetch(`conversations?contact_id=eq.${contact.id}&channel_type=eq.facebook&limit=1`);
    if (existing && existing.length > 0) {
        return existing[0];
    }

    // Create new conversation
    const newConv = await supaFetch('conversations', 'POST', {
        client_id: CLIENT_ID,
        contact_id: contact.id,
        channel_type: 'facebook',
        status: 'open',
        last_message_at: new Date().toISOString(),
        unread_count: 0,
        metadata: { fb_conversation_id: convId }
    });

    if (newConv && newConv.length > 0) {
        console.log(`  Created conversation: ${newConv[0].id}`);
        return newConv[0];
    }
    return null;
}

async function saveMessage(conversation, msg, contact) {
    // Check if message already exists by external_id
    const existing = await supaFetch(`messages?external_id=eq.${msg.id}&limit=1`);
    if (existing && existing.length > 0) {
        return false; // Already saved
    }

    const isFromPage = msg.from?.id === PAGE_ID;

    const newMsg = await supaFetch('messages', 'POST', {
        conversation_id: conversation.id,
        contact_id: contact.id,
        sender_type: isFromPage ? 'agent' : 'contact',
        sender_id: contact.id,
        channel_type: 'facebook',
        content_type: 'text',
        content: msg.message,
        external_id: msg.id,
        status: 'delivered',
        metadata: { from_name: msg.from?.name, created_time: msg.created_time, fb_user_id: msg.from?.id }
    });

    return newMsg !== null;
}

async function main() {
    console.log('🔄 Syncing Facebook Messages to Supabase CRM...\n');

    // Fetch all conversations from Facebook
    let url = `https://graph.facebook.com/v21.0/${PAGE_ID}/conversations?fields=id,participants,messages.limit(25){message,from,created_time}&limit=50&access_token=${PT}`;
    let totalMessages = 0;
    let totalConversations = 0;

    while (url) {
        console.log('📥 Fetching conversations page...');
        const data = await fetch(url).then(r => r.json());

        if (data.error) {
            console.error('❌ API Error:', data.error.message);
            break;
        }

        const conversations = data.data || [];
        console.log(`  Found ${conversations.length} conversations`);

        for (const conv of conversations) {
            const messages = conv.messages?.data || [];
            if (messages.length === 0) continue;

            // Find the non-page participant
            const senderMsg = messages.find(m => m.from?.id !== PAGE_ID);
            const sender = senderMsg?.from || messages[0]?.from;

            if (!sender) continue;

            console.log(`\n👤 Processing: ${sender.name || sender.id}`);

            // Get or create contact
            const contact = await getOrCreateContact(sender);
            if (!contact) {
                console.log('  ⚠️ Could not create contact, skipping');
                continue;
            }

            // Get or create conversation
            const conversation = await getOrCreateConversation(contact, conv.id);
            if (!conversation) {
                console.log('  ⚠️ Could not create conversation, skipping');
                continue;
            }

            totalConversations++;

            // Save messages
            let savedCount = 0;
            for (const msg of messages) {
                if (!msg.message) continue;
                const saved = await saveMessage(conversation, msg, contact);
                if (saved) savedCount++;
                totalMessages++;
            }

            console.log(`  ✅ Processed ${messages.length} messages (${savedCount} new)`);

            // Update last contact date
            await supaFetch(`contacts?id=eq.${contact.id}`, 'PATCH', {
                last_contact_date: new Date().toISOString()
            });
        }

        // Check for next page
        url = data.paging?.next || null;
    }

    console.log(`\n✅ Sync Complete!`);
    console.log(`   📊 ${totalConversations} conversations processed`);
    console.log(`   💬 ${totalMessages} messages synced`);
}

main().catch(console.error);
