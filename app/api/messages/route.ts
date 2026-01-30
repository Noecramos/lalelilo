import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/messages - Fetch messages for a specific shop or super-admin
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const shopId = searchParams.get('shopId'); // If present, fetching for this shop
        const isAdmin = searchParams.get('isAdmin') === 'true';

        let query = supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (isAdmin) {
            // Super Admin: Fetch all messages OR specific conversation if shopId provided
            if (shopId) {
                // Fetch conversation with specific shop
                query = query.or(`sender_id.eq.${shopId},recipient_id.eq.${shopId}`);
            } else {
                // Fetch "recent" messages for list view? 
                // Alternatively, client filters. For now fetch last 500 to keep it simple
                query = query.limit(500);
            }
        } else if (shopId) {
            // Shop Admin: Fetch messages for this shop AND broadcasts
            query = query.or(`recipient_id.eq.${shopId},sender_id.eq.${shopId},recipient_id.eq.all`);
        } else {
            return NextResponse.json({ error: 'Missing shopId or isAdmin param' }, { status: 400 });
        }

        const { data: messages, error } = await query;

        if (error) {
            console.error('Error fetching messages:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sender_type, sender_id, recipient_id, content, is_broadcast } = body;

        // Validation
        if (!content || !sender_type || !sender_id || !recipient_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                sender_type,
                sender_id,
                recipient_id,
                content,
                is_broadcast: is_broadcast || false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error sending message:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/messages - Mark messages as read
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { message_ids, read_at } = body;

        if (!message_ids || !Array.isArray(message_ids)) {
            return NextResponse.json({ error: 'Invalid message_ids' }, { status: 400 });
        }

        const { error } = await supabase
            .from('messages')
            .update({ read_at: read_at || new Date().toISOString() })
            .in('id', message_ids);

        if (error) {
            console.error('Error updating messages:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
