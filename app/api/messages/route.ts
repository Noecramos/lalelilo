import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// GET /api/messages - Fetch internal messages for super-admin or shop
export async function GET(request: NextRequest) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing');
        return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const shopId = searchParams.get('shopId');
        const isAdmin = searchParams.get('isAdmin') === 'true';

        let query = supabase
            .from('internal_messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (isAdmin) {
            if (shopId) {
                // Admin viewing conversation with specific shop
                query = query.or(`sender_id.eq.${shopId},recipient_id.eq.${shopId}`);
            } else {
                // Admin viewing all messages for conversation list
                query = query.limit(500);
            }
        } else if (shopId) {
            // Shop viewing its own messages + broadcasts
            let targetShopId = shopId;

            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetShopId);
            if (!isUuid) {
                const { data: shop } = await supabase
                    .from('shops')
                    .select('id')
                    .eq('slug', targetShopId)
                    .single();
                if (shop) {
                    targetShopId = shop.id;
                } else {
                    return NextResponse.json({ messages: [] });
                }
            }

            query = query.or(`recipient_id.eq.${targetShopId},sender_id.eq.${targetShopId},recipient_id.eq.all`);
        } else {
            return NextResponse.json({ error: 'Missing shopId or isAdmin param' }, { status: 400 });
        }

        const { data: messages, error } = await query;

        if (error) {
            console.error('Error fetching internal messages:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/messages - Send a new internal message
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sender_type, sender_id, recipient_id, content, is_broadcast } = body;

        if (!content || !sender_type || !sender_id || !recipient_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let finalSenderId = sender_id;

        // If sender is a shop and ID looks like a slug, resolve it
        if (sender_type === 'shop') {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sender_id);
            if (!isUuid) {
                const { data: shop } = await supabase
                    .from('shops')
                    .select('id')
                    .eq('slug', sender_id)
                    .single();
                if (shop) {
                    finalSenderId = shop.id;
                }
            }
        }

        const { data: message, error } = await supabase
            .from('internal_messages')
            .insert({
                sender_type,
                sender_id: finalSenderId,
                recipient_id,
                content,
                is_broadcast: is_broadcast || false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error sending internal message:', error);
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
            .from('internal_messages')
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

// DELETE /api/messages - Delete a message
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const messageId = searchParams.get('id');

        if (!messageId) {
            return NextResponse.json({ error: 'Missing message id' }, { status: 400 });
        }

        const { data: deleted, error } = await supabase
            .from('internal_messages')
            .delete()
            .eq('id', messageId)
            .select('id');

        if (error) {
            console.error('Error deleting message:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, deleted_count: deleted?.length || 0 });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
