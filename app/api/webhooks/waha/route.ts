// Webhook: WAHA (WhatsApp inbound messages) with Gemini AI Bot
import { NextRequest, NextResponse } from 'next/server';
import { handleInboundMessage } from '@/lib/services/messaging';
import { handleBotMessage } from '@/lib/services/bot';

const WAHA_WEBHOOK_SECRET = process.env.WAHA_WEBHOOK_SECRET || '';
const DEFAULT_CLIENT_ID = process.env.DEFAULT_CLIENT_ID || '';

export async function POST(req: NextRequest) {
    // Verify webhook secret if configured
    const authHeader = req.headers.get('authorization');
    if (WAHA_WEBHOOK_SECRET && authHeader !== `Bearer ${WAHA_WEBHOOK_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // WAHA sends different event types
    if (body.event !== 'message') {
        return NextResponse.json({ ok: true, skipped: true });
    }

    const payload = body.payload;
    if (!payload || payload.fromMe) {
        return NextResponse.json({ ok: true, skipped: true });
    }

    // Extract sender phone (remove @c.us suffix and country code)
    const phone = payload.from?.replace('@c.us', '').replace('55', '') || '';
    const message = payload.body || '';
    const senderName = payload.notifyName || payload._data?.notifyName || '';

    // 1. Store message in database (for history)
    await handleInboundMessage({
        clientId: DEFAULT_CLIENT_ID,
        channelType: 'whatsapp',
        senderPhone: phone,
        senderName,
        contentType: payload.hasMedia ? (payload.type || 'image') : 'text',
        content: message,
        mediaUrl: payload.mediaUrl || undefined,
        externalId: payload.id?._serialized || payload.id || '',
    });

    // 2. Process with AI bot (handles lead creation + shop selection)
    if (message.trim()) {
        await handleBotMessage({
            phone,
            message,
            contactName: senderName,
            channelType: 'whatsapp'
        });
    }

    return NextResponse.json({ ok: true });
}
