// API: CRM (Events, Contacts, Birthday Processing)
import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingEvents, processBirthdayNotifications, createCRMEvent, getContacts, upsertContact } from '@/lib/services/crm';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const clientId = searchParams.get('client_id');
    if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 });

    if (action === 'upcoming_events') {
        const days = parseInt(searchParams.get('days') || '7');
        const { data } = await getUpcomingEvents(clientId, days);
        return NextResponse.json(data);
    }

    if (action === 'contacts') {
        const search = searchParams.get('search') || undefined;
        const { data, error } = await getContacts(clientId, search);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { action } = body;

    if (action === 'process_birthdays') {
        const { clientId } = body;
        if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 });
        const result = await processBirthdayNotifications(clientId);
        return NextResponse.json(result);
    }

    if (action === 'create_event') {
        const { data, error } = await createCRMEvent(body);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    }

    if (action === 'upsert_contact') {
        const { data, error } = await upsertContact(body);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
