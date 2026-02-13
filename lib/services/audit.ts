// Lalelilo - Module 4: Audit & Quality Control
// Smart Checklists, Auto-Ticket Creation, Analytics

import { createClient } from '@supabase/supabase-js';
import { logActivity, createNotification } from './core';
import { awardXP } from './gamification';
import { buildTicketCreatedMessage } from './waha';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const getSupabase = () => createClient(supabaseUrl, supabaseKey);

// ============================================================================
// CHECKLIST TEMPLATES
// ============================================================================

export async function createChecklistTemplate(params: {
    clientId: string;
    name: string;
    description?: string;
    category?: string;
    createdBy: string;
    items: Array<{
        section?: string;
        question: string;
        input_type: string;
        is_required?: boolean;
        options?: unknown[];
        conditional_rules?: Record<string, unknown>;
        fail_values?: unknown[];
        auto_ticket_on_fail?: boolean;
        ticket_priority?: string;
    }>;
}) {
    const supabase = getSupabase();

    const { data: template, error: tplError } = await supabase
        .from('checklist_templates')
        .insert({
            client_id: params.clientId,
            name: params.name,
            description: params.description,
            category: params.category,
            created_by: params.createdBy,
        })
        .select()
        .single();

    if (tplError || !template) return { error: tplError };

    // Insert items
    const itemRows = params.items.map((item, idx) => ({
        template_id: template.id,
        order_index: idx,
        section: item.section,
        question: item.question,
        input_type: item.input_type,
        is_required: item.is_required ?? true,
        options: item.options || [],
        conditional_rules: item.conditional_rules || {},
        fail_values: item.fail_values || [],
        auto_ticket_on_fail: item.auto_ticket_on_fail || false,
        ticket_priority: item.ticket_priority || 'medium',
    }));

    await supabase.from('checklist_template_items').insert(itemRows);

    return { data: template };
}

export async function getChecklistTemplates(clientId: string) {
    const supabase = getSupabase();
    return supabase
        .from('checklist_templates')
        .select('*, items:checklist_template_items(*)')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
}

// ============================================================================
// CHECKLIST SUBMISSION (Core Business Logic)
// ============================================================================

interface SubmissionResponse {
    template_item_id: string;
    question: string;
    input_type: string;
    response_value?: string;
    response_bool?: boolean;
    response_media_url?: string;
    notes?: string;
}

export async function submitChecklist(params: {
    templateId: string;
    clientId: string;
    shopId: string;
    submittedBy: string;
    responses: SubmissionResponse[];
    notes?: string;
}) {
    const supabase = getSupabase();

    // Get template items for validation
    const { data: templateItems } = await supabase
        .from('checklist_template_items')
        .select('*')
        .eq('template_id', params.templateId)
        .order('order_index');

    if (!templateItems?.length) return { error: new Error('Template not found or empty') };

    // Build item map for lookup
    const itemMap = new Map(templateItems.map(i => [i.id, i]));

    // Validate responses and check conditionals
    let failedItems = 0;
    const processedResponses: Array<SubmissionResponse & { is_pass: boolean }> = [];
    const ticketsToCreate: Array<{ question: string; priority: string; itemId: string }> = [];

    for (const response of params.responses) {
        const templateItem = itemMap.get(response.template_item_id);
        if (!templateItem) continue;

        // Check if response is a pass or fail
        let isPass = true;

        if (templateItem.fail_values && templateItem.fail_values.length > 0) {
            const failVals = templateItem.fail_values as string[];

            if (response.input_type === 'boolean') {
                isPass = !failVals.includes(String(response.response_bool));
            } else if (response.response_value) {
                isPass = !failVals.includes(response.response_value.toLowerCase());
            }
        }

        // Apply conditional rules
        // Example: { "condition": "equals", "trigger_value": "bad", "require": ["photo"] }
        const rules = templateItem.conditional_rules as Record<string, unknown>;
        if (rules && Object.keys(rules).length > 0) {
            const requireFields = (rules.require as string[]) || [];

            if (requireFields.includes('photo') && !isPass && !response.response_media_url) {
                // Photo required on fail but not provided — still mark as fail
                console.warn(`[Audit] Photo required for failed item: ${response.question}`);
            }
        }

        if (!isPass) {
            failedItems++;

            // Auto-create ticket if configured
            if (templateItem.auto_ticket_on_fail) {
                ticketsToCreate.push({
                    question: response.question,
                    priority: templateItem.ticket_priority || 'medium',
                    itemId: templateItem.id,
                });
            }
        }

        processedResponses.push({ ...response, is_pass: isPass });
    }

    // Calculate score (percentage of passed items)
    const totalItems = processedResponses.length;
    const score = totalItems > 0 ? ((totalItems - failedItems) / totalItems) * 100 : 100;

    // Create submission
    const { data: submission, error: subError } = await supabase
        .from('checklist_submissions')
        .insert({
            template_id: params.templateId,
            client_id: params.clientId,
            shop_id: params.shopId,
            submitted_by: params.submittedBy,
            status: 'completed',
            score,
            total_items: totalItems,
            failed_items: failedItems,
            notes: params.notes,
        })
        .select()
        .single();

    if (subError || !submission) return { error: subError };

    // Insert responses
    const responseRows = processedResponses.map(r => ({
        submission_id: submission.id,
        template_item_id: r.template_item_id,
        question: r.question,
        input_type: r.input_type,
        response_value: r.response_value,
        response_bool: r.response_bool,
        response_media_url: r.response_media_url,
        is_pass: r.is_pass,
        notes: r.notes,
    }));

    await supabase.from('checklist_responses').insert(responseRows);

    // Auto-create tickets for failed items
    const createdTickets = [];
    for (const ticket of ticketsToCreate) {
        const { data: newTicket } = await createTicket({
            clientId: params.clientId,
            shopId: params.shopId,
            title: `[Auto] Não-conformidade: ${ticket.question}`,
            description: `Gerado automaticamente pela auditoria.\nChecklist: ${params.templateId}\nItem: ${ticket.question}`,
            type: 'non_conformity',
            priority: ticket.priority as 'low' | 'medium' | 'high' | 'critical',
            sourceType: 'checklist_submission',
            sourceId: submission.id,
            createdBy: params.submittedBy,
        });
        if (newTicket) createdTickets.push(newTicket);
    }

    // Award XP
    await awardXP({
        userId: params.submittedBy,
        reason: 'checklist.submitted',
        sourceType: 'checklist_submission',
        sourceId: submission.id,
        shopId: params.shopId,
    });

    // Activity log
    await logActivity({
        actorId: params.submittedBy,
        action: 'checklist.submitted',
        entityType: 'checklist_submission',
        entityId: submission.id,
        shopId: params.shopId,
        clientId: params.clientId,
        metadata: { score, failed_items: failedItems, tickets_created: createdTickets.length },
    });

    return {
        data: {
            submission,
            score,
            failed_items: failedItems,
            tickets_created: createdTickets,
        },
    };
}

