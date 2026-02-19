// API Route: Instagram Messages Sync
// Pulls Instagram DM conversations via Meta Graph API
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

const PAGE_ID = process.env.META_PAGE_ID || '';
const PAGE_TOKEN = process.env.META_PAGE_TOKEN || '';
const IG_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID || '';
const CLIENT_ID = process.env.DEFAULT_CLIENT_ID || '';

async function getOrCreateContact(igUser: { id: string; name?: string; username?: string }) {
    const { data: existing } = await supabase
        .from('contacts')
        .select('*')
        .eq('instagram_id', igUser.id)
        .limit(1);

    if (existing && existing.length > 0) {
        // Update name if we have a better one
        if (igUser.name && igUser.name !== existing[0].name) {
            await supabase.from('contacts').update({
                name: igUser.name,
                last_contact_date: new Date().toISOString(),
            }).eq('id', existing[0].id);
        }
        return existing[0];
    }

    const { data: created } = await supabase
        .from('contacts')
        .insert({
            client_id: CLIENT_ID,
            name: igUser.name || igUser.username || 'Instagram User',
            instagram_id: igUser.id,
            source: 'instagram',
            status: 'active',
            first_contact_date: new Date().toISOString(),
            last_contact_date: new Date().toISOString(),
            metadata: { instagram_username: igUser.username },
        })
        .select()
        .single();

    return created;
}

async function getOrCreateConversation(contactId: string, igConvId: string) {
    const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('contact_id', contactId)
        .eq('channel_type', 'instagram')
        .limit(1);

    if (existing && existing.length > 0) return existing[0];

    const { data: created } = await supabase
        .from('conversations')
        .insert({
            client_id: CLIENT_ID,
            contact_id: contactId,
            channel_type: 'instagram',
            status: 'open',
            last_message_at: new Date().toISOString(),
            unread_count: 0,
            metadata: { ig_conversation_id: igConvId },
        })
        .select()
        .single();

    return created;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.META_VERIFY_TOKEN && secret !== 'lalelilo_verify_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!PAGE_TOKEN || !PAGE_ID) {
        return NextResponse.json({
            success: false,
            channel: 'instagram',
            error: 'META_PAGE_TOKEN or META_PAGE_ID not configured',
        });
    }

    try {
        // Fetch Instagram conversations via the Page
        const convRes = await fetch(
            `https://graph.facebook.com/v21.0/${PAGE_ID}/conversations?platform=INSTAGRAM&fields=id,participants,updated_time,snippet,message_count&limit=25&access_token=${PAGE_TOKEN}`
        );
        const convData = await convRes.json();

        if (convData.error) {
            return NextResponse.json({
                success: false,
                channel: 'instagram',
                error: convData.error.message,
            });
        }

        const conversations = convData.data || [];
        let totalConversations = 0;
        let totalMessages = 0;
        let newMessages = 0;

        for (const conv of conversations) {
            try {
                // Find the participant that is NOT the page
                const participants = conv.participants?.data || [];
                const customer = participants.find((p: any) => p.id !== PAGE_ID && p.id !== IG_ACCOUNT_ID);
                if (!customer) continue;

                // Get or create contact
                const contact = await getOrCreateContact({
                    id: customer.id,
                    name: customer.name || customer.username,
                    username: customer.username,
                });
                if (!contact) continue;

                // Get or create conversation
                const conversation = await getOrCreateConversation(contact.id, conv.id);
                if (!conversation) continue;

                totalConversations++;

                // Fetch messages for this conversation
                const msgRes = await fetch(
                    `https://graph.facebook.com/v21.0/${conv.id}/messages?fields=id,message,from,created_time,attachments&limit=15&access_token=${PAGE_TOKEN}`
                );
                const msgData = await msgRes.json();

                if (msgData.error) {
                    console.error('[IG Sync] Error fetching messages:', msgData.error.message);
                    continue;
                }

                const messages = msgData.data || [];

                for (const msg of messages) {
                    if (!msg.message && !msg.attachments) continue;
                    totalMessages++;

                    // Check if already exists
                    const { data: existingMsg } = await supabase
                        .from('messages')
                        .select('id')
                        .eq('external_id', msg.id)
                        .limit(1);

                    if (existingMsg && existingMsg.length > 0) continue;

                    const isFromCustomer = msg.from?.id === customer.id;
                    const mediaUrl = msg.attachments?.data?.[0]?.image_data?.url ||
                        msg.attachments?.data?.[0]?.file_url || '';

                    await supabase.from('messages').insert({
                        conversation_id: conversation.id,
                        contact_id: contact.id,
                        sender_type: isFromCustomer ? 'contact' : 'agent',
                        sender_id: contact.id,
                        channel_type: 'instagram',
                        content_type: mediaUrl ? 'image' : 'text',
                        content: msg.message || '',
                        media_url: mediaUrl || null,
                        external_id: msg.id,
                        status: 'delivered',
                        created_at: msg.created_time || new Date().toISOString(),
                    });

                    newMessages++;
                }

                // Update conversation timestamp
                if (conv.updated_time) {
                    await supabase
                        .from('conversations')
                        .update({ last_message_at: conv.updated_time })
                        .eq('id', conversation.id);
                }
            } catch (e) {
                console.error('[IG Sync] Error processing conversation:', e);
                continue;
            }
        }

        return NextResponse.json({
            success: true,
            channel: 'instagram',
            synced_at: new Date().toISOString(),
            conversations: totalConversations,
            total_messages: totalMessages,
            new_messages: newMessages,
            ig_account: IG_ACCOUNT_ID,
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            channel: 'instagram',
            error: error.message,
        });
    }
}
