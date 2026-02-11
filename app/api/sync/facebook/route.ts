// API Route: Facebook Messages Sync
// This can be called via cron job or manually to sync Facebook messages into the CRM
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const PAGE_ID = process.env.META_PAGE_ID || '1503236119762968';
const PAGE_TOKEN = process.env.META_PAGE_TOKEN || '';
const CLIENT_ID = process.env.DEFAULT_CLIENT_ID || 'acb4b354-728f-479d-915a-c857d27da9ad';

async function getOrCreateContact(fbUser: { id: string; name?: string }) {
    // Check existing
    const { data: existing } = await supabase
        .from('contacts')
        .select('*')
        .eq('facebook_id', fbUser.id)
        .limit(1);

    if (existing && existing.length > 0) return existing[0];

    // Create new
    const { data: created } = await supabase
        .from('contacts')
        .insert({
            client_id: CLIENT_ID,
            name: fbUser.name || 'Facebook User',
            facebook_id: fbUser.id,
            source: 'facebook',
            status: 'active',
            first_contact_date: new Date().toISOString(),
            last_contact_date: new Date().toISOString(),
        })
        .select()
        .single();

    return created;
}

async function getOrCreateConversation(contactId: string, fbConvId: string) {
    // Check existing
    const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('contact_id', contactId)
        .eq('channel_type', 'facebook')
        .limit(1);

    if (existing && existing.length > 0) return existing[0];

    // Create new
    const { data: created } = await supabase
        .from('conversations')
        .insert({
            client_id: CLIENT_ID,
            contact_id: contactId,
            channel_type: 'facebook',
            status: 'open',
            last_message_at: new Date().toISOString(),
            unread_count: 0,
            metadata: { fb_conversation_id: fbConvId },
        })
        .select()
        .single();

    return created;
}

async function saveMessage(
    conversationId: string,
    contactId: string,
    msg: { id: string; message: string; from: { id: string; name?: string }; created_time: string }
) {
    // Check if already exists
    const { data: existing } = await supabase
        .from('messages')
        .select('id')
        .eq('external_id', msg.id)
        .limit(1);

    if (existing && existing.length > 0) return false;

    const isFromPage = msg.from?.id === PAGE_ID;

    const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        contact_id: contactId,
        sender_type: isFromPage ? 'agent' : 'contact',
        sender_id: contactId,
        channel_type: 'facebook',
        content_type: 'text',
        content: msg.message,
        external_id: msg.id,
        status: 'delivered',
        metadata: {
            from_name: msg.from?.name,
            created_time: msg.created_time,
            fb_user_id: msg.from?.id,
        },
    });

    return !error;
}

// GET: Manual or cron-triggered sync
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    // Simple auth to prevent unauthorized calls
    if (secret !== process.env.META_VERIFY_TOKEN && secret !== 'lalelilo_verify') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!PAGE_TOKEN) {
        return NextResponse.json({ error: 'META_PAGE_TOKEN not configured' }, { status: 500 });
    }

    try {
        // Fetch conversations from Facebook
        const fbUrl = `https://graph.facebook.com/v21.0/${PAGE_ID}/conversations?fields=id,messages.limit(10){message,from,created_time}&limit=25&access_token=${PAGE_TOKEN}`;
        const fbRes = await fetch(fbUrl);
        const fbData = await fbRes.json();

        if (fbData.error) {
            return NextResponse.json({ error: fbData.error.message }, { status: 500 });
        }

        let totalConversations = 0;
        let totalMessages = 0;
        let newMessages = 0;

        const conversations = fbData.data || [];

        for (const conv of conversations) {
            const messages = conv.messages?.data || [];
            if (messages.length === 0) continue;

            // Find the non-page sender
            const senderMsg = messages.find((m: any) => m.from?.id !== PAGE_ID);
            const sender = senderMsg?.from || messages[0]?.from;
            if (!sender) continue;

            // Get or create contact
            const contact = await getOrCreateContact(sender);
            if (!contact) continue;

            // Get or create conversation
            const conversation = await getOrCreateConversation(contact.id, conv.id);
            if (!conversation) continue;

            totalConversations++;

            // Save messages
            for (const msg of messages) {
                if (!msg.message) continue;
                totalMessages++;
                const saved = await saveMessage(conversation.id, contact.id, msg);
                if (saved) newMessages++;
            }

            // Update conversation last_message_at
            const latestMsg = messages[0];
            if (latestMsg?.created_time) {
                await supabase
                    .from('conversations')
                    .update({
                        last_message_at: latestMsg.created_time,
                        unread_count: conversation.unread_count + newMessages,
                    })
                    .eq('id', conversation.id);
            }

            // Update contact last_contact_date
            await supabase
                .from('contacts')
                .update({ last_contact_date: new Date().toISOString() })
                .eq('id', contact.id);
        }

        return NextResponse.json({
            success: true,
            synced_at: new Date().toISOString(),
            conversations: totalConversations,
            total_messages: totalMessages,
            new_messages: newMessages,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Webhook handler for real-time Meta notifications
export async function POST(req: NextRequest) {
    const body = await req.json();

    // Webhook verification
    if (body.object === 'page' && body.entry) {
        for (const entry of body.entry) {
            const messaging = entry.messaging || [];
            for (const event of messaging) {
                if (event.message) {
                    const sender = { id: event.sender.id, name: event.sender.name };
                    const contact = await getOrCreateContact(sender);
                    if (!contact) continue;

                    const conversation = await getOrCreateConversation(
                        contact.id,
                        `t_${event.sender.id}_${entry.id}`
                    );
                    if (!conversation) continue;

                    await saveMessage(conversation.id, contact.id, {
                        id: event.message.mid,
                        message: event.message.text || '',
                        from: sender,
                        created_time: new Date(event.timestamp).toISOString(),
                    });
                }
            }
        }
    }

    return NextResponse.json({ status: 'ok' });
}
