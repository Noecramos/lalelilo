// API Route: WhatsApp Messages Sync
// Uses WhatsApp Cloud API to check status, or falls back to WAHA
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

const WAHA_URL = process.env.WAHA_API_URL || '';
const WAHA_API_KEY = process.env.WAHA_API_KEY || '';
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';
const CLIENT_ID = process.env.DEFAULT_CLIENT_ID || 'acb4b354-728f-479d-915a-c857d27da9ad';

// WhatsApp Cloud API
const WHATSAPP_TOKEN = process.env.WHATSAPP_CLOUD_TOKEN || process.env.META_ACCESS_TOKEN || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WABA_ID = process.env.WHATSAPP_WABA_ID || '';

const useCloudApi = !!(WHATSAPP_TOKEN && PHONE_NUMBER_ID);

// GET: Sync WhatsApp — checks connection status and reports
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.WAHA_WEBHOOK_SECRET && secret !== process.env.META_VERIFY_TOKEN && secret !== 'lalelilo_verify_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Strategy 1: WhatsApp Cloud API
    if (useCloudApi) {
        try {
            // Check phone number status
            const phoneRes = await fetch(
                `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}?fields=display_phone_number,verified_name,quality_rating,status&access_token=${WHATSAPP_TOKEN}`
            );
            const phoneData = await phoneRes.json();

            if (phoneData.error) {
                return NextResponse.json({
                    success: false,
                    channel: 'whatsapp',
                    api: 'cloud',
                    error: phoneData.error.message,
                });
            }

            // Count existing WhatsApp conversations
            const { count: convCount } = await supabase
                .from('conversations')
                .select('*', { count: 'exact', head: true })
                .eq('client_id', CLIENT_ID)
                .eq('channel_type', 'whatsapp');

            // Count messages from last 24h
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const { count: msgCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('channel_type', 'whatsapp')
                .gte('created_at', yesterday.toISOString());

            return NextResponse.json({
                success: true,
                channel: 'whatsapp',
                api: 'cloud',
                synced_at: new Date().toISOString(),
                phone_number: phoneData.display_phone_number,
                verified_name: phoneData.verified_name,
                quality_rating: phoneData.quality_rating,
                phone_status: phoneData.status,
                conversations: convCount || 0,
                recent_messages_24h: msgCount || 0,
                new_messages: 0, // Cloud API uses webhooks, no pull needed
                webhook_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://lalelilo.vercel.app'}/api/webhooks/whatsapp`,
                note: 'WhatsApp Cloud API uses webhooks for real-time messages. Click sync to verify connection status.',
            });
        } catch (e: any) {
            return NextResponse.json({
                success: false,
                channel: 'whatsapp',
                api: 'cloud',
                error: e.message,
            });
        }
    }

    // Strategy 2: WAHA fallback
    if (WAHA_URL) {
        try {
            const wahaRes = await fetch(`${WAHA_URL}/api/sessions/${WAHA_SESSION}`, {
                headers: WAHA_API_KEY ? { Authorization: `Bearer ${WAHA_API_KEY}` } : {},
            });

            if (!wahaRes.ok) {
                const errorText = await wahaRes.text();
                return NextResponse.json({
                    success: false,
                    channel: 'whatsapp',
                    api: 'waha',
                    error: `WAHA error ${wahaRes.status}: ${errorText.substring(0, 200)}`,
                });
            }

            const wahaData = await wahaRes.json();
            const sessionOk = wahaData.status === 'WORKING';

            if (!sessionOk) {
                return NextResponse.json({
                    success: false,
                    channel: 'whatsapp',
                    api: 'waha',
                    error: `WAHA session: ${wahaData.status}`,
                    session_status: wahaData.status,
                });
            }

            // Try syncing chats from WAHA
            let newMessages = 0;
            let totalConversations = 0;

            try {
                const chatsRes = await fetch(`${WAHA_URL}/api/${WAHA_SESSION}/chats`, {
                    headers: WAHA_API_KEY ? { Authorization: `Bearer ${WAHA_API_KEY}` } : {},
                });
                const chats = await chatsRes.json();

                if (Array.isArray(chats)) {
                    const individualChats = chats.filter((c: any) => {
                        const id = c.id?._serialized || c.id || '';
                        return id.endsWith('@c.us');
                    });

                    for (const chat of individualChats.slice(0, 20)) {
                        const chatId = chat.id?._serialized || chat.id;
                        if (!chatId) continue;

                        const phone = chatId.replace(/@c\.us$/, '');
                        const name = chat.name || chat.pushname || '';

                        // Check if contact exists
                        const { data: existing } = await supabase
                            .from('contacts')
                            .select('id')
                            .eq('phone', phone)
                            .limit(1);

                        if (!existing || existing.length === 0) {
                            // Create contact
                            const { data: created } = await supabase
                                .from('contacts')
                                .insert({
                                    client_id: CLIENT_ID,
                                    name: name || 'WhatsApp User',
                                    phone,
                                    source: 'whatsapp',
                                    status: 'active',
                                    first_contact_date: new Date().toISOString(),
                                    last_contact_date: new Date().toISOString(),
                                })
                                .select('id')
                                .single();

                            if (created) {
                                // Create conversation
                                await supabase.from('conversations').insert({
                                    client_id: CLIENT_ID,
                                    contact_id: created.id,
                                    channel_type: 'whatsapp',
                                    status: 'open',
                                    last_message_at: new Date().toISOString(),
                                    unread_count: 0,
                                });
                                totalConversations++;
                            }
                        } else {
                            totalConversations++;
                        }
                    }
                }
            } catch (chatError) {
                console.error('[WhatsApp Sync] Error syncing chats:', chatError);
            }

            return NextResponse.json({
                success: true,
                channel: 'whatsapp',
                api: 'waha',
                synced_at: new Date().toISOString(),
                conversations: totalConversations,
                new_messages: newMessages,
                session_status: wahaData.status,
            });
        } catch (e: any) {
            return NextResponse.json({
                success: false,
                channel: 'whatsapp',
                api: 'waha',
                error: `WAHA connection failed: ${e.message}`,
            });
        }
    }

    return NextResponse.json({
        success: false,
        channel: 'whatsapp',
        error: 'No WhatsApp API configured. Set WHATSAPP_CLOUD_TOKEN or WAHA_API_URL.',
    });
}
