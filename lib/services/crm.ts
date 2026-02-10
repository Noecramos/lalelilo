// Lalelilo - Module 5: CRM & User Management

import { createClient } from '@supabase/supabase-js';
import { createNotification } from './core';
import { buildBirthdayMessage } from './waha';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const getSupabase = () => createClient(supabaseUrl, supabaseKey);

// ============================================================================
// CRM EVENTS
// ============================================================================

export async function getUpcomingEvents(clientId: string, daysAhead = 7) {
    const supabase = getSupabase();
    const today = new Date();
    const future = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    // For recurring events (birthdays), match month+day
    const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const futureMMDD = `${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;

    const { data: events } = await supabase
        .from('crm_events')
        .select('*, contact:contacts(id, name, phone, email)')
        .eq('client_id', clientId)
        .eq('notification_sent', false);

    if (!events?.length) return { data: [] };

    // Filter for events in the upcoming window
    const upcoming = events.filter(e => {
        const eventDate = new Date(e.event_date);
        if (e.is_recurring) {
            const eMMDD = `${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
            return eMMDD >= todayMMDD && eMMDD <= futureMMDD;
        }
        return eventDate >= today && eventDate <= future;
    });

    return { data: upcoming };
}

export async function processBirthdayNotifications(clientId: string) {
    const { data: events } = await getUpcomingEvents(clientId, 0); // Today only
    if (!events?.length) return { processed: 0 };

    const supabase = getSupabase();
    let processed = 0;

    for (const event of events) {
        if (event.event_type !== 'birthday') continue;
        const contact = event.contact as { name: string; phone: string } | null;
        if (!contact?.phone) continue;

        const promoCode = event.metadata?.promo_code as string | undefined;

        await createNotification({
            type: 'birthday',
            body: buildBirthdayMessage(contact.name || 'Cliente', promoCode),
            phoneNumber: contact.phone,
            metadata: { event_id: event.id, contact_id: event.contact_id },
        });

        await supabase.from('crm_events').update({
            notification_sent: true,
            notification_sent_at: new Date().toISOString(),
        }).eq('id', event.id);

        processed++;
    }

    return { processed };
}

export async function createCRMEvent(params: {
    clientId: string; contactId: string; eventType: string;
    eventDate: string; title?: string; description?: string;
    isRecurring?: boolean; metadata?: Record<string, unknown>;
}) {
    const supabase = getSupabase();
    return supabase.from('crm_events').insert({
        client_id: params.clientId, contact_id: params.contactId,
        event_type: params.eventType, event_date: params.eventDate,
        title: params.title, description: params.description,
        is_recurring: params.isRecurring || false, metadata: params.metadata || {},
    }).select().single();
}

// ============================================================================
// CONTACTS
// ============================================================================

export async function upsertContact(params: {
    clientId: string; phone?: string; name?: string; email?: string;
    instagramId?: string; facebookId?: string; tags?: string[];
}) {
    const supabase = getSupabase();

    // Try to find existing contact by phone, instagram, or facebook
    let existing = null;
    if (params.phone) {
        const { data } = await supabase.from('contacts').select('id')
            .eq('client_id', params.clientId).eq('phone', params.phone).single();
        existing = data;
    }
    if (!existing && params.instagramId) {
        const { data } = await supabase.from('contacts').select('id')
            .eq('client_id', params.clientId).eq('instagram_id', params.instagramId).single();
        existing = data;
    }

    if (existing) {
        return supabase.from('contacts').update({
            name: params.name, email: params.email,
            instagram_id: params.instagramId, facebook_id: params.facebookId,
            tags: params.tags || [],
        }).eq('id', existing.id).select().single();
    }

    return supabase.from('contacts').insert({
        client_id: params.clientId, phone: params.phone, name: params.name,
        email: params.email, instagram_id: params.instagramId,
        facebook_id: params.facebookId, tags: params.tags || [],
    }).select().single();
}

export async function getContacts(clientId: string, search?: string, limit = 50) {
    const supabase = getSupabase();
    let query = supabase.from('contacts').select('*').eq('client_id', clientId)
        .order('updated_at', { ascending: false }).limit(limit);
    if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    return query;
}