// ============================================================================
// TICKETS (Kanban)
// ============================================================================

export async function createTicket(params: {
    clientId: string;
    shopId: string;
    title: string;
    description?: string;
    type: 'maintenance' | 'non_conformity' | 'general' | 'task';
    priority: 'low' | 'medium' | 'high' | 'critical';
    sourceType?: string;
    sourceId?: string;
    assignedTo?: string;
    createdBy: string;
    dueDate?: string;
}) {
    const supabase = getSupabase();

    const { data, error } = await supabase.from('tickets').insert({
        client_id: params.clientId,
        shop_id: params.shopId,
        title: params.title,
        description: params.description,
        type: params.type,
        priority: params.priority,
        status: 'to_do',
        source_type: params.sourceType,
        source_id: params.sourceId,
        assigned_to: params.assignedTo,
        created_by: params.createdBy,
        due_date: params.dueDate,
    }).select().single();

    if (!error && data) {
        // Notify assigned user
        if (params.assignedTo) {
            const { data: assignee } = await supabase
                .from('users')
                .select('phone')
                .eq('id', params.assignedTo)
                .single();

            const { data: shop } = await supabase
                .from('shops')
                .select('name')
                .eq('id', params.shopId)
                .single();

            if (assignee?.phone) {
                await createNotification({
                    userId: params.assignedTo,
                    type: 'ticket_assigned',
                    body: buildTicketCreatedMessage(params.title, shop?.name || '', params.priority),
                    phoneNumber: assignee.phone,
                });
            }
        }
    }

    return { data, error };
}

export async function getTickets(filters: {
    shopId?: string;
    status?: string;
    assignedTo?: string;
    type?: string;
    priority?: string;
    limit?: number;
}) {
    const supabase = getSupabase();
    let query = supabase
        .from('tickets')
        .select(`
      *,
      assigned_user:users!assigned_to(id, name, avatar_url),
      created_by_user:users!created_by(id, name),
      shop:shops(id, name),
      comments:ticket_comments(count)
    `)
        .order('created_at', { ascending: false })
        .limit(filters.limit || 50);

    if (filters.shopId) query = query.eq('shop_id', filters.shopId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.priority) query = query.eq('priority', filters.priority);

    return query;
}

export async function updateTicketStatus(
    ticketId: string,
    newStatus: string,
    changedBy: string,
) {
    const supabase = getSupabase();

    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'resolved') updateData.resolved_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select()
        .single();

    if (!error && data && newStatus === 'resolved') {
        // Award XP to resolver
        await awardXP({
            userId: changedBy,
            reason: 'ticket.resolved',
            sourceType: 'ticket',
            sourceId: ticketId,
        });
    }

    return { data, error };
}

export async function addTicketComment(ticketId: string, userId: string, content: string, mediaUrl?: string) {
    const supabase = getSupabase();
    return supabase.from('ticket_comments').insert({
        ticket_id: ticketId,
        user_id: userId,
        content,
        media_url: mediaUrl,
    }).select().single();
}

// ============================================================================
// AUDIT ANALYTICS (Heatmap)
// ============================================================================

export async function getAuditHeatmap(params: {
    clientId: string;
    startDate?: string;
    endDate?: string;
}) {
    const supabase = getSupabase();

    let query = supabase
        .from('tickets')
        .select('shop_id, type, priority, status, created_at, shop:shops(id, name, region_id)')
        .eq('client_id', params.clientId);

    if (params.startDate) query = query.gte('created_at', params.startDate);
    if (params.endDate) query = query.lte('created_at', params.endDate);

    const { data: tickets } = await query;
    if (!tickets?.length) return { data: { shops: {}, types: {}, total: 0 } };

    // Aggregate by shop
    const shopCounts: Record<string, { total: number; by_type: Record<string, number>; by_priority: Record<string, number>; shop_name: string }> = {};

    for (const t of tickets) {
        const shopId = t.shop_id || 'unknown';
        if (!shopCounts[shopId]) {
            shopCounts[shopId] = {
                total: 0,
                by_type: {},
                by_priority: {},
                shop_name: ((t.shop as unknown) as { name: string } | null)?.name || 'Unknown',
            };
        }
        shopCounts[shopId].total++;
        shopCounts[shopId].by_type[t.type] = (shopCounts[shopId].by_type[t.type] || 0) + 1;
        shopCounts[shopId].by_priority[t.priority] = (shopCounts[shopId].by_priority[t.priority] || 0) + 1;
    }

    return {
        data: {
            shops: shopCounts,
            total: tickets.length,
        },
    };
}
