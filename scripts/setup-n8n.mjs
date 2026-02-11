// Update n8n Facebook workflow with long-lived page token and correct Supabase URL
// NOTE: Set these environment variables before running:
// - N8N_COOKIE
// - META_PAGE_TOKEN
// - META_PAGE_ID
// - NEXT_PUBLIC_SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - DEFAULT_CLIENT_ID

const N8N_URL = process.env.N8N_URL || 'https://n8n-production-d6fc5.up.railway.app';
const COOKIE = process.env.N8N_COOKIE || '';
const PT = process.env.META_PAGE_TOKEN || '';
const PAGE_ID = process.env.META_PAGE_ID || '';
const SU = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CI = process.env.DEFAULT_CLIENT_ID || '';


async function n8nFetch(endpoint, method = 'GET', body = null) {
  const opts = { method, headers: { 'Cookie': COOKIE, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${N8N_URL}${endpoint}`, opts);
  return res.json();
}

// Delete old workflows
async function deleteOld() {
  const list = await n8nFetch('/rest/workflows');
  if (list.data) {
    for (const wf of list.data) {
      console.log(`Deleting: ${wf.name}`);
      await n8nFetch(`/rest/workflows/${wf.id}`, 'DELETE');
    }
  }
}

const fbSyncWorkflow = {
  name: "Lalelilo - Facebook Auto-Sync",
  nodes: [
    {
      parameters: { rule: { interval: [{ field: "minutes", minutesInterval: 5 }] } },
      id: "sched1", name: "Every 5 Min", type: "n8n-nodes-base.scheduleTrigger", typeVersion: 1.2,
      position: [250, 300]
    },
    {
      parameters: {
        method: "GET",
        url: `https://graph.facebook.com/v21.0/${PAGE_ID}/conversations?fields=id,messages.limit(10){message,from,created_time}&limit=25&access_token=${PT}`,
        options: {}
      },
      id: "http1", name: "Fetch FB Conversations", type: "n8n-nodes-base.httpRequest", typeVersion: 4.2,
      position: [450, 300]
    },
    {
      parameters: {
        jsCode: `const PAGE_ID = '${PAGE_ID}';
const CLIENT_ID = '${CI}';
const SU = '${SU}';
const SK = '${SK}';

const items = $input.all();
const results = [];

for (const item of items) {
  const conversations = item.json.data || [];
  for (const conv of conversations) {
    const messages = conv.messages?.data || [];
    for (const msg of messages) {
      if (!msg.message) continue;
      const isFromPage = msg.from?.id === PAGE_ID;
      results.push({
        json: {
          fb_user_id: msg.from?.id,
          fb_user_name: msg.from?.name || 'Facebook User',
          message: msg.message,
          external_id: msg.id,
          created_time: msg.created_time,
          is_from_page: isFromPage,
          conv_id: conv.id,
          client_id: CLIENT_ID,
          supabase_url: SU,
          supabase_key: SK
        }
      });
    }
  }
}

if (results.length === 0) {
  return [{ json: { _skip: true } }];
}
return results;`
      },
      id: "code1", name: "Process Messages", type: "n8n-nodes-base.code", typeVersion: 2,
      position: [650, 300]
    },
    {
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: "" },
          combinator: "and",
          conditions: [{
            id: "f1",
            leftValue: "={{ $json._skip }}",
            rightValue: true,
            operator: { type: "boolean", operation: "notTrue" }
          }]
        }
      },
      id: "filter1", name: "Has Messages?", type: "n8n-nodes-base.filter", typeVersion: 2,
      position: [850, 300]
    },
    {
      parameters: {
        jsCode: `// Upsert contact, conversation, and message into Supabase
const msg = $input.first().json;
const SU = msg.supabase_url;
const SK = msg.supabase_key;

async function supaFetch(endpoint, method = 'GET', body = null) {
  const opts = { method, headers: { apikey: SK, Authorization: 'Bearer ' + SK, 'Content-Type': 'application/json', Prefer: 'return=representation' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(SU + '/rest/v1/' + endpoint, opts);
  if (!res.ok) return null;
  return res.json();
}

// 1. Get or create contact
let contact;
const existing = await supaFetch('contacts?facebook_id=eq.' + msg.fb_user_id + '&limit=1');
if (existing && existing.length > 0) {
  contact = existing[0];
} else {
  const created = await supaFetch('contacts', 'POST', {
    client_id: msg.client_id, name: msg.fb_user_name, facebook_id: msg.fb_user_id,
    source: 'facebook', status: 'active',
    first_contact_date: new Date().toISOString(), last_contact_date: new Date().toISOString()
  });
  contact = created?.[0];
}
if (!contact) return [{ json: { error: 'no contact' } }];

// 2. Get or create conversation
let conv;
const existingConv = await supaFetch('conversations?contact_id=eq.' + contact.id + '&channel_type=eq.facebook&limit=1');
if (existingConv && existingConv.length > 0) {
  conv = existingConv[0];
} else {
  const created = await supaFetch('conversations', 'POST', {
    client_id: msg.client_id, contact_id: contact.id, channel_type: 'facebook',
    status: 'open', last_message_at: new Date().toISOString(), unread_count: 0,
    metadata: { fb_conversation_id: msg.conv_id }
  });
  conv = created?.[0];
}
if (!conv) return [{ json: { error: 'no conversation' } }];

// 3. Check if message exists
const existingMsg = await supaFetch('messages?external_id=eq.' + msg.external_id + '&limit=1');
if (existingMsg && existingMsg.length > 0) {
  return [{ json: { status: 'already_exists', external_id: msg.external_id } }];
}

// 4. Save message
const saved = await supaFetch('messages', 'POST', {
  conversation_id: conv.id, contact_id: contact.id,
  sender_type: msg.is_from_page ? 'agent' : 'contact',
  sender_id: contact.id, channel_type: 'facebook',
  content_type: 'text', content: msg.message,
  external_id: msg.external_id, status: 'delivered',
  metadata: { from_name: msg.fb_user_name, created_time: msg.created_time, fb_user_id: msg.fb_user_id }
});

// 5. Update conversation
await supaFetch('conversations?id=eq.' + conv.id, 'PATCH', {
  last_message_at: new Date().toISOString(),
  unread_count: (conv.unread_count || 0) + 1
});

return [{ json: { status: 'saved', message: msg.message, contact: contact.name } }];`
      },
      id: "code2", name: "Save to Supabase", type: "n8n-nodes-base.code", typeVersion: 2,
      position: [1050, 300]
    }
  ],
  connections: {
    "Every 5 Min": { main: [[{ node: "Fetch FB Conversations", type: "main", index: 0 }]] },
    "Fetch FB Conversations": { main: [[{ node: "Process Messages", type: "main", index: 0 }]] },
    "Process Messages": { main: [[{ node: "Has Messages?", type: "main", index: 0 }]] },
    "Has Messages?": { main: [[{ node: "Save to Supabase", type: "main", index: 0 }]] }
  },
  settings: { executionOrder: "v1" }
};

async function main() {
  console.log('🗑️  Removing old workflows...');
  await deleteOld();

  console.log('📦 Creating Facebook Auto-Sync workflow...');
  const fb = await n8nFetch('/rest/workflows', 'POST', fbSyncWorkflow);
  if (fb.data) {
    console.log(`✅ Created: ${fb.data.name} (ID: ${fb.data.id})`);

    // Activate it
    const act = await n8nFetch(`/rest/workflows/${fb.data.id}`, 'PATCH', { active: true });
    console.log('🔌 Activated:', act.data?.active ? 'YES' : 'Check manually');
  } else {
    console.log('❌ Error:', JSON.stringify(fb));
  }

  console.log('\n✅ Done! Check: https://n8n-production-d6fc5.up.railway.app');
}

main().catch(console.error);
