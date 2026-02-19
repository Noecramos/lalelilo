// Webhook: WhatsApp Cloud API (Official Meta WhatsApp Business Platform)
// Receives incoming messages and status updates
import { NextRequest, NextResponse } from 'next/server';
import { handleInboundMessage } from '@/lib/services/messaging';
import { handleBotMessage } from '@/lib/services/bot';

const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'lalelilo_verify_2026';
const DEFAULT_CLIENT_ID = process.env.DEFAULT_CLIENT_ID || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

// GET: Webhook verification (Meta requires this)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('[WhatsApp Webhook] Verification request:', { mode, token, hasChallenge: !!challenge });

    if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
        console.log('[WhatsApp Webhook] Verification successful');
        return new NextResponse(challenge, { status: 200 });
    }

    console.log('[WhatsApp Webhook] Verification failed');
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// POST: Receive incoming messages
export async function POST(req: NextRequest) {
    const body = await req.json();

    console.log('[WhatsApp Webhook] Received:', JSON.stringify(body).substring(0, 500));

    // WhatsApp Cloud API sends notifications in this format
    if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
                if (change.field !== 'messages') continue;

                const value = change.value;
                if (!value) continue;

                // Process incoming messages
                const incomingMessages = value.messages || [];
                const contacts = value.contacts || [];

                for (const msg of incomingMessages) {
                    // Skip status updates
                    if (!msg.type) continue;

                    // Get sender info
                    const senderPhone = msg.from || '';
                    const contactInfo = contacts.find((c: any) => c.wa_id === senderPhone);
                    const senderName = contactInfo?.profile?.name || '';

                    // Extract message content based on type
                    let content = '';
                    let contentType = 'text';
                    let mediaUrl = '';

                    switch (msg.type) {
                        case 'text':
                            content = msg.text?.body || '';
                            contentType = 'text';
                            break;
                        case 'image':
                            content = msg.image?.caption || '';
                            contentType = 'image';
                            mediaUrl = msg.image?.id || ''; // Need to download via API
                            break;
                        case 'video':
                            content = msg.video?.caption || '';
                            contentType = 'video';
                            break;
                        case 'audio':
                            content = '[Áudio]';
                            contentType = 'audio';
                            break;
                        case 'document':
                            content = msg.document?.caption || msg.document?.filename || '[Documento]';
                            contentType = 'document';
                            break;
                        case 'sticker':
                            content = '[Sticker]';
                            contentType = 'sticker';
                            break;
                        case 'location':
                            content = `📍 Localização: ${msg.location?.latitude}, ${msg.location?.longitude}`;
                            contentType = 'location';
                            break;
                        case 'contacts':
                            content = '[Contato compartilhado]';
                            contentType = 'contact';
                            break;
                        case 'reaction':
                            // Skip reactions
                            continue;
                        case 'interactive':
                            content = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '[Resposta interativa]';
                            contentType = 'text';
                            break;
                        default:
                            content = `[${msg.type}]`;
                            contentType = msg.type;
                    }

                    // Store message in database
                    try {
                        await handleInboundMessage({
                            clientId: DEFAULT_CLIENT_ID,
                            channelType: 'whatsapp',
                            senderPhone,
                            senderName,
                            contentType,
                            content,
                            mediaUrl: mediaUrl || undefined,
                            externalId: msg.id || '',
                        });

                        console.log('[WhatsApp Webhook] Message stored:', {
                            from: senderPhone,
                            type: msg.type,
                            content: content.substring(0, 50),
                        });
                    } catch (e) {
                        console.error('[WhatsApp Webhook] Error storing message:', e);
                    }

                    // Process with AI bot if it's a text message
                    if (content.trim() && msg.type === 'text') {
                        try {
                            await handleBotMessage({
                                phone: senderPhone,
                                message: content,
                                contactName: senderName,
                                channelType: 'whatsapp',
                            });
                        } catch (e) {
                            console.error('[WhatsApp Webhook] Bot error:', e);
                        }
                    }
                }

                // Process status updates (sent, delivered, read, failed)
                const statuses = value.statuses || [];
                for (const status of statuses) {
                    console.log('[WhatsApp Webhook] Status update:', {
                        id: status.id,
                        status: status.status,
                        recipient: status.recipient_id,
                    });
                    // Could update message status in DB here
                }
            }
        }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ ok: true });
}
