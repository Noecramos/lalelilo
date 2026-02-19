// Instagram Webhook — receives DMs and other events from Instagram via Meta
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'lalelilo_verify_2026';
const PAGE_ID = process.env.META_PAGE_ID || '';
const IG_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID || '';
const CLIENT_ID = process.env.DEFAULT_CLIENT_ID || '';

// GET: Webhook verification (Meta sends a GET to verify the endpoint)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[IG Webhook] Verified successfully');
        return new Response(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST: Receive incoming Instagram messages
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('[IG Webhook] Received:', JSON.stringify(body).substring(0, 500));

        if (body.object === 'instagram') {
            for (const entry of body.entry || []) {
                for (const event of entry.messaging || []) {
                    const senderId = event.sender?.id;
                    const recipientId = event.recipient?.id;
                    const message = event.message;
                    const timestamp = event.timestamp;

                    // Skip messages sent by the page itself
                    if (senderId === PAGE_ID || senderId === IG_ACCOUNT_ID) {
                        console.log('[IG Webhook] Skipping own message');
                        continue;
                    }

                    if (!message || !senderId) continue;

                    console.log(`[IG Webhook] Message from ${senderId}: ${message.text?.substring(0, 100)}`);

                    try {
                        // Get or create contact
                        const { data: existingContacts } = await supabase
                            .from('contacts')
                            .select('*')
                            .eq('instagram_id', senderId)
                            .limit(1);

                        let contact;
                        if (existingContacts && existingContacts.length > 0) {
                            contact = existingContacts[0];
                            await supabase.from('contacts').update({
                                last_contact_date: new Date().toISOString(),
                            }).eq('id', contact.id);
                        } else {
                            const { data: created } = await supabase
                                .from('contacts')
                                .insert({
                                    client_id: CLIENT_ID,
                                    name: `Instagram ${senderId}`,
                                    instagram_id: senderId,
                                    source: 'instagram',
                                    status: 'active',
                                    first_contact_date: new Date().toISOString(),
                                    last_contact_date: new Date().toISOString(),
                                })
                                .select()
                                .single();
                            contact = created;
                        }

                        if (!contact) continue;

                        // Get or create conversation
                        const { data: existingConvs } = await supabase
                            .from('conversations')
                            .select('*')
                            .eq('contact_id', contact.id)
                            .eq('channel_type', 'instagram')
                            .limit(1);

                        let conversation;
                        if (existingConvs && existingConvs.length > 0) {
                            conversation = existingConvs[0];
                        } else {
                            const { data: created } = await supabase
                                .from('conversations')
                                .insert({
                                    client_id: CLIENT_ID,
                                    contact_id: contact.id,
                                    channel_type: 'instagram',
                                    status: 'open',
                                    last_message_at: new Date().toISOString(),
                                    unread_count: 0,
                                })
                                .select()
                                .single();
                            conversation = created;
                        }

                        if (!conversation) continue;

                        // Check for duplicate message
                        const msgId = message.mid || `ig_${senderId}_${timestamp}`;
                        const { data: existingMsg } = await supabase
                            .from('messages')
                            .select('id')
                            .eq('external_id', msgId)
                            .limit(1);

                        if (existingMsg && existingMsg.length > 0) continue;

                        // Determine content type
                        const hasAttachment = message.attachments && message.attachments.length > 0;
                        const mediaUrl = hasAttachment
                            ? message.attachments[0]?.payload?.url || ''
                            : '';
                        const contentType = hasAttachment
                            ? (message.attachments[0]?.type || 'image')
                            : 'text';

                        // Save message
                        await supabase.from('messages').insert({
                            conversation_id: conversation.id,
                            contact_id: contact.id,
                            sender_type: 'contact',
                            sender_id: contact.id,
                            channel_type: 'instagram',
                            content_type: contentType,
                            content: message.text || '',
                            media_url: mediaUrl || null,
                            external_id: msgId,
                            status: 'delivered',
                        });

                        // Update conversation
                        await supabase
                            .from('conversations')
                            .update({
                                last_message_at: new Date().toISOString(),
                                unread_count: (conversation.unread_count || 0) + 1,
                            })
                            .eq('id', conversation.id);

                        console.log(`[IG Webhook] Saved message to conversation ${conversation.id}`);
                    } catch (e) {
                        console.error('[IG Webhook] Error processing message:', e);
                    }
                }
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[IG Webhook] Error:', error);
        return NextResponse.json({ ok: true }); // Always return 200 to Meta
    }
}
