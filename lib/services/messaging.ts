// Lalelilo - Omnichannel Messaging Service
// WhatsApp (WAHA) + Instagram + Facebook — unified inbox

import { createClient } from '@supabase/supabase-js';
import { sendText as wahaSendText } from './waha';
import { upsertContact } from './crm';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const getSupabase = () => createClient(supabaseUrl, supabaseKey);

// Meta API config
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const META_PAGE_ID = process.env.META_PAGE_ID || '';
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID || '';

// ============================================================================
// CONVERSATIONS
// ============================================================================

export async function getConversations(params: {
    clientId: string; status?: string; channelType?: string;
    assignedTo?: string; shopId?: string; limit?: number;
}) {
    const supabase = getSupabase();
    let query = supabase.from('conversations')
        .select('*, contact:contacts(*), assigned:users!assigned_to(id, name, avatar_url), last_msg:messages(content, content_type, created_at)')
        .eq('client_id', params.clientId)
        .order('last_message_at', { ascending: false })
        .limit(params.limit || 50);

    if (params.status) query = query.eq('status', params.status);
    if (params.channelType) query = query.eq('channel_type', params.channelType);
    if (params.assignedTo) query = query.eq('assigned_to', params.assignedTo);
    if (params.shopId) query = query.eq('shop_id', params.shopId);
    return query;
}

export async function getMessages(conversationId: string, limit = 100) {
    const supabase = getSupabase();
    return supabase.from('messages').select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }).limit(limit);
}

// ============================================================================
// INBOUND MESSAGE HANDLING
// ============================================================================

export async function handleInboundMessage(params: {
    clientId: string;
    channelType: 'whatsapp' | 'instagram' | 'facebook';
    senderPhone?: string;
    senderInstagramId?: string;
    senderFacebookId?: string;
    senderName?: string;
    contentType: string;
    content?: string;
    mediaUrl?: string;
    externalId?: string;
}) {
    const supabase = getSupabase();

    // 1. Upsert contact
    const { data: contact } = await upsertContact({
        clientId: params.clientId,
        phone: params.senderPhone,
        name: params.senderName,
        instagramId: params.senderInstagramId,
        facebookId: params.senderFacebookId,
    });

    if (!contact) return { error: new Error('Failed to create contact') };

    // 2. Find or create conversation
    let conversation = null;
    const { data: existing } = await supabase.from('conversations')
        .select('id').eq('contact_id', contact.id).eq('channel_type', params.channelType)
        .in('status', ['open']).order('created_at', { ascending: false }).limit(1).single();

    if (existing) {
        conversation = existing;
    } else {
        const { data: newConv } = await supabase.from('conversations').insert({
            client_id: params.clientId, contact_id: contact.id,
            channel_type: params.channelType, status: 'open',
        }).select().single();
        conversation = newConv;
    }

    if (!conversation) return { error: new Error('Failed to create conversation') };

    // 3. Store message
    const { data: message } = await supabase.from('messages').insert({
        conversation_id: conversation.id, contact_id: contact.id,
        sender_type: 'contact', sender_id: contact.id,
        channel_type: params.channelType, content_type: params.contentType,
        content: params.content, media_url: params.mediaUrl,
        external_id: params.externalId, status: 'delivered',
    }).select().single();

    // 4. Update conversation
    await supabase.from('conversations').update({
        last_message_at: new Date().toISOString(),
        unread_count: (await supabase.from('conversations').select('unread_count').eq('id', conversation.id).single()).data?.unread_count + 1 || 1,
    }).eq('id', conversation.id);

    return { data: { contact, conversation, message } };
}

// ============================================================================
// OUTBOUND MESSAGE (Routes to correct channel)
// ============================================================================

export async function sendMessage(params: {
    conversationId: string;
    senderId: string; // agent user ID
    content: string;
    contentType?: string;
    mediaUrl?: string;
}) {
    const supabase = getSupabase();

    // Get conversation to know the channel
    const { data: conv } = await supabase.from('conversations')
        .select('*, contact:contacts(*)').eq('id', params.conversationId).single();

    if (!conv) return { error: new Error('Conversation not found') };

    const contact = conv.contact as { phone?: string; instagram_id?: string; facebook_id?: string };

    // Send via the appropriate channel
    let externalId = '';
    let sendError = '';

    switch (conv.channel_type) {
        case 'whatsapp':
            if (contact?.phone) {
                const result = await wahaSendText({ phone: contact.phone, text: params.content });
                if (result.error) sendError = result.error;
                externalId = result.id || '';
            }
            break;

        case 'instagram':
            if (contact?.instagram_id) {
                const result = await sendInstagramDM(contact.instagram_id, params.content);
                if (result.error) sendError = result.error;
                externalId = result.id || '';
            }
            break;

        case 'facebook':
            if (contact?.facebook_id) {
                const result = await sendFacebookMessage(contact.facebook_id, params.content);
                if (result.error) sendError = result.error;
                externalId = result.id || '';
            }
            break;
    }

    // Store outbound message
    const { data: message } = await supabase.from('messages').insert({
        conversation_id: params.conversationId, sender_type: 'agent',
        sender_id: params.senderId, channel_type: conv.channel_type,
        content_type: params.contentType || 'text', content: params.content,
        media_url: params.mediaUrl, external_id: externalId,
        status: sendError ? 'failed' : 'sent',
    }).select().single();

    // Update conversation timestamp
    await supabase.from('conversations').update({
        last_message_at: new Date().toISOString(), unread_count: 0,
    }).eq('id', params.conversationId);

    return { data: message, error: sendError || null };
}

// ============================================================================
// META API (Instagram & Facebook)
// ============================================================================

async function sendInstagramDM(recipientId: string, text: string) {
    try {
        const res = await fetch(`https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${META_ACCESS_TOKEN}` },
            body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
        });
        const data = await res.json();
        return { id: data.message_id || '', error: data.error?.message };
    } catch (err) { return { id: '', error: String(err) }; }
}

async function sendFacebookMessage(recipientId: string, text: string) {
    try {
        const res = await fetch(`https://graph.facebook.com/v18.0/${META_PAGE_ID}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${META_ACCESS_TOKEN}` },
            body: JSON.stringify({ recipient: { id: recipientId }, messaging_type: 'RESPONSE', message: { text } }),
        });
        const data = await res.json();
        return { id: data.message_id || '', error: data.error?.message };
    } catch (err) { return { id: '', error: String(err) }; }
}
