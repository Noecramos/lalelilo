import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

// GET /api/messages - Fetch messages for a specific shop or super-admin
export async function GET(request: NextRequest) {
    // Debug: Check if service Key is available (don't log the actual key)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables');
        return NextResponse.json({ error: 'Configuration Error: Missing Service Role Key' }, { status: 500 });
    }

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
            // We need to be careful with UUID vs Slug. shopId passed here is likely a UUID if called from internal logic,
            // but if called from frontend using slug, we need to handle that.

            let targetShopId = shopId || '';

            // Simple check: is it a valid UUID? If not, treat as slug.
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetShopId);

            if (!isUuid && targetShopId) {
                const { data: shop } = await supabase
                    .from('shops')
                    .select('id')
                    .eq('slug', targetShopId)
                    .single();

                if (shop) {
                    targetShopId = shop.id;
                } else {
                    return NextResponse.json({ messages: [] }); // or error
                }
            }

            query = query.or(`recipient_id.eq.${targetShopId},sender_id.eq.${targetShopId},recipient_id.eq.all`);
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
            .from('messages')
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

// DELETE /api/messages - Delete a message by ID or all messages in a conversation
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const messageId = searchParams.get('id');
        const conversationId = searchParams.get('conversationId');

        console.log('[DELETE /api/messages] messageId:', messageId, 'conversationId:', conversationId);
        console.log('[DELETE /api/messages] SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

        if (!messageId && !conversationId) {
            return NextResponse.json({ error: 'Missing message id or conversationId' }, { status: 400 });
        }

        if (conversationId) {
            // Delete all messages in conversation, then the conversation itself
            const { data: deletedMsgs, error: msgError } = await supabase
                .from('messages')
                .delete()
                .eq('conversation_id', conversationId)
                .select('id');

            console.log('[DELETE] Deleted messages:', deletedMsgs?.length, 'error:', msgError?.message);

            if (msgError) {
                return NextResponse.json({ error: msgError.message, detail: 'Failed to delete messages' }, { status: 500 });
            }

            // Also delete the conversation record
            const { error: convError } = await supabase
                .from('conversations')
                .delete()
                .eq('id', conversationId);

            console.log('[DELETE] Conversation delete error:', convError?.message);

            return NextResponse.json({
                success: true,
                deleted_messages: deletedMsgs?.length || 0,
                conversation_deleted: !convError,
            });
        } else if (messageId) {
            // First verify the message exists
            const { data: existing } = await supabase
                .from('messages')
                .select('id')
                .eq('id', messageId)
                .single();

            console.log('[DELETE] Message exists:', !!existing);

            const { data: deleted, error } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId)
                .select('id');

            console.log('[DELETE] Deleted:', deleted, 'error:', error?.message);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                deleted_count: deleted?.length || 0,
                message_existed: !!existing,
            });
        }

        return NextResponse.json({ error: 'No valid parameters' }, { status: 400 });
    } catch (error) {
        console.error('[DELETE /api/messages] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error', detail: String(error) }, { status: 500 });
    }
}
