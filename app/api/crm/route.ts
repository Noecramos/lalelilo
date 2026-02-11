// API: CRM (Events, Contacts, Birthday Processing, Conversations)
import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingEvents, processBirthdayNotifications, createCRMEvent, getContacts, upsertContact } from '@/lib/services/crm';
import { supabase } from '@/lib/supabase';

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

    if (action === 'contact_messages') {
        const contactId = searchParams.get('contact_id');
        if (!contactId) return NextResponse.json({ error: 'contact_id required' }, { status: 400 });

        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .eq('contact_id', contactId)
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(messages || []);
    }

    if (action === 'contact_conversations') {
        const contactId = searchParams.get('contact_id');
        if (!contactId) return NextResponse.json({ error: 'contact_id required' }, { status: 400 });

        const { data: conversations, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('contact_id', contactId)
            .order('last_message_at', { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(conversations || []);
    }

    if (action === 'lead_metrics') {
        const shopId = searchParams.get('shop_id') || undefined;
        const { getLeadMetrics } = await import('@/lib/services/crm');
        const { data } = await getLeadMetrics(clientId, shopId);
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

    if (action === 'find_or_create_contact') {
        const { findOrCreateContact } = await import('@/lib/services/crm');
        const { data, error, isNew } = await findOrCreateContact(body);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ contact: data, isNew }, { status: isNew ? 201 : 200 });
    }

    if (action === 'qualify_lead') {
        const { qualifyLead } = await import('@/lib/services/crm');
        const { contactId } = body;
        if (!contactId) return NextResponse.json({ error: 'contactId required' }, { status: 400 });
        const { data, error } = await qualifyLead(contactId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }

    if (action === 'assign_lead') {
        const { assignLeadToShop } = await import('@/lib/services/crm');
        const { data, error } = await assignLeadToShop(body);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }

    if (action === 'update_status') {
        const { updateContactStatus } = await import('@/lib/services/crm');
        const { contactId, status } = body;
        if (!contactId || !status) return NextResponse.json({ error: 'contactId and status required' }, { status: 400 });
        const { data, error } = await updateContactStatus(contactId, status);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
