// API: Tickets (Kanban)
import { NextRequest, NextResponse } from 'next/server';
import { getTickets, createTicket, updateTicketStatus, addTicketComment, getAuditHeatmap } from '@/lib/services/audit';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'heatmap') {
        const clientId = searchParams.get('client_id');
        if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 });
        const { data } = await getAuditHeatmap({
            clientId,
            startDate: searchParams.get('start_date') || undefined,
            endDate: searchParams.get('end_date') || undefined,
        });
        return NextResponse.json(data);
    }

    const { data, error } = await getTickets({
        shopId: searchParams.get('shop_id') || undefined,
        status: searchParams.get('status') || undefined,
        assignedTo: searchParams.get('assigned_to') || undefined,
        type: searchParams.get('type') || undefined,
        priority: searchParams.get('priority') || undefined,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
        const { clientId, shopId, title, description, type, priority, assignedTo, createdBy, dueDate } = body;
        if (!clientId || !shopId || !title || !type || !priority || !createdBy) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const { data, error } = await createTicket({
            clientId, shopId, title, description, type, priority, assignedTo, createdBy, dueDate,
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    }

    if (action === 'update_status') {
        const { ticketId, status, changedBy } = body;
        if (!ticketId || !status || !changedBy) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const { data, error } = await updateTicketStatus(ticketId, status, changedBy);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }

    if (action === 'comment') {
        const { ticketId, userId, content, mediaUrl } = body;
        if (!ticketId || !userId || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        const { data, error } = await addTicketComment(ticketId, userId, content, mediaUrl);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
