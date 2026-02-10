// API: Messaging (Conversations, Messages, Send)
import { NextRequest, NextResponse } from 'next/server';
import { getConversations, getMessages, sendMessage, handleInboundMessage } from '@/lib/services/messaging';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'messages') {
        const convId = searchParams.get('conversation_id');
        if (!convId) return NextResponse.json({ error: 'conversation_id required' }, { status: 400 });
        const { data, error } = await getMessages(convId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }

    // Default: list conversations
    const clientId = searchParams.get('client_id');
    if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 });

    const { data, error } = await getConversations({
        clientId,
        status: searchParams.get('status') || undefined,
        channelType: searchParams.get('channel_type') || undefined,
        assignedTo: searchParams.get('assigned_to') || undefined,
        shopId: searchParams.get('shop_id') || undefined,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { action } = body;

    if (action === 'send') {
        const { conversationId, senderId, content, contentType, mediaUrl } = body;
        if (!conversationId || !senderId || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const { data, error } = await sendMessage({ conversationId, senderId, content, contentType, mediaUrl });
        if (error) return NextResponse.json({ error }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    }

    if (action === 'inbound') {
        const { data, error } = await handleInboundMessage(body);
        if (error) return NextResponse.json({ error: (error as Error).message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
