// Lalelilo - Core Services (Activity Log, Notifications, Attachments)
// These are cross-cutting services used by ALL modules

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

function getSupabase() {
    return createClient(supabaseUrl, supabaseServiceKey);
}

// ============================================================================
// ACTIVITY LOG
// ============================================================================

interface LogActivityParams {
    actorId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    shopId?: string;
    clientId: string;
    ipAddress?: string;
}

export async function logActivity(params: LogActivityParams) {
    const supabase = getSupabase();
    const { error } = await supabase.from('activity_log').insert({
        actor_id: params.actorId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        metadata: params.metadata || {},
        shop_id: params.shopId,
        client_id: params.clientId,
        ip_address: params.ipAddress,
    });
    if (error) console.error('[ActivityLog] Failed to log:', error.message);
}

export async function getActivityLog(filters: {
    entityType?: string;
    entityId?: string;
    shopId?: string;
    actorId?: string;
    limit?: number;
    offset?: number;
}) {
    const supabase = getSupabase();
    let query = supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters.limit || 50)
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

    if (filters.entityType) query = query.eq('entity_type', filters.entityType);
    if (filters.entityId) query = query.eq('entity_id', filters.entityId);
    if (filters.shopId) query = query.eq('shop_id', filters.shopId);
    if (filters.actorId) query = query.eq('actor_id', filters.actorId);

    return query;
}

// ============================================================================
// NOTIFICATIONS QUEUE
// ============================================================================

interface CreateNotificationParams {
    userId?: string;
    type: string;
    channel?: string;
    title?: string;
    body: string;
    phoneNumber?: string;
    metadata?: Record<string, unknown>;
    scheduledFor?: string;
}

export async function createNotification(params: CreateNotificationParams) {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('notifications').insert({
        user_id: params.userId,
        type: params.type,
        channel: params.channel || 'whatsapp',
        title: params.title,
        body: params.body,
        phone_number: params.phoneNumber,
        metadata: params.metadata || {},
        scheduled_for: params.scheduledFor,
        status: 'pending',
    }).select().single();

    if (error) console.error('[Notification] Failed to create:', error.message);
    return { data, error };
}

export async function getPendingNotifications(limit = 50) {
    const supabase = getSupabase();
    return supabase
        .from('notifications')
        .select('*')
        .eq('status', 'pending')
        .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
        .order('created_at', { ascending: true })
        .limit(limit);
}

export async function markNotificationSent(id: string, error?: string) {
    const supabase = getSupabase();
    return supabase.from('notifications').update({
        status: error ? 'failed' : 'sent',
        sent_at: error ? null : new Date().toISOString(),
        error: error || null,
        retry_count: error ? 1 : 0, // Will be incremented on retry
    }).eq('id', id);
}

// ============================================================================
// NOTIFICATION PROCESSOR (runs inside Next.js — no n8n)
// ============================================================================

import { sendText } from './waha';

export async function processNotificationQueue() {
    const { data: notifications, error } = await getPendingNotifications(20);
    if (error || !notifications?.length) return { processed: 0, errors: 0 };

    let processed = 0;
    let errors = 0;

    for (const notif of notifications) {
        if (!notif.phone_number) {
            await markNotificationSent(notif.id, 'No phone number');
            errors++;
            continue;
        }

        const result = await sendText({
            phone: notif.phone_number,
            text: notif.body,
        });

        if (result.error) {
            await markNotificationSent(notif.id, result.error);
            errors++;
        } else {
            await markNotificationSent(notif.id);
            processed++;
        }
    }

    return { processed, errors };
}

// ============================================================================
// ATTACHMENTS
// ============================================================================

interface CreateAttachmentParams {
    uploadedBy?: string;
    entityType: string;
    entityId: string;
    fileUrl: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
}

export async function createAttachment(params: CreateAttachmentParams) {
    const supabase = getSupabase();
    return supabase.from('attachments').insert({
        uploaded_by: params.uploadedBy,
        entity_type: params.entityType,
        entity_id: params.entityId,
        file_url: params.fileUrl,
        file_name: params.fileName,
        file_type: params.fileType,
        file_size: params.fileSize,
    }).select().single();
}

export async function getAttachments(entityType: string, entityId: string) {
    const supabase = getSupabase();
    return supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });
}

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================

export async function getSetting(key: string) {
    const supabase = getSupabase();
    const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .single();
    return data?.value;
}

export async function setSetting(key: string, value: unknown, category: string, description?: string, updatedBy?: string) {
    const supabase = getSupabase();
    return supabase.from('system_settings').upsert({
        key,
        value: JSON.stringify(value),
        category,
        description,
        updated_by: updatedBy,
    }, { onConflict: 'key' });
}
