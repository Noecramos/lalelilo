// Webhook: Meta (Instagram + Facebook inbound messages)
import { NextRequest, NextResponse } from 'next/server';
import { handleInboundMessage } from '@/lib/services/messaging';

const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'lalelilo_verify';
const DEFAULT_CLIENT_ID = process.env.DEFAULT_CLIENT_ID || '';

// Webhook verification (Meta requires this)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// Receive messages
export async function POST(req: NextRequest) {
    const body = await req.json();

    // Process each entry
    for (const entry of body.entry || []) {
        // Instagram messages
        if (entry.messaging) {
            for (const event of entry.messaging) {
                if (!event.message) continue;

                const isInstagram = entry.id !== process.env.META_PAGE_ID;

                await handleInboundMessage({
                    clientId: DEFAULT_CLIENT_ID,
                    channelType: isInstagram ? 'instagram' : 'facebook',
                    senderInstagramId: isInstagram ? event.sender?.id : undefined,
                    senderFacebookId: !isInstagram ? event.sender?.id : undefined,
                    senderName: '',
                    contentType: event.message.attachments ? 'image' : 'text',
                    content: event.message.text || '',
                    mediaUrl: event.message.attachments?.[0]?.payload?.url,
                    externalId: event.message.mid || '',
                });
            }
        }
    }

    return NextResponse.json({ ok: true });
}
