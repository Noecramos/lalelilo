// Webhook: WAHA (WhatsApp inbound messages)
import { NextRequest, NextResponse } from 'next/server';
import { handleInboundMessage } from '@/lib/services/messaging';

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

    // Extract sender phone (remove @c.us suffix)
    const phone = payload.from?.replace('@c.us', '').replace('55', '') || '';

    await handleInboundMessage({
        clientId: DEFAULT_CLIENT_ID,
        channelType: 'whatsapp',
        senderPhone: phone,
        senderName: payload.notifyName || payload._data?.notifyName || '',
        contentType: payload.hasMedia ? (payload.type || 'image') : 'text',
        content: payload.body || '',
        mediaUrl: payload.mediaUrl || undefined,
        externalId: payload.id?._serialized || payload.id || '',
    });

    return NextResponse.json({ ok: true });
}
